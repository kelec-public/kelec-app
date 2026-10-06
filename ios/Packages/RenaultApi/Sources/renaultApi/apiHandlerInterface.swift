//
//  File.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

import Foundation

public protocol ApiHandler: Codable, Decodable{
    var carMaker: CarMaker { get set }

    func getApiData()->Any
    
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
    
    func getMapLatitude()->Latitude
    func getMapLongitude()->Longitude
    
    func getMilage(appPreferences: AppPreferences?) -> Double
    
    func getIsV2GorV2L() -> Bool
    
    
}

extension ApiHandler{
    public func getCarMaker()->CarMaker{
        return self.carMaker
    }
}
