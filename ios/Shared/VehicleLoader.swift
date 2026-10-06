//
//  VehicleLoader.swift
//  Kelec
//
//  Loads the car data for the widgets (iOS and watch) and the watch app.
//

import Foundation
import renaultApi

// everything a car widget needs to render
struct CarWidgetData {
  var account: UserAccount? = nil
  var userCar: UserCar? = nil
  var carName: String = ""
  var image: String = "" // base 64 image
  var appPreferences: AppPreferences? = nil
  var apiHandler: ApiHandler? = nil
}

enum VehicleLoader {
  // fetches the car status and saves it in the cache, falls back to the cache when the fetch fails
  static func fetchStatus(userCar: UserCar) async -> ApiHandler? {
    let vin = userCar.car?.vin ?? ""
    do {
      let fetchedApiHandler = try await getCarMakerApiClient(usercar: userCar).getVehicleInfo(vin: vin)
      writeWidgetLog(message: "Data successfully fecthed")
      VehicleCache.saveStatus(vin: vin, apiHandler: fetchedApiHandler)
      SharedHistory.record(vin: vin, apiHandler: fetchedApiHandler)
      return fetchedApiHandler
    } catch {
      writeWidgetLog(message: "Loading cache data")
      return cachedStatus(userCar: userCar)
    }
  }

  static func cachedStatus(userCar: UserCar) -> ApiHandler? {
    VehicleCache.loadStatus(vin: userCar.car?.vin ?? "", carMaker: userCar.maker)
  }

  // account, preferences, car (chosen by `selectCar`), image and status
  static func loadWidgetData(selectCar: (UserAccount) -> UserCar?) async -> CarWidgetData {
    var data = CarWidgetData()
    data.appPreferences = SharedStore.loadPreferences()
    if data.appPreferences == nil {
      writeWidgetLog(message: "APP PREFERENCES POSSIBLY FOUND BUT COULDN'T BE DECODED")
    } else {
      writeWidgetLog(message: "APP PREFERENCES FOUND AND DECODED")
    }

    // the user is not logged
    guard let account = SharedStore.loadAccount() else {
      return data
    }
    data.account = account
    data.userCar = selectCar(account)
    data.carName = data.userCar?.car?.model ?? "ERROR"
    data.image = SharedStore.carImage(vin: data.userCar?.car?.vin ?? "")

    if let userCar = data.userCar {
      data.apiHandler = await fetchStatus(userCar: userCar)
    }
    return data
  }
}

// iOS widgets: the car configured on the widget, else the first car
func widgetCar(account: UserAccount, configuredVin: String?) -> UserCar? {
  guard let configuredVin = configuredVin else {
    writeWidgetLog(message: "No car configured, using first available car")
    return account.cars.first
  }
  if let configuredCar = account.cars.first(where: { $0.car?.vin == configuredVin }) {
    return configuredCar
  }
  writeWidgetLog(message: "Configured car not found (vin: \(configuredVin), falling back to first car")
  return account.cars.first
}

// watch widgets: the car chosen in the watch app settings, else the first car
func watchCar(account: UserAccount) -> UserCar? {
  if let vin = SharedStore.watchWidgetVin(),
     let chosenCar = account.cars.first(where: { $0.car?.vin == vin }) {
    return chosenCar
  }
  return account.cars.first
}
