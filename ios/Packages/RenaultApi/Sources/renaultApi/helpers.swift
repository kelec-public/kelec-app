//
//  helpers.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

import Foundation

public enum ApiClientError: Error {
    case noError
    case serverError
    case invalidCreds
    case unknownError
    case invalidURL
    case missingData
    case decodeError
}

public enum CarMaker: String, Codable {
    case RENAULT = "renault"
    case ALPINE = "alpine"
    case DACIA = "dacia"
    case
    HYUNDAI = "hyundai"
    case
    DEMO = "demo"
}

// localized text from the app bundle (the app owns the translations)
func localized(_ key: String) -> String {
    return NSLocalizedString(key, bundle: .main, comment: "")
}

extension Double {
    func rounded(toPlaces places: Int) -> Double {
        let divisor = pow(10.0, Double(places))
        return (self * divisor).rounded() / divisor
    }
}

public func convertKmToMiles(km: Int) -> Int {
    let milesConst: Float = 0.621371
    let kmFloat = Float(km) * milesConst
    return Int(kmFloat)
}

public func getUnitsText(useMiles: Bool) -> String {
    return useMiles ? "mi" : "km"
}

public func getRange(range: Int, appPreferences: AppPreferences?) -> Int {
    if appPreferences?.convertToMiles ?? false {
        return convertKmToMiles(km: range)
    } else {
        return range
    }
}
