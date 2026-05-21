//
//  KeleciOSTempoWidget.swift
//  KeleciOSWidgetExtension
//
//  Created by Kelyan PEGEOT SELME on 18/09/2024.
//

import Foundation
import WidgetKit
import SwiftUI
import renaultApi


struct TempoProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> TempoEntry {
    let mockAccount = UserAccount(selectedCar: "mock", cars: [])
    let mockRenaultBatteryStatus = RenaultBatteryStatus(timestamp: "2022-01-01", batteryLevel: 50, batteryAutonomy: 50, batteryCapacity: 0, batteryAvailableEnergy: 10, plugStatus: 1, chargingStatus: 1.0,  chargingRemainingTime: 50, chargingInstantaneousPower: 10)
    let mockData = RenaultApiHandler(batteryStatus: mockRenaultBatteryStatus)
    let mockUserCar = UserCar(email: "", password: "", carMaker: "renault")
    let today = Date()
    let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today)!
    let mockTempo = tempoFinalReturn(previousColour: "RED", previousDate: yesterday, latestColour: "RED", latestDate: today, latestIsTomorrow: true)
    return TempoEntry(date: Date(), account: mockAccount, userCar: mockUserCar, carName: "Megane E-Tech", image: "megane", appPreferences: nil, tempoApi: mockTempo, apiHandler: mockData)
  }
  
  func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> TempoEntry {
    let mockAccount = UserAccount(selectedCar: "mock", cars: [])
    let mockRenaultBatteryStatus = RenaultBatteryStatus(timestamp: "2022-01-01", batteryLevel: 50, batteryAutonomy: 50, batteryCapacity: 0, batteryAvailableEnergy: 10, plugStatus: 1, chargingStatus: 1.0,  chargingRemainingTime: 50, chargingInstantaneousPower: 10)
    let mockData = RenaultApiHandler(batteryStatus: mockRenaultBatteryStatus)
    let mockUserCar = UserCar(email: "", password: "", carMaker: "renault")
    let today = Date()
    let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today)!
    let mockTempo = tempoFinalReturn(previousColour: "RED", previousDate: yesterday, latestColour: "RED", latestDate: today, latestIsTomorrow: true)
    return TempoEntry(date: Date(), account: mockAccount, userCar: mockUserCar, carName: "Megane E-Tech", image: "megane", appPreferences: nil, tempoApi: mockTempo, apiHandler: mockData)
  }
  
  func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<TempoEntry>  {
    let currentDate = Date()
    let nextRefresh = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
    
    // to store the main user account
    var userAccount: UserAccount? = nil
    // to store the car selected for the widgets
    var userCar: UserCar? = nil
    // to store the fetched api data
    var apiHandler: ApiHandler? = nil
    // to store the app preferences (use miles instead of km etc..)
    var appPreferences: AppPreferences? = nil
    // to store the car name
    var carName: String = ""
    // to store the car image
    var carImage: String = "" // base 64 image
    // to store tempo data
    var tempoApi: tempoFinalReturn? = nil
    
    if let userBundle = UserDefaults.init(suiteName: "group.kelyanselme.MyRenaultPlus") {
      // try to get the account
      userAccount = getUserAccount(userBundle: userBundle)
      
      // try to get the app preferences
      appPreferences = getUserAppPreferences(userBundle: userBundle)
      
      // write log
      if (appPreferences == nil){
        writeWidgetLog(message: "APP PREFERENCES FOUND BUT COULDN'T BE DECODED")
      }else{
        writeWidgetLog(message: "APP PREFERENCES FOUND AND DECODED")
      }
    }
    
    // if the user is logged, we can proceed
    if (userAccount != nil){
      // first, find which car is selected for widgets
      let cars = userAccount?.cars ?? []
      userCar = cars.first{ $0.car?.vin == configuration.car?.id }
      // then update the car name
      carName = userCar?.car?.model ?? "ERROR"
      // then get the image
      if let userBundle = UserDefaults.init(suiteName: "group.kelyanselme.MyRenaultPlus"){
        carImage = getCarImage(vin: userCar?.car?.vin ?? "", userBundle: userBundle)
      }
      
      // keep going only if the userCar is not undefined
      if let userCar = userCar {
        let carMaker = parseCarMaker(carMaker: userCar.carMaker)
        var client = getCarMakerApiClient(usercar: userCar)
          let semaphore = DispatchSemaphore(value: 0)
          do {
            // try to get password from keychain
            let passwordFromKeychain = try getPasswordFromKeychain(key: "\(userCar.car?.vin ?? "")_password")
            client.setPassword(password: passwordFromKeychain)
            writeWidgetLog(message: "Crypted password loaded")
            let fetchedApiHandler = try await client.getVehicleInfo(vin: userCar.car?.vin ?? "")
            apiHandler = fetchedApiHandler
            writeWidgetLog(message: "Data successfully fecthed")
            zeServices.saveLoadedCar(vin: userCar.car?.vin ?? "", zecar: fetchedApiHandler)
            semaphore.signal()
          } catch {
            // Fallback to local data if fetching fails
            writeWidgetLog(message: "Loading cache data")
            apiHandler = zeServices.loadSavedCar(vin: userCar.car?.vin ?? "", carMaker: carMaker)
            semaphore.signal()
          }
          semaphore.wait()
        
        //         fetch rte data for tempo
        let semaphore_tempo = DispatchSemaphore(value: 0)
        Task{
          tempoApi = await getTempoData()
          semaphore_tempo.signal()
        }
        semaphore_tempo.wait()
      }
    }
    
    let entry = TempoEntry(date: currentDate, account: userAccount, userCar: userCar, carName: carName, image: carImage, appPreferences: appPreferences, tempoApi: tempoApi, apiHandler: apiHandler)
    let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))
    return timeline
    
  }
}


struct TempoEntry: TimelineEntry {
  let date: Date
  let account: UserAccount?
  let userCar: UserCar?
  let carName: String
  let image: String
  let appPreferences: AppPreferences?
  let tempoApi: tempoFinalReturn?
  let apiHandler: ApiHandler?
}


struct KeleciOSTempoWidget: Widget {
  let kind: String = "KeleciOSTempoWidget"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: TempoProvider()) { entry in
      KeleciOSTempoEntryView(entry: entry, twoDays: false)
    }
    .contentMarginsDisabledIfAvailable()
    .configurationDisplayName("Renault E-Tech Tempo")
    .description(LocalizedStringKey("Regroupe les informations de votre Renault E-Tech sur votre écran d'accueil avec l'indication Tempo").stringValue())
    .supportedFamilies([.systemMedium])
  }
}

struct KeleciOSTempo2DaysWidget: Widget {
  let kind: String = "KeleciOSTempo2DaysWIidget"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: TempoProvider()) { entry in
      KeleciOSTempoEntryView(entry: entry, twoDays: true)
    }
    .contentMarginsDisabledIfAvailable()
    .configurationDisplayName("Renault E-Tech Tempo")
    .description(LocalizedStringKey("Regroupe les informations de votre Renault E-Tech sur votre écran d'accueil avec l'indication Tempo sur 2 jours").stringValue())
    .supportedFamilies([.systemMedium])
  }
}
