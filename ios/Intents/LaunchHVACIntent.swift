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
    
    if let userBundle = UserDefaults.init(suiteName: "group.kelyanselme.MyRenaultPlus") {
      let userAccount = getUserAccount(userBundle: userBundle)
      if let userAccount = userAccount{
        let cars = userAccount.cars
        let userCar = cars.first{ $0.car?.vin == car.id}
        
        if let userCar = userCar{
          let vin = userCar.car?.vin ?? ""
          var client = getCarMakerApiClient(usercar: userCar)
          let dispatchSemaphore = DispatchSemaphore(value: 0)
          
          do {
            // try to get password from keychain
            if(userCar.password.isEmpty){
              let passwordFromKeychain = try getPasswordFromKeychain(key: "\(userCar.car?.vin ?? "")_password")
              client.setPassword(password: passwordFromKeychain)
            }else{
              client.setPassword(password: userCar.password)
            }
            
            
            let hvacLaunchStatus = try await client.launchHvac(vin: vin)
            if(hvacLaunchStatus == true){
              isASuccess = true
            }
            dispatchSemaphore.signal()
          }catch{
            // nothing to do, it is not a usccess
            isASuccess = false
            dispatchSemaphore.signal()
          }
          
          dispatchSemaphore.wait()
          
        }
        
      }
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
