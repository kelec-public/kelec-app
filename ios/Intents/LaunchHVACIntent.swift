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
  
  
  @Parameter(title: "Car", description: "The car to launch the preheating for.")
  var car: CarEntity
  
  static var parameterSummary: some ParameterSummary {
    Summary("launchPreHeat \(\.$car)")
  }
  
  func perform() async throws -> some IntentResult & ProvidesDialog {
    var isASuccess = false
    
    if let userCar = SharedStore.loadAccount()?.cars.first(where: { $0.car?.vin == car.id }) {
      isASuccess = await sendHVACCommand(userCar: userCar)
    }
    
    if(isASuccess){
      // hvac has been launched
      let informationSent = LocalizedStringKey("informationSent").stringValue()
      let preheatActive = LocalizedStringKey("preHeatLaunched").stringValue()
      
      
      return .result(dialog: "\(informationSent). \(preheatActive). \(car.name)")
    }else{
      // couldn't launch hvac
      let error = LocalizedStringKey("error").stringValue()
      let commandSendError = LocalizedStringKey("commandSendError").stringValue()
      return .result(dialog: "\(error). \(commandSendError). \(car.name)")
    }
  }
}
