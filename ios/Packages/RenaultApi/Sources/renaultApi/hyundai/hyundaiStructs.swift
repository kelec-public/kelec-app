//
//  File.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

import Foundation

public struct HyundaiLayerReturn: Codable{
    private var message: String
    public var status: HyundaiApiRetour
}

public struct HyundaiApiRetour:Codable{
    public var vehicleStatus: vehicleStatus
    public var vehicleLocation: vehicleLocation
    public var odometer: vehicleOdometer
}

public struct vehicleOdometer: Codable{
    public var value: Double
}

public struct vehicleStatus:Codable{
    public var airCtrlOn: Bool
    public var engine: Bool
    public var doorLock: Bool
    public var evStatus: evStatus
    public var time: String
}

public struct evStatus:Codable{
    public var batteryCharge: Bool
    public var batteryStatus: Int
    public var batteryPlugin: Int
    public var remainTime2: remainTime2?
    public var drvDistance: [drvDistance]
    public var reservChargeInfos: reservChargeInfos?
}

public struct reservChargeInfos: Codable{
    public var targetSOClist: [targetSOClist]
}

public struct targetSOClist: Codable, Hashable{
    public var targetSOClevel: Int
    public var plugType: Int
}

public struct remainTime2: Codable{
    public var etc1: evModeRange
    public var etc2: evModeRange
    public var etc3: evModeRange
    public var atc: evModeRange
}

public struct drvDistance: Codable{
    public var rangeByFuel: rangeByFuel
}

public struct rangeByFuel: Codable{
    public var evModeRange: evModeRange
}

public struct evModeRange: Codable{
    public var value: Int
}


public struct HyundaiHVACLaunchResponse: Codable{
    let message: String
}


public struct vehicleLocation: Codable{
    public var coord:Coordinates
    public var time: String
}

public struct Coordinates: Codable{
    public var lat: Double
    public var lon: Double
}
