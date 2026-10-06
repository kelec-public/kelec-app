//
//  VehicleCache.swift
//  Kelec
//
//  Last fetched car status and location, kept in UserDefaults.standard (local to each target).
//  The JSON format and the keys are already stored on the devices: keep them.
//

import Foundation
import renaultApi

private protocol CachedVehicle: Codable {
  var vin: String { get }
}

private struct RenaultSaved: CachedVehicle {
  var vin: String
  var batteryStatus: RenaultBatteryStatus
}

private struct HyundaiSaved: CachedVehicle {
  var vin: String
  var hyundaiStatus: HyundaiLayerReturn
}

struct SavedLocation: Codable {
  var vin: String
  var latitude: Latitude
  var longitude: Longitude
}

enum VehicleCache {
  static func saveStatus(vin: String, apiHandler: ApiHandler) {
    switch apiHandler.getCarMaker() {
    case .RENAULT, .DACIA, .ALPINE:
      guard let batteryStatus = apiHandler.getApiData() as? RenaultBatteryStatus else { return }
      upsert(RenaultSaved(vin: vin, batteryStatus: batteryStatus), key: StorageKey.renaultCarsCache)
    case .HYUNDAI:
      guard let hyundaiStatus = apiHandler.getApiData() as? HyundaiLayerReturn else { return }
      upsert(HyundaiSaved(vin: vin, hyundaiStatus: hyundaiStatus), key: StorageKey.hyundaiCarsCache)
    case .DEMO:
      // no need to save anything for the demo car
      return
    }
  }

  static func loadStatus(vin: String, carMaker: CarMaker) -> ApiHandler? {
    switch carMaker {
    case .RENAULT, .DACIA, .ALPINE:
      guard let saved = load([RenaultSaved].self, key: StorageKey.renaultCarsCache)?.first(where: { $0.vin == vin }) else { return nil }
      return RenaultApiHandler(batteryStatus: saved.batteryStatus)
    case .HYUNDAI:
      guard let saved = load([HyundaiSaved].self, key: StorageKey.hyundaiCarsCache)?.first(where: { $0.vin == vin }) else { return nil }
      return HyundaiApiHandler(apiData: saved.hyundaiStatus)
    case .DEMO:
      return DemoApiHandler()
    }
  }

  static func saveLocation(vin: String, latitude: Latitude, longitude: Longitude) {
    if let encoded = try? JSONEncoder().encode(SavedLocation(vin: vin, latitude: latitude, longitude: longitude)) {
      UserDefaults.standard.set(encoded, forKey: StorageKey.savedLocation(vin: vin))
    }
  }

  static func loadLocation(vin: String) -> SavedLocation? {
    load(SavedLocation.self, key: StorageKey.savedLocation(vin: vin))
  }

  // replaces the car with the same vin (keeping its position), else appends it
  private static func upsert<T: CachedVehicle>(_ vehicle: T, key: String) {
    var vehicles = load([T].self, key: key) ?? []
    if let index = vehicles.firstIndex(where: { $0.vin == vehicle.vin }) {
      vehicles[index] = vehicle
    } else {
      vehicles.append(vehicle)
    }
    if let encoded = try? JSONEncoder().encode(vehicles) {
      UserDefaults.standard.set(encoded, forKey: key)
    }
  }

  private static func load<T: Decodable>(_ type: T.Type, key: String) -> T? {
    guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
    return try? JSONDecoder().decode(type, from: data)
  }
}
