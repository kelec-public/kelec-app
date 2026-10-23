//
//  demoCar.swift
//  renaultApi
//

import Foundation

// the demo cars of the RN app (src/assets/car_data/mockDemoData.json), same VINs and values:
// a car charging, a car in V2G and a plug-in hybrid with a scheduled charge
public enum DemoCar: String, Codable, CaseIterable {
    case classic = "VF1AA"
    case v2g = "VF1AA2"
    case hybrid = "VF1AA3"

    // unknown VINs get the classic car, like the RN app
    public init(vin: String) {
        self = DemoCar(rawValue: vin) ?? .classic
    }

    var batteryLevel: Int {
        switch self {
        case .classic: return 56
        case .v2g: return 68
        case .hybrid: return 35
        }
    }

    // km
    var range: Int {
        switch self {
        case .classic: return 202
        case .v2g: return 265
        case .hybrid: return 17
        }
    }

    var chargeStatus: ChargeStatus {
        switch self {
        case .classic: return .charging
        case .v2g: return .v2g
        case .hybrid: return .scheduled
        }
    }

    // minutes
    var chargingRemainingTime: Int {
        return self == .classic ? 51 : 0
    }

    var chargeInstantaneousPowerInWatts: Double {
        return self == .classic ? 7200 : 0
    }

    var chargeLimit: Int {
        return self == .hybrid ? 100 : 80
    }

    // the hybrid shows the unlocked state
    var isLocked: Bool {
        return self != .hybrid
    }

    // km
    var mileage: Double {
        switch self {
        case .classic: return 30995.2
        case .v2g: return 12480.5
        case .hybrid: return 45210.3
        }
    }

    var latitude: Latitude {
        switch self {
        case .classic: return 48.854700
        case .v2g: return 48.8606
        case .hybrid: return 48.8462
        }
    }

    var longitude: Longitude {
        switch self {
        case .classic: return 2.347749
        case .v2g: return 2.3376
        case .hybrid: return 2.3371
        }
    }
}
