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

  let userCar: UserCar

  init(userCar: UserCar) {
    self.userCar = userCar
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

  // reloads the car and the watch widgets
  func refresh() async {
    await load()
    WidgetCenter.shared.reloadAllTimelines()
  }
}
