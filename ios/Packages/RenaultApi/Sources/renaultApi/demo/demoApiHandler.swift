//
//  demoApiHandler.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

import Foundation
import SwiftUI

public struct DemoApiHandler: ApiHandler{
    
    public func getApiData() -> Any {
        return ""
    }
    public func getLastRefreshDate() -> String {
        return Date().ISO8601Format()
    }
    
    public func getIsCarPlugged() -> Bool {
        return true
    }
    
    public func getBatteryLevel() -> Int {
        return 52
    }
    
    public func getBatteryRange(appPreferences: AppPreferences?) -> Int {
        let range = 156
        return getRange(range: range, appPreferences: appPreferences)
    }
    
    public func getIsCarCharging() -> Bool {
        return true
    }
    
    public func getChargingRemainingTime() -> Int {
        return 120
    }
    
    public func getIsCarLocked() -> Bool {
        return true
    }
    
    public func getChargeLimit() -> Int {
        return 80
    }
    
    public func getChargeInstantaneousPowerInWatts() -> Double {
        return 7200
    }
    
    public func getChargeText() -> String {
        return LocalizedStringKey("EN CHARGE | ").stringValue()
    }
    
    public var carMaker: CarMaker
    
    public init(){
        self.carMaker = CarMaker.DEMO
    }
    
    public func getMapLatitude() -> Latitude {
        return 48.854700
    }
    
    public func getMapLongitude() -> Longitude {
        return 2.347749
    }
    
    public func getMilage(appPreferences: AppPreferences?) -> Double {
        return 134234.2
    }
    
    public func getIsV2GorV2L() -> Bool {
        return false
    }
    
}
