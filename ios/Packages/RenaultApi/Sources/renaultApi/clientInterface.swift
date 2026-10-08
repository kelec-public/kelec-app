//
//  File.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

public typealias Longitude = Double
public typealias Latitude = Double

import Foundation

public protocol ApiClient {
    mutating func setPassword(password: String) -> Void
    mutating func setCookieValue(cookieValue: String) -> Void // uniquement pour Renault group
    func getVehicleInfo(vin: String) async throws -> ApiHandler
    // temperature: target temperature in °C
    func launchHvac(vin: String, temperature: Int) async throws -> Bool
    func getMapCoordinates(vin: String) async throws -> (Latitude, Longitude)
}
