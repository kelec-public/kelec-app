//
//  CarShortcuts.swift
//  Kelec
//
//  One entry per car in Spotlight and in the Quick Actions of the app icon (long press).
//  Opening one of them, or tapping a widget (CarLink), asks the RN app to show that car (OpenCarRequests).
//

import CoreSpotlight
import UIKit
import UniformTypeIdentifiers

enum CarShortcuts {
  private static let spotlightDomain = "cars"
  private static let quickActionType = "openCar"
  private static let vinKey = "vin"

  // MARK: Spotlight and Quick Actions

  // the cars of the shared account (none when logged out): called at launch and when the RN app saves the account or an image
  static func update() {
    let cars = (SharedStore.loadAccount()?.cars ?? []).compactMap(\.car).filter { !$0.vin.isEmpty }

    UIApplication.shared.shortcutItems = cars.map { car in
      UIApplicationShortcutItem(
        type: quickActionType,
        localizedTitle: car.model,
        localizedSubtitle: nil,
        icon: UIApplicationShortcutIcon(systemImageName: "car.fill"),
        userInfo: [vinKey: car.vin as NSString]
      )
    }

    let items = cars.map { car in
      let attributes = CSSearchableItemAttributeSet(contentType: .content)
      attributes.title = car.model
      attributes.thumbnailData = imageData(vin: car.vin)
      return CSSearchableItem(uniqueIdentifier: car.vin, domainIdentifier: spotlightDomain, attributeSet: attributes)
    }
    // the deleted cars leave the index
    let index = CSSearchableIndex.default()
    index.deleteSearchableItems(withDomainIdentifiers: [spotlightDomain]) { _ in
      guard !items.isEmpty else { return }
      index.indexSearchableItems(items, completionHandler: nil)
    }
  }

  // image saved by the RN app: base64, sometimes as a data URL
  private static func imageData(vin: String) -> Data? {
    let image = SharedStore.carImage(vin: vin)
    let base64 = image.components(separatedBy: "base64,").last ?? image
    return Data(base64Encoded: base64, options: .ignoreUnknownCharacters)
  }

  // MARK: Opening a car

  static func open(_ url: URL) {
    if let vin = CarLink.vin(from: url) {
      OpenCarRequests.request(vin: vin)
    }
  }

  static func open(_ userActivity: NSUserActivity) {
    if userActivity.activityType == CSSearchableItemActionType,
       let vin = userActivity.userInfo?[CSSearchableItemActivityIdentifier] as? String {
      OpenCarRequests.request(vin: vin)
    }
  }

  // false when the Quick Action is not a car
  @discardableResult
  static func open(_ shortcutItem: UIApplicationShortcutItem) -> Bool {
    guard shortcutItem.type == quickActionType, let vin = shortcutItem.userInfo?[vinKey] as? String else {
      return false
    }
    OpenCarRequests.request(vin: vin)
    return true
  }
}
