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

// charge status, same cases as the RN app (getChargeText of the api handlers).
// getChargeText and getIsV2GorV2L are derived from it.
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
    
    func getChargeStatus() -> ChargeStatus
    
    func getMapLatitude()->Latitude
    func getMapLongitude()->Longitude
    
    func getMilage(appPreferences: AppPreferences?) -> Double
    // odometer in km, nil when the car maker didn't return it
    func getOdometerInKm() -> Double?
}

extension ApiHandler{
    public func getCarMaker()->CarMaker{
        return self.carMaker
    }

    // "EN CHARGE | " (translated), "" when the car is not plugged in
    public func getChargeText() -> String {
        switch getChargeStatus() {
        case .notPlugged: return ""
        case .notCharging: return localized("NE CHARGE PAS | ")
        case .charging: return localized("EN CHARGE | ")
        case .scheduled: return localized("CHARGE PLANIFIÉE | ")
        case .ended: return localized("CHARGE TERMINÉE | ")
        case .v2g: return "V2G | "
        case .v2l: return "V2L | "
        }
    }

    public func getIsV2GorV2L() -> Bool {
        let chargeStatus = getChargeStatus()
        return chargeStatus == .v2g || chargeStatus == .v2l
    }
}
