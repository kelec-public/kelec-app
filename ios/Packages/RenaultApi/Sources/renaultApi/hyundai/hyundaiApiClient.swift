//
//  hyundaiApiClient.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

import Foundation

public struct HyundaiApiClient: ApiClient{

    private var email: String
    private var password: String
    private var pin: String
    private var baseURL = "bluelink.selme.se"
    public init(email: String, password: String, pin: String){
        self.email = email
        self.password = password
        self.pin = pin
    }
    
    public mutating func setPassword(password: String) {
        self.password = password
    }
    
    public func setCookieValue(cookieValue: String) {
        return
    }
    
    public func getVehicleInfo(vin: String) async throws -> ApiHandler{
        var components = URLComponents()
        components.scheme = "https"
        components.host = self.baseURL
        components.path = "/car/status"
        guard let url = components.url else {
            throw ApiClientError.invalidURL
        }
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        
        let body: [String: String] = ["email": self.email, "password": self.password,  "pin": self.pin, "vin": vin]
               let finalBody = try? JSONSerialization.data(withJSONObject: body)
        urlRequest.addValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = finalBody

        
        guard let (data, _ ) = try? await URLSession.shared.data(for: urlRequest) else {
            throw ApiClientError.serverError
        }
        
        guard let vehicleStatus = try? JSONDecoder().decode(HyundaiLayerReturn.self, from: data) else {
            throw ApiClientError.decodeError
        }
        
        return HyundaiApiHandler(apiData: vehicleStatus)
        
    }
    
    
    public func launchHvac(vin: String) async throws -> Bool {
        var components = URLComponents()
        components.scheme = "https"
        components.host = self.baseURL
        components.path = "/car/launchHVAC"
        guard let url = components.url else {
            throw ApiClientError.invalidURL
        }
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        
        let body: [String: String ] = [
            "email": self.email,
            "password": self.password,
            "pin": self.pin,
            "vin": vin,
            "temperature": "22"
        ]
        print(body)
        let finalBody = try? JSONSerialization.data(withJSONObject: body)
        urlRequest.addValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = finalBody
        
        guard let (data, _) = try? await URLSession.shared.data(for: urlRequest) else {
            print("server error")
            throw ApiClientError.serverError
        }
        
        
        guard let hvacResponse = try? JSONDecoder().decode(HyundaiHVACLaunchResponse.self, from: data) else {
            throw ApiClientError.decodeError
        }
        
        if(hvacResponse.message == "OK"){
            return true //hvac has been launched
        }
        
        return false // unable to launch hvac
        
    }
    
    public func getMapCoordinates(vin: String) async throws -> (Latitude, Longitude) {
        guard let apiHandler = try? await getVehicleInfo(vin: vin) else {
            throw ApiClientError.serverError
        }
        
        
        return (apiHandler.getMapLatitude(), apiHandler.getMapLongitude())
        
        
    }
    
}




