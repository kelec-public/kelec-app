//
//  hyundaiApiHandler.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

import Foundation

public struct HyundaiApiHandler: ApiHandler {
    
    public func getVehicleData() -> VehicleData {
        return .hyundai(self.apiData)
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

    // ended when above the charge limit, else charging or not
    public func getChargeStatus() -> ChargeStatus {
        if !self.getIsCarPlugged() {
            return .notPlugged
        }
        if self.getBatteryLevel() > self.getChargeLimit() {
            return .ended
        }
        return self.getIsCarCharging() ? .charging : .notCharging
    }

    public func getHyundaiChargingLimit(hyundaiApi: HyundaiLayerReturn) -> Int {
      guard let targetSOC = hyundaiApi.status.vehicleStatus.evStatus.reservChargeInfos?.targetSOClist else {
        return 100
      }
      // plugType 0: DC charging limit, 1: AC charging limit
      let plugType = hyundaiApi.status.vehicleStatus.evStatus.batteryPlugin == 1 ? 0 : 1
      return targetSOC.first(where: { $0.plugType == plugType })?.targetSOClevel ?? 100
    }
    
    public func getMapLatitude() -> Latitude {
        return self.apiData.status.vehicleLocation.coord.lat
    }
    
    public func getMapLongitude() -> Longitude {
        return self.apiData.status.vehicleLocation.coord.lon
    }
    
    // in km, in miles when the app displays miles (like the RN app and Renault)
    public func getMilage(appPreferences: AppPreferences?) -> Double {
        let mileage = self.apiData.status.odometer.value
        return appPreferences?.displayMiles == true ? mileage * 0.621371 : mileage
    }
    
    public func getOdometerInKm() -> Double? {
        return self.apiData.status.odometer.value
    }
}
