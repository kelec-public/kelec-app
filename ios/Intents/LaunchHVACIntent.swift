//
//  LaunchHVACIntent.swift
//  Kelec
//
//  Created by Kelyan PEGEOT SELME on 04/02/2025.
//

import Foundation
import AppIntents
import SwiftUI
import WidgetKit



struct LaunchHVACIntent: AppIntent {
  static let title: LocalizedStringResource = "launchPreHeat"
  
  
  @Parameter(title: "Car", description: "launchPreHeatCarDescription")
  var car: CarEntity

  // target temperature (°C), same range and default as HvacTemperature (AppIntents needs literals);
  // existing shortcuts get the default
  @Parameter(
    title: "launchPreHeatTemperature",
    description: "launchPreHeatTemperatureDescription",
    default: 21,
    controlStyle: .stepper,
    inclusiveRange: (17, 27)
  )
  var temperature: Int
  
  static var parameterSummary: some ParameterSummary {
    Summary("launchPreHeatSummary \(\.$car) \(\.$temperature)")
  }
  
  func perform() async throws -> some IntentResult & ProvidesDialog {
    // the stepper keeps the range, but a value can still come from another shortcut action
    let temperature = min(max(temperature, HvacTemperature.min), HvacTemperature.max)
    var isASuccess = false
    
    if let userCar = SharedStore.loadAccount()?.cars.first(where: { $0.car?.vin == car.id }) {
      isASuccess = await sendHVACCommand(userCar: userCar, temperature: temperature)
    }
    
    if(isASuccess){
      let message = String(format: localized("preHeatLaunchedOn %@ %@"), car.name, String(temperature))
      return .result(dialog: "\(message)")
    }else{
      let message = String(format: localized("preHeatLaunchError %@"), car.name)
      return .result(dialog: "\(message)")
    }
  }
}
