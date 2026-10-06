//
//  hyundaiApiHandler.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

import Foundation
import SwiftUI

public struct HyundaiApiHandler: ApiHandler {
    
    public func getApiData() -> Any {
        return self.apiData
    }
    public var carMaker: CarMaker
    private let apiData: HyundaiLayerReturn
    
    public init(apiData: HyundaiLayerReturn){
        self.apiData = apiData
        self.carMaker = CarMaker.HYUNDAI
    }
    
    
    public func getLastRefreshDate() -> String {
        let refreshDate = self.apiData.status.vehicleStatus.time
          let refreshDateYear = String(refreshDate.prefix(4))
          let refreshDateMonth = String(refreshDate.dropFirst(4).prefix(2))
          let refreshDateDay = String(refreshDate.dropFirst(6).prefix(2))
          let refreshDateHour = String(refreshDate.dropFirst(8).prefix(2))
          let refreshDateMinute = String(refreshDate.dropFirst(10).prefix(2))
          let refreshDateSecond = String(refreshDate.dropFirst(12).prefix(2))

          let refreshDateFull = "\(refreshDateYear)-\(refreshDateMonth)-\(refreshDateDay)T\(refreshDateHour):\(refreshDateMinute):\(refreshDateSecond)Z"
        
        return refreshDateFull
    }
    
    public func getIsCarPlugged() -> Bool {
        return self.apiData.status.vehicleStatus.evStatus.batteryPlugin != 0
    }
    
    public func getBatteryLevel() -> Int {
        return self.apiData.status.vehicleStatus.evStatus.batteryStatus
    }
    
    public func getBatteryRange(appPreferences: AppPreferences?) -> Int {
        return self.apiData.status.vehicleStatus.evStatus.drvDistance[0].rangeByFuel.evModeRange.value
    }
    
    public func getIsCarCharging() -> Bool {
        return self.apiData.status.vehicleStatus.evStatus.batteryCharge
    }
    
    public func getChargingRemainingTime() -> Int {
        return self.apiData.status.vehicleStatus.evStatus.remainTime2?.atc.value ?? 0
    }
    
    public func getIsCarLocked() -> Bool {
        return self.apiData.status.vehicleStatus.doorLock
    }
    
    public func getChargeLimit() -> Int {
        let chargingLimit = getHyundaiChargingLimit(hyundaiApi: self.apiData)
        return chargingLimit
    }
    
    public func getChargeInstantaneousPowerInWatts() -> Double {
        let batterySize = 38 // in kWh. Must be edited to take into account the carType set in the app
        let totalEnergy = Double(self.getChargeLimit()) * self.getAvailableEnergy() / Double(self.getBatteryLevel()) // on calcul l'energie totale à charger en kWh
        let toCharge = totalEnergy - self.getAvailableEnergy() // on calcule l'energie restante à charger en kWh
        let estimatedPower = 60 * toCharge / Double(self.getChargingRemainingTime()) // estimation de la puissance de charge en kW
        return estimatedPower * 1000 // on renvoie le resultat en watts
    }
    
    private func getAvailableEnergy() -> Double{
        return Double(self.getBatteryLevel()) / 100.0 * 38.0
    }
    
    public func getChargeText() -> String {
        if(!self.getIsCarPlugged()){
            return ""
        }else{
            if(self.getBatteryLevel() > self.getChargeLimit()){
                // charge is over
                return LocalizedStringKey("CHARGE TERMINÉE | ").stringValue()
            }
            
            if(self.getIsCarCharging()){
                return LocalizedStringKey("EN CHARGE | ").stringValue()
            }
            
            // all other cases
            return LocalizedStringKey("NE CHARGE PAS | ").stringValue()
        }
    }
    

    
    
    public func getHyundaiChargingLimit(hyundaiApi: HyundaiLayerReturn) -> Int {
      var targetSOC = hyundaiApi.status.vehicleStatus.evStatus.reservChargeInfos?.targetSOClist
      if (targetSOC == nil){
        return 100
      }else{
        targetSOC = targetSOC!
      }
      if (hyundaiApi.status.vehicleStatus.evStatus.batteryPlugin == 1){
        // DC CHARGING
        for i in 0..<targetSOC!.count{
          if (targetSOC![i].plugType == 0){
            return targetSOC![i].targetSOClevel
          }
        }
      }else{
        // AC CHARGING
        for i in 0..<targetSOC!.count{
          if (targetSOC![i].plugType == 1){
            return targetSOC![i].targetSOClevel
          }
        }
      }
      
      return 100;
    }
    
    public func getMapLatitude() -> Latitude {
        return self.apiData.status.vehicleLocation.coord.lat
    }
    
    public func getMapLongitude() -> Longitude {
        return self.apiData.status.vehicleLocation.coord.lon
    }
    
    public func getMilage(appPreferences: AppPreferences?) -> Double {
        return self.apiData.status.odometer.value
    }
    
    public func getIsV2GorV2L() -> Bool {
        return false
    }
}
