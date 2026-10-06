//
//  renaultApiHandler.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

import Foundation
import SwiftUI

public struct RenaultApiHandler: ApiHandler{
    
    
    public var carMaker: CarMaker
    public let batteryStatus: RenaultBatteryStatus
    private var cockpitStatus: RenaultCockpitStatus?
    
    public init(batteryStatus: RenaultBatteryStatus){
        self.batteryStatus = batteryStatus
        self.carMaker = CarMaker.RENAULT
    }
    
    public mutating func setCockpitStatus(cockpitStatus: RenaultCockpitStatus) -> Void {
        self.cockpitStatus = cockpitStatus
    }
    
    public func getApiData() -> Any {
        return self.batteryStatus
    }
    
    public func getLastRefreshDate() -> String {
        return self.batteryStatus.timestamp
    }
    
    public func getIsCarPlugged() -> Bool {
        return self.batteryStatus.plugStatus == 1
    }
    
    public func getBatteryLevel() -> Int {
        return self.batteryStatus.batteryLevel ?? 0
    }
    
    public func getBatteryRange(appPreferences: AppPreferences?) -> Int {
        let range = self.batteryStatus.batteryAutonomy ?? 0
        return getRange(range: range, appPreferences: appPreferences)
    }
    
    public func getIsCarCharging() -> Bool {
        return self.batteryStatus.chargingStatus == 1.0
    }
    
    public func getChargingRemainingTime() -> Int {
        return self.batteryStatus.chargingRemainingTime ?? 0
    }
    
    public func getIsCarLocked() -> Bool {
        // not supported on renault cars
        return true
    }
    
    public func getChargeLimit() -> Int {
        // not supported on renault yet
        return 0
    }
    
    public func getChargeInstantaneousPowerInWatts() -> Double {
        return self.batteryStatus.chargingInstantaneousPower ?? 0
    }
    
    public func getChargeText() -> String {
        let actualChargingStatus = (self.batteryStatus.chargingStatus ?? 0).rounded(toPlaces: 1)
        if(self.getIsCarPlugged() == false){
            return ""
        }else{
            switch(actualChargingStatus){
            case 0.1:
                return LocalizedStringKey("CHARGE PLANIFIÉE | ").stringValue()
            case 0.2:
                return LocalizedStringKey("CHARGE TERMINÉE | ").stringValue()
            case 0.3:
                return LocalizedStringKey("CHARGE PLANIFIÉE | ").stringValue()
            case 1.0:
                return LocalizedStringKey("EN CHARGE | ").stringValue()
            default:
                return LocalizedStringKey("NE CHARGE PAS | ").stringValue()
            }
        }
        
    }
    
    public func getMapLatitude() -> Latitude {
        //API HANDLER NOT USED ON RENAULT TO GET LOCATION
        return 0
    }
    public func getMapLongitude() -> Longitude {
        //API HANDLER NOT USED ON RENAULT TO GET LOCATION
        return 0
    }
    
    public func getMilage(appPreferences: AppPreferences?) -> Double {
        guard var range = self.cockpitStatus?.totalMileage else {
            return -1
        }
        
        if(appPreferences?.displayMiles == true){
            range = range * 0.621371;
        }
        
        return range
    }
    
    public func getIsV2GorV2L() -> Bool {
        let actualChargingStatus = (self.batteryStatus.chargingStatus ?? 0).rounded(toPlaces: 1)
        return actualChargingStatus <= -1.3;
    }
    
    
    
    
    
}
