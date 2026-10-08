//
//  CarViewModel.swift
//  KelecWatchOs Watch App
//
//  Status of one car on the watch: the cached data first, then the fetched one.
//

import Foundation
import WidgetKit
import renaultApi

@MainActor
final class CarViewModel: ObservableObject {
  @Published private(set) var apiHandler: ApiHandler? = nil
  @Published private(set) var appPreferences: AppPreferences? = nil
  // nothing to display yet (no cache)
  @Published private(set) var isLoading = true
  // a fetch is running
  @Published private(set) var isRefreshing = false

  // last target temperature chosen for this car, saved on each change like the RN app (TemperaturePreferences):
  // "<vin>/savedTemperature", in the watch's own storage
  @Published var savedTemperature: Int {
    didSet {
      UserDefaults.standard.set(String(savedTemperature), forKey: Self.temperatureKey(userCar))
    }
  }

  let userCar: UserCar

  init(userCar: UserCar) {
    self.userCar = userCar
    let stored = Int(UserDefaults.standard.string(forKey: Self.temperatureKey(userCar)) ?? "")
    savedTemperature = stored.flatMap { HvacTemperature.values.contains($0) ? $0 : nil } ?? HvacTemperature.defaultValue
  }

  private static func temperatureKey(_ userCar: UserCar) -> String {
    "\(userCar.car?.vin ?? "")/savedTemperature"
  }

  func load() async {
    appPreferences = SharedStore.loadPreferences()
    isRefreshing = true
    if let cached = VehicleLoader.cachedStatus(userCar: userCar) {
      apiHandler = cached
      isLoading = false
    }
    apiHandler = await VehicleLoader.fetchStatus(userCar: userCar)
    isLoading = false
    isRefreshing = false
  }

  // false when the command could not be sent
  func launchHVAC(temperature: Int) async -> Bool {
    await sendHVACCommand(userCar: userCar, temperature: temperature)
  }

  // reloads the car and the watch widgets
  func refresh() async {
    await load()
    WidgetCenter.shared.reloadAllTimelines()
  }
}
