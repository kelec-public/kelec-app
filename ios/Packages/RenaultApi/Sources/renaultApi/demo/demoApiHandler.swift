//
//  demoApiHandler.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

import Foundation

public struct DemoApiHandler: ApiHandler{
    
    public var carMaker: CarMaker
    public var demoCar: DemoCar
    
    public init(vin: String){
        self.carMaker = CarMaker.DEMO
        self.demoCar = DemoCar(vin: vin)
    }
    
    public func getVehicleData() -> VehicleData {
        return .demo
    }
    public func getLastRefreshDate() -> String {
        return Date().ISO8601Format()
    }
    
    public func getIsCarPlugged() -> Bool {
        return true
    }
    
    public func getBatteryLevel() -> Int {
        return demoCar.batteryLevel
    }
    
    public func getBatteryRange(appPreferences: AppPreferences?) -> Int {
        return getRange(range: demoCar.range, appPreferences: appPreferences)
    }
    
    public func getIsCarCharging() -> Bool {
        return demoCar.chargeStatus == .charging
    }
    
    public func getChargingRemainingTime() -> Int {
        return demoCar.chargingRemainingTime
    }
    
    public func getIsCarLocked() -> Bool {
        return demoCar.isLocked
    }
    
    public func getChargeLimit() -> Int {
        return demoCar.chargeLimit
    }
    
    public func getChargeInstantaneousPowerInWatts() -> Double {
        return demoCar.chargeInstantaneousPowerInWatts
    }

    public func getChargeStatus() -> ChargeStatus {
        return demoCar.chargeStatus
    }
    
    public func getMapLatitude() -> Latitude {
        return demoCar.latitude
    }
    
    public func getMapLongitude() -> Longitude {
        return demoCar.longitude
    }
    
    public func getMilage(appPreferences: AppPreferences?) -> Double {
        if appPreferences?.displayMiles == true {
            return demoCar.mileage * 0.621371
        }
        return demoCar.mileage
    }
    
    public func getOdometerInKm() -> Double? {
        return demoCar.mileage
    }
}
