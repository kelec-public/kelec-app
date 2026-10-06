//
//  PreviewData.swift
//  Kelec
//
//  Fake data for the widgets placeholders and snapshots.
//

import Foundation
import renaultApi

enum PreviewData {
  static let account = UserAccount(selectedCar: "mock", cars: [])
  static let userCar = UserCar(email: "", password: "", carMaker: "renault")
  static let carName = "Megane E-Tech"
  static let image = "megane"

  static var apiHandler: ApiHandler {
    let batteryStatus = RenaultBatteryStatus(timestamp: "2022-01-01", batteryLevel: 50, batteryAutonomy: 50, batteryCapacity: 0, batteryAvailableEnergy: 10, plugStatus: 1, chargingStatus: 1.0,  chargingRemainingTime: 50, chargingInstantaneousPower: 10)
    return RenaultApiHandler(batteryStatus: batteryStatus)
  }

  static var tempo: tempoFinalReturn {
    let today = Date()
    let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today)!
    return tempoFinalReturn(previousColour: "RED", previousDate: yesterday, latestColour: "RED", latestDate: today, latestIsTomorrow: true)
  }
}
