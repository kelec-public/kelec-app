//
//  SharedStore.swift
//  Kelec
//
//  Account, preferences and car images shared through the App Group.
//

import Foundation
import renaultApi

enum SharedStore {
  static func loadAccount() -> UserAccount? {
    decode(UserAccount.self, key: StorageKey.account)
  }

  static func loadPreferences() -> AppPreferences? {
    decode(AppPreferences.self, key: StorageKey.appPreferences)
  }

  // base64 image, "" when not found
  static func carImage(vin: String) -> String {
    AppGroup.userDefaults?.string(forKey: StorageKey.carImage(vin: vin)) ?? ""
  }

  // watch only: the car chosen in the watch app settings for the watch widgets
  static func watchWidgetVin() -> String? {
    AppGroup.userDefaults?.string(forKey: StorageKey.watchWidgetCar)
  }

  static func saveWatchWidgetVin(_ vin: String) {
    AppGroup.userDefaults?.set(vin, forKey: StorageKey.watchWidgetCar)
  }

  // only used on the watch: on iPhone, the RN bridge writes these keys
  @discardableResult
  static func saveAccount(_ account: UserAccount) -> Bool {
    encode(account, key: StorageKey.account)
  }

  @discardableResult
  static func savePreferences(_ appPreferences: AppPreferences) -> Bool {
    encode(appPreferences, key: StorageKey.appPreferences)
  }

  // the same key can be stored as Data (written by the watch) or as String (written by the RN bridge)
  private static func decode<T: Decodable>(_ type: T.Type, key: String) -> T? {
    let stored = AppGroup.userDefaults?.object(forKey: key)
    guard let data = (stored as? Data) ?? (stored as? String).map({ Data($0.utf8) }) else {
      return nil
    }
    return try? JSONDecoder().decode(type, from: data)
  }

  private static func encode<T: Encodable>(_ value: T, key: String) -> Bool {
    guard let encoded = try? JSONEncoder().encode(value),
          let userDefaults = AppGroup.userDefaults
    else {
      return false
    }
    userDefaults.set(encoded, forKey: key)
    return true
  }
}
