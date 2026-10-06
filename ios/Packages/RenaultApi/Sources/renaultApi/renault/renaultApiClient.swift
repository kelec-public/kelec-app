//
//  renaultApiClient.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

import Foundation

@available(iOS 15.0, *)
@available(watchOS 6.0, *)
@available(macOS 12.0, *)

enum API_VERSION: String, CustomStringConvertible {
    case V1 = "v1"
    case V2 = "v2"

    var description: String {
        return self.rawValue
    }
}

enum KAMEREON_ENDPOINT: String, CustomStringConvertible {
    case BATTERY_STATUS = "battery-status"
    case LOCATION = "location"
    case COCKPIT = "cockpit"

    var description: String {
        return self.rawValue
    }
}

public struct RenaultApiClient: ApiClient {

    private var myRenaultUser: String
    private var myRenaultPass: String
    private var kamereonAccountId: String
    private var gigyaURL = "gigya-prod-eu1.renaultgroup.com"
    private var gigyaAPI: String
    private var kamareonURL = "api-wired-prod-1-euw1.wrd-aws.com"
    private var kamareonAPI: String
    private var cookieValue: String = "";
    // debug messages (the app writes them in its widget logs)
    private let logger: (String) -> Void

    public init(username: String, password: String, kamereonAccountId: String, gigyaApiKey: String, kamareonApiKey: String, logger: @escaping (String) -> Void = { _ in }) {
        self.myRenaultUser = username
        self.myRenaultPass = password
        self.kamereonAccountId = kamereonAccountId
        self.gigyaAPI = gigyaApiKey
        self.kamareonAPI = kamareonApiKey
        self.logger = logger
    }

    public mutating func setPassword(password: String) {
        self.myRenaultPass = password
    }
    
    public mutating func setCookieValue(cookieValue: String) {
        self.cookieValue = cookieValue
    }

    public func getVehicleInfo(vin: String) async throws -> ApiHandler {
        // then get jwt token
        guard
            let jwtSession = try? await self.getJWTToken(
                cookieValue: self.cookieValue)
        else {
            throw ApiClientError.serverError
        }

        //then fetch battery status
        guard
            let batteryStatus = try? await self.getKamereonStatus(
                jwtToken: jwtSession.id_token, vin: vin, kamareonAccountId: self.kamereonAccountId,
                apiVersion: API_VERSION.V2, endpoint: KAMEREON_ENDPOINT.BATTERY_STATUS)
        else {
            throw ApiClientError.serverError
        }

        // then try to parse battery status into an api handler
        let jsonDecoder = JSONDecoder()
        guard
            let parsedBatteryStatus = try? jsonDecoder.decode(
                RenaultAppCarApi.self, from: batteryStatus)
        else {
            throw ApiClientError.decodeError
        }

        var renaultApiHandler = RenaultApiHandler(
            batteryStatus: parsedBatteryStatus.data.attributes)

        do {
            let cockpitStatus = try await self.getCockpit(vin: vin, jwt_token: jwtSession.id_token)
            renaultApiHandler.setCockpitStatus(cockpitStatus: cockpitStatus)

        } catch {
            print("Error fetching cockpit status for vin \(vin): \(error)")
        }
        return renaultApiHandler

    }

    public func launchHvac(vin: String) async throws -> Bool {
        // then get jwt token
        guard
            let jwtSession = try? await self.getJWTToken(
                cookieValue: self.cookieValue)
        else {
            throw ApiClientError.serverError
        }

        // then get hvac response data
        guard
            let hvacLaunch = try? await self.launchActionHVAC(
                jwtToken: jwtSession.id_token, vin: vin, kamareonAccountId: self.kamereonAccountId)
        else {
            throw ApiClientError.serverError
        }

        // then try to parse hvac response
        let jsonDecoder = JSONDecoder()
        guard
            let parsedHvacResponse = try? jsonDecoder.decode(
                RenaultHVACResponse.self, from: hvacLaunch)
        else {
            throw ApiClientError.decodeError
        }

        if parsedHvacResponse.data.type == "HvacStart" && parsedHvacResponse.data.id != nil {
            return true  // successfully launched hvac
        }

        return false  // unable to launch hvac

    }

    // step 2
    private func getJWTToken(cookieValue: String) async throws -> JWTTokenFetch {
        var components = URLComponents()
        components.scheme = "https"
        components.host = self.gigyaURL
        components.path = "/accounts.getJWT"

        let actualURL = components.url!
        var urlRequest = URLRequest(url: actualURL)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        let bodyItems = [
            URLQueryItem(name: "login_token", value: cookieValue),
            URLQueryItem(name: "fields", value: "data.personId,data.gigyaDataCenter"),
            URLQueryItem(name: "expiration", value: "1800"),
            URLQueryItem(name: "APIKey", value: self.gigyaAPI),
        ]
        var bodyComponents = URLComponents()
        bodyComponents.queryItems = bodyItems
        urlRequest.httpBody = bodyComponents.query?.data(using: .utf8)
        guard let (data, _) = try? await URLSession.shared.data(for: urlRequest) else {
            logger("ERROR : UNABLE TO FETCH JWT TOKEN FROM URL \(actualURL)")
            throw ApiClientError.invalidURL
        }
        guard let jwtToken = try? JSONDecoder().decode(JWTTokenFetch.self, from: data) else {
            let str = String(decoding: data, as: UTF8.self)
            logger("ERROR : UNABLE TO DECODE ACCOUNT TOKEN FROM URL :  \(str)")
            throw ApiClientError.missingData
        }
        logger("JWT token fetch and decode OK.")
        return jwtToken
    }

    // step 3
    private func getKamereonStatus(
        jwtToken: String, vin: String, kamareonAccountId: String, apiVersion: API_VERSION,
        endpoint: KAMEREON_ENDPOINT
    ) async throws -> Data {
        var components = URLComponents()
        components.scheme = "https"
        components.host = self.kamareonURL
        components.path =
            "/commerce/v1/accounts/\(kamareonAccountId)/kamereon/kca/car-adapter/\(apiVersion)/cars/\(vin)/\(endpoint)"
        components.queryItems = [
            URLQueryItem(name: "country", value: "FR")
        ]

        let actualURL = components.url!
        var urlRequest = URLRequest(url: actualURL)
        urlRequest.setValue(self.kamareonAPI, forHTTPHeaderField: "apikey")
        urlRequest.setValue(jwtToken, forHTTPHeaderField: "x-gigya-id_token")
        urlRequest.setValue("application/vnd.api+json", forHTTPHeaderField: "Content-Type")
        guard let (data, _) = try? await URLSession.shared.data(for: urlRequest) else {
            logger("ERROR : UNABLE TO FETCH BATTERY STATUS FROM URL \(urlRequest)")
            throw ApiClientError.invalidURL
        }
        logger("battery status ok.")
        return data
    }

    private func launchActionHVAC(jwtToken: String, vin: String, kamareonAccountId: String)
        async throws -> Data
    {
        var components = URLComponents()
        components.scheme = "https"
        components.host = self.kamareonURL
        components.path =
            "/commerce/v1/accounts/\(kamareonAccountId)/kamereon/kca/car-adapter/v1/cars/\(vin)/actions/hvac-start"
        components.queryItems = [
            URLQueryItem(name: "country", value: "FR")
        ]
        guard let url = components.url else {
            throw ApiClientError.invalidURL
        }
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"

        let body: [String: Any] = [
            "data": [
                "type": "HvacStart",
                "id": "-------",
                "attributes": [
                    "action": "start",
                    "id": "-------",
                    "targetTemperature": 22,
                ],
            ]
        ]
        let finalBody = try? JSONSerialization.data(withJSONObject: body)
        urlRequest.setValue(self.kamareonAPI, forHTTPHeaderField: "apikey")
        urlRequest.setValue(jwtToken, forHTTPHeaderField: "x-gigya-id_token")
        urlRequest.setValue("application/vnd.api+json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = finalBody

        guard let (data, _) = try? await URLSession.shared.data(for: urlRequest) else {
            logger("ERROR : UNABLE TO LAUNCH HVAC STATUS FROM URL \(urlRequest)")
            throw ApiClientError.invalidURL
        }

        return data

    }

    public func getMapCoordinates(vin: String) async throws -> (Latitude, Longitude) {
        // then get jwt token
        guard
            let jwtSession = try? await self.getJWTToken(
                cookieValue: self.cookieValue)
        else {
            throw ApiClientError.serverError
        }

        //then fetch battery status
        guard
            let batteryStatus = try? await self.getKamereonStatus(
                jwtToken: jwtSession.id_token, vin: vin, kamareonAccountId: self.kamereonAccountId,
                apiVersion: API_VERSION.V1, endpoint: KAMEREON_ENDPOINT.LOCATION)
        else {
            throw ApiClientError.serverError
        }

        // then try to parse battery status into an api handler
        let jsonDecoder = JSONDecoder()
        guard
            let parsedBatteryStatus = try? jsonDecoder.decode(
                RenaultAppLocationApi.self, from: batteryStatus)
        else {
            throw ApiClientError.decodeError
        }

        return (
            parsedBatteryStatus.data.attributes.gpsLatitude ?? 0.0,
            parsedBatteryStatus.data.attributes.gpsLongitude ?? 0.0
        )

    }

    public func getCockpit(vin: String, jwt_token: String) async throws -> RenaultCockpitStatus {
        // try to fetch cockpit status
        guard
            let cockpitStatus = try? await self.getKamereonStatus(
                jwtToken: jwt_token, vin: vin, kamareonAccountId: self.kamereonAccountId,
                apiVersion: API_VERSION.V1, endpoint: KAMEREON_ENDPOINT.COCKPIT)
        else {
            throw ApiClientError.serverError
        }

        // then try to parse cockpit status
        let jsonDeocder = JSONDecoder()
        guard
            let parsedCockpitStatus = try? jsonDeocder.decode(
                RenaultAppCockpitApi.self, from: cockpitStatus)
        else {
            throw ApiClientError.decodeError
        }

        return parsedCockpitStatus.data.attributes
    }

}
