//
//  renaultStructs.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

import Foundation


public class RenaultHVACResponse: Codable {
    let data: RenaultHVACResponseData
}

public class RenaultHVACResponseData: Codable{
    let type: String?
    let id: String?
    let attributes: RenaultHVACResponseDataAttributes?
}

public class RenaultHVACResponseDataAttributes: Codable{
    let action: String?
    let targetTemperature: Float?
}


public class RenaultAppCockpitApi: Codable{
    public let data: RenaultAppCockpit
}

public class RenaultAppCockpit: Codable{
    public let id: String
    public let attributes: RenaultCockpitStatus
}

public class RenaultCockpitStatus: Codable {
    public let totalMileage: Double
    
    public init(totalMilage: Double){
        self.totalMileage = totalMilage
    }
}


public class RenaultAppCarApi: Codable{
    public let data:RenaultAppCar
    
    public init(data: RenaultAppCar) {
        self.data = data
    }
}

public class RenaultAppLocationApi: Codable{
    public let data:RenaultAppLocation
}

public class RenaultAppLocation: Codable {
    public let type: String?
    public let id: String
    public let attributes: RenaultLocationStatus
}

public class RenaultLocationStatus: Codable{
    public let lastUpdateTime: String?
    public let gpsLatitude: Double?
    public let gpsLongitude: Double?
}

public class RenaultAppCar: Codable {
    public let type: String?
    public let id: String
    public let attributes: RenaultBatteryStatus
}


public class RenaultBatteryStatus: Codable {
    public let timestamp: String
    public let batteryLevel: Int?
    public let batteryAutonomy: Int?
    public let batteryCapacity: Int?
    public let batteryAvailableEnergy: Int?
    public let plugStatus: Int?
    public let chargingStatus: Double?
    public let chargingRemainingTime: Int?
    public let chargingInstantaneousPower: Double?
    
    public init(timestamp: String, batteryLevel: Int?, batteryAutonomy: Int?, batteryCapacity: Int?, batteryAvailableEnergy: Int?, plugStatus: Int?, chargingStatus: Double?, chargingRemainingTime: Int?, chargingInstantaneousPower: Double?) {
        self.timestamp = timestamp
        self.batteryLevel = batteryLevel
        self.batteryAutonomy = batteryAutonomy
        self.batteryCapacity = batteryCapacity
        self.batteryAvailableEnergy = batteryAvailableEnergy
        self.plugStatus = plugStatus
        self.chargingStatus = chargingStatus
        self.chargingRemainingTime = chargingRemainingTime
        self.chargingInstantaneousPower = chargingInstantaneousPower
    }
}

public struct JWTTokenFetch:Codable, Equatable{
    public var id_token: String
}
