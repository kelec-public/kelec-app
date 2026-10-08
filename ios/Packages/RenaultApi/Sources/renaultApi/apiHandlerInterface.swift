//
//  File.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

import Foundation

// raw data returned by the car maker API (what the app keeps in its cache)
public enum VehicleData {
    case renault(RenaultBatteryStatus)
    case hyundai(HyundaiLayerReturn)
    case demo
}

// charge status, same cases as the RN app (getChargeText of the api handlers)
public enum ChargeStatus: String, CaseIterable {
    case notPlugged
    case notCharging
    case charging
    case scheduled
    case ended
    case v2g
    case v2l
}

public protocol ApiHandler: Codable, Decodable{
    var carMaker: CarMaker { get set }

    func getVehicleData() -> VehicleData
    
    func getLastRefreshDate()-> String
    func getIsCarPlugged()->Bool
    func getBatteryLevel()->Int
    func getBatteryRange(appPreferences: AppPreferences?)->Int
    func getIsCarCharging()->Bool
    // how many minutes until fully charged
    func getChargingRemainingTime()->Int
    
    func getIsCarLocked()->Bool
    
    func getChargeLimit()->Int
    
    func getChargeInstantaneousPowerInWatts()->Double
    
    func getChargeText()->String

    func getChargeStatus() -> ChargeStatus
    
    func getMapLatitude()->Latitude
    func getMapLongitude()->Longitude
    
    func getMilage(appPreferences: AppPreferences?) -> Double
    // odometer in km, nil when the car maker didn't return it
    func getOdometerInKm() -> Double?
    
    func getIsV2GorV2L() -> Bool
    
    
}

extension ApiHandler{
    public func getCarMaker()->CarMaker{
        return self.carMaker
    }
}
