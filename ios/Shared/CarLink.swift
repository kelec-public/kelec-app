//
//  CarLink.swift
//  Kelec
//
//  Link that opens the app on a car page ("kelec://car/<vin>"): iOS widgets (widgetURL), read by the app (CarShortcuts).
//

import Foundation

enum CarLink {
  static let scheme = "kelec"
  private static let host = "car"

  static func url(vin: String) -> URL? {
    var components = URLComponents()
    components.scheme = scheme
    components.host = host
    components.path = "/\(vin)"
    return components.url
  }

  // nil when the url is not a car link
  static func vin(from url: URL) -> String? {
    guard url.scheme == scheme, url.host == host else { return nil }
    let vin = url.lastPathComponent
    return vin.isEmpty || vin == "/" ? nil : vin
  }
}
