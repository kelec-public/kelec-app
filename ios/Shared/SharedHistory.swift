//
//  SharedHistory.swift
//  Kelec
//
//  Data the widgets keep for the RN app in the App Group: widget logs, mileage history and
//  last Renault battery status. The RN app parses this JSON: keep the formats.
//

import Foundation
import renaultApi

private struct WidgetLog: Codable {
  var date: Date
  var message: String
}

private struct MileageLog: Codable {
  var mileage: Double
  var timestamp: String // ISO 8601 with fractional seconds
}

// log exported from the app settings (widgetLogs), kept 5 days
func writeWidgetLog(message: String) {
  guard let userDefaults = AppGroup.userDefaults else {
    print("Unable to get bundle UserDefaults")
    return
  }
  var logs = (try? JSONDecoder().decode([WidgetLog].self, from: userDefaults.data(forKey: StorageKey.widgetLogs) ?? Data())) ?? []
  logs.append(WidgetLog(date: Date(), message: message))

  let fiveDaysAgo = Calendar.current.date(byAdding: .day, value: -5, to: Date())!
  logs = logs.filter { $0.date >= fiveDaysAgo }

  if let encoded = try? JSONEncoder().encode(logs) {
    userDefaults.set(encoded, forKey: StorageKey.widgetLogs)
  }
}

enum SharedHistory {
  // saves what the RN app reads after each successful fetch
  static func record(vin: String, apiHandler: ApiHandler) {
    if case .renault(let batteryStatus) = apiHandler.getVehicleData() {
      saveBatteryStatus(vin: vin, batteryStatus: batteryStatus)
    }
    if let odometer = apiHandler.getOdometerInKm() {
      saveMileage(vin: vin, mileage: odometer)
    }
  }

  // mileage history of the last month (charge history)
  static func saveMileage(vin: String, mileage: Double) {
    guard let userDefaults = AppGroup.userDefaults else { return }
    let key = StorageKey.mileageHistory(vin: vin)
    var history = (try? JSONDecoder().decode([MileageLog].self, from: userDefaults.data(forKey: key) ?? Data())) ?? []
    history.append(MileageLog(mileage: mileage, timestamp: isoFormatter.string(from: Date())))

    let oneMonthAgo = Calendar.current.date(byAdding: .month, value: -1, to: Date())!
    history = history.filter { log in
      guard let date = isoFormatter.date(from: log.timestamp) else { return false }
      return date >= oneMonthAgo
    }

    if let encoded = try? JSONEncoder().encode(history) {
      userDefaults.set(encoded, forKey: key)
    }
  }

  // last Renault battery status, reused by the RN app
  static func saveBatteryStatus(vin: String, batteryStatus: RenaultBatteryStatus) {
    if let encoded = try? JSONEncoder().encode(batteryStatus) {
      AppGroup.userDefaults?.set(encoded, forKey: StorageKey.batteryStatus(vin: vin))
    }
  }

  private static var isoFormatter: ISO8601DateFormatter {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter
  }
}
