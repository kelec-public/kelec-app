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

    public init(basicAuth: String) {
        self.basicAuth = basicAuth

    }

    func getAuthToken() async throws -> AuthReturn? {
        var components = URLComponents()
        components.scheme = "https"
        components.host = self.apiUrl
        components.path = "/token/oauth/"
        var urlRequest = URLRequest(url: URL(string: components.string!)!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("Basic \(self.basicAuth)", forHTTPHeaderField: "Authorization")
        guard let (data, _) = try? await URLSession.shared.data(for: urlRequest) else {
            throw rteApiError.tokenServerError
        }
        guard let bearerToken = try? JSONDecoder().decode(AuthReturn.self, from: data) else {
            throw rteApiError.tokenDecodeError
        }
        return bearerToken
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
            throw rteApiError.tempoCalendarServerError
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")
        
        guard let (data, _) = try? await URLSession.shared.data(for: urlRequest) else {
            throw rteApiError.tempoCalendarServerError
        }
        
        guard let tempoCalendar = try? JSONDecoder().decode(TempoCalendarReturn.self, from: data) else {
            throw rteApiError.tempoCalendarDecodeError
        }
        
        return tempoCalendar
    }

    public func getTempo() async throws -> tempoFinalReturn {
        guard let bearerToken = try? await self.getAuthToken() else {
            throw rteApiError.tokenServerError
        }
        
        var calendar = Calendar.current
        calendar.timeZone = TimeZone(identifier: "Europe/Paris") ?? .current
        let today = calendar.startOfDay(for: Date())
        let startDate = calendar.date(byAdding: .day, value: -1, to: today)!
        let endDate = calendar.date(byAdding: .day, value: 2, to: today)!
        
        guard let apiTempoCalendar = try? await self.getApiTempoCalendar(bearerToken: bearerToken.access_token, startDate: startDate, endDate: endDate) else {
            throw rteApiError.tempoCalendarServerError
        }
        
        let sortedValues = apiTempoCalendar.tempo_like_calendars.values.sorted { lhs, rhs in
            convertTimestamp(date: lhs.start_date) < convertTimestamp(date: rhs.start_date)
        }
        
        guard sortedValues.count >= 2 else {
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

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZZZZZZ"
        return (formatter.date(from: date) ?? Date.now)
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
