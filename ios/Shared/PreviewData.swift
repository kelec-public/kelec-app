//
//  PreviewData.swift
//  Kelec
//
//  Fake data for the widgets placeholders and snapshots.
//

import Foundation
import renaultApi

enum PreviewData {
  static let account = UserAccount(cars: [])
  static let userCar = UserCar(email: "", password: "", carMaker: "renault")
  static let carName = "Megane E-Tech"
  static let image = "megane"

  static var apiHandler: ApiHandler {
    let batteryStatus = RenaultBatteryStatus(timestamp: "2022-01-01", batteryLevel: 50, batteryAutonomy: 50, batteryCapacity: 0, batteryAvailableEnergy: 10, plugStatus: 1, chargingStatus: 1.0,  chargingRemainingTime: 50, chargingInstantaneousPower: 10)
    return RenaultApiHandler(batteryStatus: batteryStatus)
  }

  // the states shown by the widgets previews, in this order
  static var apiHandlerStates: [ApiHandler] {
    [
      (level: 69, plugStatus: 0, chargingStatus: 0),      // not plugged
      (level: 69, plugStatus: 1, chargingStatus: 1),      // plugged and charging
      (level: 69, plugStatus: 1, chargingStatus: -1),     // plugged but not charging
      (level: 100, plugStatus: 1, chargingStatus: 0.4),   // charged 100%
      (level: 100, plugStatus: 1, chargingStatus: -1.3),  // V2G
    ].map { state -> ApiHandler in
      let batteryStatus = RenaultBatteryStatus(
        timestamp: "2025-07-15T08:40:54Z", batteryLevel: state.level, batteryAutonomy: 216, batteryCapacity: nil,
        batteryAvailableEnergy: nil, plugStatus: state.plugStatus, chargingStatus: state.chargingStatus,
        chargingRemainingTime: 150, chargingInstantaneousPower: nil)
      var apiHandler = RenaultApiHandler(batteryStatus: batteryStatus)
      apiHandler.setCockpitStatus(cockpitStatus: RenaultCockpitStatus(totalMilage: 45801))
      return apiHandler
    }
  }

  static var tempo: tempoFinalReturn {
    let today = Date()
    let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today)!
    return tempoFinalReturn(previousColour: "RED", previousDate: yesterday, latestColour: "RED", latestDate: today, latestIsTomorrow: true)
  }
}
