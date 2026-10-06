//
//  helpers.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

import Foundation
import SwiftUI

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

struct WidgetLog: Codable {
    public var date: Date
    public var message: String
}

public func writeWidgetLog(message: String) {
    let logToSave = WidgetLog(date: Date(), message: message)
    let userDefaults = UserDefaults(suiteName: "group.kelyanselme.MyRenaultPlus")

    guard let userDefaults = userDefaults else {
        print("Unable to get bundle UserDefaults")
        return
    }

    var logs = (try? JSONDecoder().decode([WidgetLog].self, from: userDefaults.data(forKey: "widgetLogs") ?? Data())) ?? []
    logs.append(logToSave)
    
    // filter to remove logs older than one month
    let fiveDaysAgo = Calendar.current.date(byAdding: .day, value: -5, to: Date())!
    logs = logs.filter { log in
        return log.date >= fiveDaysAgo
    }
    
    do {
        let encodedLogs = try JSONEncoder().encode(logs)
        userDefaults.set(encodedLogs, forKey: "widgetLogs")
        print("Logs written successfully")
    } catch {
        print("Failed to encode logs: \(error.localizedDescription)")
    }
}


struct MileageLog: Codable {
    public var mileage: Double
    public var timestamp: String
}

func convertDateToIsoString(date: Date) -> String {
    let dateFormatter = ISO8601DateFormatter()
    dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return dateFormatter.string(from: date)
}

func convertIsoStringToDate(isoString: String) -> Date? {
    let dateFormatter = ISO8601DateFormatter()
    dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return dateFormatter.date(from: isoString)
}

func saveMileageHistory(vin: String, mileage: Double) {
    let mileageToSave = MileageLog(mileage: mileage, timestamp: convertDateToIsoString(date: Date()))
    var finalMileage: [MileageLog] = []
    
    guard let userDefault = UserDefaults(suiteName: "group.kelyanselme.MyRenaultPlus") else {
        print("Unable to get bundle UserDefaults")
        return
    }
    
    if let data = userDefault.data(forKey: "\(vin)_mileageHistory") {
        let decoder = JSONDecoder()
        do {
            finalMileage = try decoder.decode([MileageLog].self, from: data)
        } catch {
            print("Failted to decode logs : \(error.localizedDescription)")
        }
    }
    
    finalMileage.append(mileageToSave)

    // on retire les entrées qui datent de plus d'un mois
    let oneMonthAgo = Calendar.current.date(byAdding: .month, value: -1, to: Date())!
    finalMileage = finalMileage.filter { log in
        if let logDate = convertIsoStringToDate(isoString: log.timestamp) {
            print("is older", logDate >= oneMonthAgo)
            return logDate >= oneMonthAgo
        }
        print("unable to compute log date")
        return false
    }
    
    let encoder = JSONEncoder()
    do {
        let encoded = try encoder.encode(finalMileage)
        userDefault.setValue(encoded, forKey: "\(vin)_mileageHistory")
        print("Mileage logs written successfully with \(finalMileage.count) entries")
    } catch {
        print("Failed to encode mileage logs : \(error.localizedDescription)")
    }
}

func saveStoredApiData(vin: String, batteryStatus: RenaultBatteryStatus) -> Void {

  // on sauvegarde le battery status pour réutiliser sur l'app
  guard let userDefault = UserDefaults(suiteName: "group.kelyanselme.MyRenaultPlus") else {
    return
  }
  
  let encoder = JSONEncoder()
  do {
    let encoded = try encoder.encode(batteryStatus)
    userDefault.setValue(encoded, forKey: "\(vin)_batteryStatus")
  } catch {
    print("Failed to save battery status")
  }
}


extension LocalizedStringKey {
    public func stringValue(locale: Locale = .current) -> String {
        return .localizedString(for: self.stringKey ?? "", locale: locale)
    }
}

extension LocalizedStringKey {
    var stringKey: String? {
        Mirror(reflecting: self).children.first(where: { $0.label == "key" })?.value as? String
    }
}

extension String {
    static func localizedString(
        for key: String,
        locale: Locale = .current
    ) -> String {
        
        // pas de dossier .lproj exact pour certaines langues (ex. "pt" alors que le dossier est "pt-PT") :
        // on laisse alors iOS choisir la meilleure localisation du bundle
        guard
            let path = Bundle.main.path(forResource: locale.languageCode, ofType: "lproj"),
            let bundle = Bundle(path: path)
        else {
            return NSLocalizedString(key, bundle: .main, comment: "")
        }

        return NSLocalizedString(key, bundle: bundle, comment: "")
    }
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
