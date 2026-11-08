//
//  File.swift
//
//
//  Created by Kelyan PEGEOT SELME on 09/12/2023.
//

import Foundation

@available(iOS 15.0, *)
@available(watchOS 6.0, *)
@available(macOS 12.0, *)
public struct rteApi {
    private var basicAuth: String
    private var apiUrl = "digital.iservices.rte-france.com"
    // debug messages (the app writes them in its widget logs). Never log the credentials nor the token.
    private let logger: (String) -> Void
    // longest part of a response body written in the logs
    private static let maxLoggedBodyLength = 300

    public init(basicAuth: String, logger: @escaping (String) -> Void = { _ in }) {
        self.basicAuth = basicAuth
        self.logger = logger
    }

    // sends the request, logs and throws `error` when the request fails or the status is not 2xx
    private func send(_ urlRequest: URLRequest, step: String, error: rteApiError) async throws -> Data {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: urlRequest)
        } catch let requestError {
            // network or TLS error (e.g. untrusted certificate: NSURLErrorDomain -1202)
            let nsError = requestError as NSError
            logger("RTE \(step): request failed (\(nsError.domain) \(nsError.code)): \(nsError.localizedDescription)")
            throw error
        }
        guard let httpResponse = response as? HTTPURLResponse else {
            logger("RTE \(step): no HTTP response")
            throw error
        }
        guard (200..<300).contains(httpResponse.statusCode) else {
            logger("RTE \(step): HTTP \(httpResponse.statusCode): \(bodyExcerpt(data))")
            throw error
        }
        return data
    }

    // start of the response body, for the logs (only for error responses and public data)
    private func bodyExcerpt(_ data: Data) -> String {
        String(decoding: data.prefix(Self.maxLoggedBodyLength), as: UTF8.self)
    }

    func getAuthToken() async throws -> AuthReturn? {
        guard !basicAuth.isEmpty else {
            logger("RTE token: RTE_BASIC_AUTH is empty")
            throw rteApiError.tokenServerError
        }
        var components = URLComponents()
        components.scheme = "https"
        components.host = self.apiUrl
        components.path = "/token/oauth/"
        guard let url = components.url else {
            throw ApiClientError.invalidURL
        }
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("Basic \(self.basicAuth)", forHTTPHeaderField: "Authorization")
        let data = try await send(urlRequest, step: "token", error: .tokenServerError)
        do {
            return try JSONDecoder().decode(AuthReturn.self, from: data)
        } catch let decodeError {
            // the body is not logged: it may contain the token
            logger("RTE token: unable to decode the response (\(data.count) bytes): \(decodeError)")
            throw rteApiError.tokenDecodeError
        }
    }

    func getApiTempoCalendar(bearerToken: String, startDate: Date, endDate: Date) async throws -> TempoCalendarReturn? {
        var components = URLComponents()
        components.scheme = "https"
        components.host = self.apiUrl
        components.path = "/open_api/tempo_like_supply_contract/v1/tempo_like_calendars"
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        formatter.timeZone = TimeZone(identifier: "Europe/Paris")
        
        let startStr = formatter.string(from: startDate)
        let endStr = formatter.string(from: endDate)
        
        components.queryItems = [
            URLQueryItem(name: "start_date", value: startStr),
            URLQueryItem(name: "end_date", value: endStr)
        ]
    
        
        components.percentEncodedQuery = components.percentEncodedQuery?.replacingOccurrences(of: "+", with: "%2B")
        
        guard let url = components.url else {
            logger("RTE calendar: invalid URL")
            throw rteApiError.tempoCalendarServerError
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")
        
        let data = try await send(urlRequest, step: "calendar \(startStr) - \(endStr)", error: .tempoCalendarServerError)
        do {
            return try JSONDecoder().decode(TempoCalendarReturn.self, from: data)
        } catch let decodeError {
            logger("RTE calendar: unable to decode the response: \(decodeError) - \(bodyExcerpt(data))")
            throw rteApiError.tempoCalendarDecodeError
        }
    }

    public func getTempo() async throws -> tempoFinalReturn {
        let bearerToken = try await self.getAuthToken()
        guard let bearerToken else {
            throw rteApiError.tokenServerError
        }
        
        var calendar = Calendar.current
        calendar.timeZone = TimeZone(identifier: "Europe/Paris") ?? .current
        let today = calendar.startOfDay(for: Date())
        let startDate = calendar.date(byAdding: .day, value: -1, to: today)!
        let endDate = calendar.date(byAdding: .day, value: 2, to: today)!
        
        let apiTempoCalendar = try await self.getApiTempoCalendar(bearerToken: bearerToken.access_token, startDate: startDate, endDate: endDate)
        guard let apiTempoCalendar else {
            throw rteApiError.tempoCalendarServerError
        }
        
        let values = apiTempoCalendar.tempo_like_calendars.values
        logger("RTE calendar: \(values.map { "\($0.start_date) \($0.value)" }.joined(separator: ", "))")
        for value in values where parseTimestamp(date: value.start_date) == nil {
            logger("RTE calendar: unable to parse the date \(value.start_date), the current date is used")
        }
        
        let sortedValues = values.sorted { lhs, rhs in
            convertTimestamp(date: lhs.start_date) < convertTimestamp(date: rhs.start_date)
        }
        
        guard sortedValues.count >= 2 else {
            logger("RTE calendar: \(sortedValues.count) day(s), at least 2 needed")
            throw rteApiError.tempoCalculationError
        }
        
        let latest = sortedValues[sortedValues.count - 1]
        let previous = sortedValues[sortedValues.count - 2]
        
        let latestDate = convertTimestamp(date: latest.start_date)
        let previousDate = convertTimestamp(date: previous.start_date)
        
        let latestDateStart = calendar.startOfDay(for: latestDate)
        let daysFromToday = calendar.dateComponents([.day], from: today, to: latestDateStart).day ?? 0
        let latestIsTomorrow = (daysFromToday == 1)
        
        return tempoFinalReturn(
            previousColour: previous.value, previousDate: previousDate, latestColour: latest.value, latestDate: latestDate, latestIsTomorrow: latestIsTomorrow
        )
    }

    func convertTimestamp(date: String) -> Date {
        parseTimestamp(date: date) ?? Date.now
    }

    private func parseTimestamp(date: String) -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZZZZZZ"
        return formatter.date(from: date)
    }

    public func getHPPrice(colour: String) -> Float {
        switch colour {
        case "BLUE":
            return 16.12
        case "RED":
            return 70.60
        case "WHITE":
            return 18.71
        default:
            return 0
        }
    }

    public func getHCPrice(colour: String) -> Float {
        switch colour {
        case "BLUE":
            return 13.25
        case "WHITE":
            return 14.99
        case "RED":
            return 15.75
        default:
            return 0
        }
    }

}

public enum rteApiError: Error {
    case tokenServerError
    case tokenDecodeError
    case tempoCalendarServerError
    case tempoCalendarDecodeError
    case tempoCalculationError
}

public struct AuthReturn: Codable {
    let access_token: String
    let token_type: String
    let expires_in: Int
}

public struct TempoCalendarReturn: Codable {
    public let tempo_like_calendars: TempoCalendars
}

public struct TempoCalendars: Codable {
    public let start_date: String
    public let end_date: String
    public let values: [TempoCalendarsValue]
}

public struct TempoCalendarsValue: Codable {
    public let start_date: String
    public let end_date: String
    public let value: String
    public let updated_date: String
}

public struct tempoFinalReturn: Codable {
    public let previousColour: String // couleur de l'avant dernier jour connu
    public let previousDate: Date // date de l'avant dernier jour connu
    public let latestColour: String // couleur du dernier jour connu
    public let latestDate: Date // date du dernier jour connu
    public let latestIsTomorrow: Bool // est ce que le dernier jour connu est demain ou aujourd'ui
    
    public init(previousColour: String, previousDate: Date, latestColour: String, latestDate: Date, latestIsTomorrow: Bool) {
        self.previousColour = previousColour
        self.previousDate = previousDate
        self.latestColour = latestColour
        self.latestDate = latestDate
        self.latestIsTomorrow = latestIsTomorrow
    }
}
