//
//  RNSharedWidget.swift
//  Kelec
//
//  RN bridge (src/lib/storage/sharedPlatformsData.tsx): data shared with the widgets, the Siri intent and the watch.
//

import Foundation
import React
import WidgetKit

@objc(RNSharedWidget)
final class RNSharedWidget: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  // MARK: App Group (account, preferences, car images, widget logs, mileage history...)

  // the value is stored as a String: the widgets and the watch decode it with SharedStore
  @objc(setData:value:resolver:rejecter:)
  func setData(_ key: String, value: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = AppGroup.userDefaults else {
      reject("usergroup_error", "unable to open shared groups", nil)
      return
    }
    userDefaults.set(value, forKey: key)
    Self.scheduleWidgetsReload()
    resolve(nil)
  }

  // null when the key is missing. Values written by the widgets are Data, the ones written by RN are String
  @objc(getData:resolver:rejecter:)
  func getData(_ key: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let stored = AppGroup.userDefaults?.object(forKey: key)
    if let value = stored as? String {
      resolve(value)
    } else if let data = stored as? Data, let value = String(data: data, encoding: .utf8) {
      resolve(value)
    } else {
      resolve(nil)
    }
  }

  // MARK: Keychain (passwords "<vin>_password", Renault session cookies...)

  @objc(setCryptedData:value:resolver:rejecter:)
  func setCryptedData(_ key: String, value: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    if Keychain.save(key, value: value) {
      resolve(nil)
    } else {
      reject("keychain_error", "Failed to save data in the keychain", nil)
    }
  }

  // null when the item is missing or empty
  @objc(getCryptedData:resolver:rejecter:)
  func getCryptedData(_ key: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    resolve(Keychain.read(key))
  }

  @objc(clearCryptedData:resolver:rejecter:)
  func clearCryptedData(_ key: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    if Keychain.delete(key) {
      resolve(nil)
    } else {
      reject("keychain_error", "Failed to delete data from the keychain", nil)
    }
  }

  // MARK: Widgets

  @objc(refreshWidgets:rejecter:)
  func refreshWidgets(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    WidgetCenter.shared.reloadAllTimelines()
    resolve(nil)
  }

  // several setData calls in a row (account, preferences, images) only reload the widgets once
  private static var pendingReload: DispatchWorkItem?

  private static func scheduleWidgetsReload() {
    DispatchQueue.main.async {
      pendingReload?.cancel()
      let reload = DispatchWorkItem { WidgetCenter.shared.reloadAllTimelines() }
      pendingReload = reload
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.5, execute: reload)
    }
  }
}
