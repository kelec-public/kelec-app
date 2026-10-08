//
//  demoApiClient.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

import Foundation

public struct DemoApiClient: ApiClient{
    public mutating func setPassword(password: String) {
        return 
    }
    
    public func setCookieValue(cookieValue: String) {
        return
    }
    
    public func launchHvac(vin: String, temperature: Int) async throws -> Bool {
        return true
    }
    
    public init(){
        
    }
    
    public func getVehicleInfo(vin: String) async throws -> ApiHandler {
        return DemoApiHandler()
    }
    
    public func getMapCoordinates(vin: String) async throws -> (Latitude, Longitude) {
        guard let handler = try? await getVehicleInfo(vin: vin) else {
            throw ApiClientError.serverError
        }
        
        return (handler.getMapLatitude(), handler.getMapLongitude())
    }
    
    
    
    

}
