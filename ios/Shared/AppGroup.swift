//
//  AppGroup.swift
//  Kelec
//
//  Shared by the app, the iOS widgets, the watch app and the watch widgets.
//

import Foundation

enum AppGroup {
  // also used as the keychain access group
  static let id = "group.kelyanselme.MyRenaultPlus"

  static var userDefaults: UserDefaults? {
    UserDefaults(suiteName: id)
  }
}

// These keys are already stored on the users' devices (and read by the RN app): never rename them.
enum StorageKey {
  // App Group UserDefaults (written by the RN bridge on iPhone, by the sync on the watch)
  static let account = "account"
  static let appPreferences = "appPreferences"
  static func carImage(vin: String) -> String { "\(vin)/image" }

  // Keychain
  static func password(vin: String) -> String { "\(vin)_password" }
  static func cookieValue(email: String) -> String { "cookieValue_\(email)" }

  // UserDefaults.standard: cache local to each target
  static let renaultCarsCache = "RENAULT_carsLoaded"
  static let hyundaiCarsCache = "HYUNDAI_carsLoaded"
  static let tempo = "tempo"
  static func savedLocation(vin: String) -> String { "savedLocation_\(vin)" }
}
