//
//  KelecWatchOSWidget.swift
//  KelecWatchOSWidgetsExtension
//
//  Created by Kelyan Pegeot-Selme on 28/06/2024.
//

import Foundation
import SwiftUI
import renaultApi
import WidgetKit


struct Provider: TimelineProvider {
  
  func placeholder(in context: Context) -> SimpleEntry {
    let mockAccount = UserAccount(selectedCar: "mock", cars: [])
    let mockRenaultBatteryStatus = RenaultBatteryStatus(timestamp: "2022-01-01", batteryLevel: 50, batteryAutonomy: 50, batteryCapacity: 0, batteryAvailableEnergy: 10, plugStatus: 1, chargingStatus: 1.0,  chargingRemainingTime: 50, chargingInstantaneousPower: 10)
    let mockData = RenaultApiHandler(batteryStatus: mockRenaultBatteryStatus)
    let mockUserCar = UserCar(email: "", password: "", carMaker: "renault")
    return SimpleEntry(date: Date(), account: mockAccount, userCar: mockUserCar, carName: "Megane E-Tech", appPreferences: nil, apiHandler: mockData)
  }
  
  func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
    let mockAccount = UserAccount(selectedCar: "mock", cars: [])
    let mockRenaultBatteryStatus = RenaultBatteryStatus(timestamp: "2022-01-01", batteryLevel: 50, batteryAutonomy: 50, batteryCapacity: 0, batteryAvailableEnergy: 10, plugStatus: 1, chargingStatus: 1.0,  chargingRemainingTime: 50, chargingInstantaneousPower: 10)
    let mockData = RenaultApiHandler(batteryStatus: mockRenaultBatteryStatus)
    let mockUserCar = UserCar(email: "", password: "", carMaker: "renault")
    let entry = SimpleEntry(date: Date(), account: mockAccount, userCar: mockUserCar, carName: "Megane E-Tech", appPreferences: nil, apiHandler: mockData)
    completion(entry)
    return
  }
  
  func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ())   {
    Task{
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
      
      if let userBundle = UserDefaults.init(suiteName: "group.kelyanselme.MyRenaultPlus") {
        // try to get the account
        userAccount = getAccountFromUserDefaults()
        
        // try to get the app preferences
        appPreferences = getUserAppPreferencesFromUserDefaults()
        
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
        userCar = getAccountUserCar(userAccount: userAccount!)
        // then update the car name
        carName = userCar?.car?.model ?? "ERROR"
        // then get the image
        if let userBundle = UserDefaults.init(suiteName: "group.kelyanselme.MyRenaultPlus"){
          carImage = getCarImage(vin: userCar?.car?.vin ?? "", userBundle: userBundle)
        }
        
        // keep going only if the userCar is not undefined
        if let userCar = userCar {
          let carMaker = parseCarMaker(carMaker: userCar.carMaker)
          let client = getCarMakerApiClient(usercar: userCar)
          let semaphore = DispatchSemaphore(value: 0)
          do {
            let fetchedApiHandler = try await client.getVehicleInfo(vin: userCar.car?.vin ?? "", jwt: "")
            apiHandler = fetchedApiHandler
            zeServices.saveLoadedCar(vin: userCar.car?.vin ?? "", zecar: fetchedApiHandler)
            semaphore.signal()
          } catch {
            // Fallback to local data if fetching fails
            apiHandler = zeServices.loadSavedCar(vin: userCar.car?.vin ?? "", carMaker: carMaker)
            semaphore.signal()
          }
          semaphore.wait()
        }
        
        
      }
      
      let entry = SimpleEntry(date: currentDate, account: userAccount, userCar: userCar, carName: carName,  appPreferences: appPreferences, apiHandler: apiHandler)
      let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))
      completion(timeline)
    }
  }
}

struct SimpleEntry: TimelineEntry {
  let date: Date
  let account: UserAccount?
  let userCar: UserCar?
  let carName: String
  let appPreferences: AppPreferences?
  let apiHandler: ApiHandler?
}

struct KelecWatchOSWidgetEntryView : View {
  var alternative: Int = 0
  var entry: Provider.Entry
  @Environment(\.widgetFamily) var family
  var body: some View{
    if #available(iOSApplicationExtension 16.0, *) {
      switch family{
      case .accessoryCircular:
        KelecLockScreenCircularEntryView(apiHandler: entry.apiHandler, alternative: alternative)
      case .accessoryInline:
        if(entry.account) == nil{
          Text(String(localized: "Vous devez d'abord vous connecter sur l'appli"))
        }
        else if(entry.account?.selectedCar ?? "" == ""){
          Text(String(localized: "Vous devez d'abord sélectionner une voiture sur l'appli"))
        }else if(entry.apiHandler == nil){
          Text(String(localized: "Impossible de se connecter au serveur"))
        }else{
          KelecLockScreenInlineView(apiHandler: entry.apiHandler!)
        }
      case .accessoryRectangular:
        if(entry.account) == nil{
          Text(String(localized: "Vous devez d'abord vous connecter sur l'appli"))
        }
        else if(entry.account?.selectedCar ?? "" == ""){
          Text(String(localized: "Vous devez d'abord sélectionner une voiture sur l'appli"))
        }else if(entry.apiHandler == nil){
          Text(String(localized: "Impossible de se connecter au serveur"))
        }else{
          KelecLockScreenRectangularEntryView(apiHandler: entry.apiHandler!, value: entry.carName, appPreferences: entry.appPreferences)
        }
          case .accessoryCorner:
        Text("\(entry.apiHandler?.getBatteryLevel() ?? 0)%")
                        .widgetLabel {
                            ProgressView(value: Double(entry.apiHandler?.getBatteryLevel() ?? 0), total: 100)
                                .tint(.accentColor)
                                .widgetAccentable()
                        }
                        .backport.widgetCurvesContent()

          default:
              Gauge(value: 0 , in: 0...100) {
                  Image(systemName:  "car.fill")
              }currentValueLabel: {
                  Text("XX")
              }
              .gaugeStyle(.accessoryCircular)
              .widgetAccentable()
              .tint(.accentColor)
          }
          
      }else{
          EmptyView()
      }
  }
}

struct KelecWatchOSWidget: Widget {
    let kind: String = "KelecWatchWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            KelecWatchOSWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Renault E-Tech")
        .description("Niveau de charge de votre Renault E-Tech")
        .supportedFamilies([.accessoryCircular, .accessoryInline, .accessoryRectangular, .accessoryCorner])
    }
}

struct KelecWatchOSWidgetAlternative: Widget {
    let kind: String = "KelecWatchWidgetAlternative"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
          KelecWatchOSWidgetEntryView(alternative: 1, entry: entry)
        }
        .configurationDisplayName("Renault E-Tech Alternative")
        .description("Niveau de charge de votre Renault E-Tech")
        .supportedFamilies([.accessoryCircular])
    }
}

public struct Backport<Content> {
  public let content: Content

  public init(_ content: Content) {
    self.content = content
  }
}

extension View {
  var backport: Backport<Self> { Backport(self) }
}

extension Backport where Content: View {
  @ViewBuilder func widgetCurvesContent() -> some View {
    if #available(watchOS 10.0, iOSApplicationExtension 17.0, iOS 17.0, macOSApplicationExtension 14.0, *) {
      content.widgetCurvesContent()

    } else {
      content
    }
  }
  // You can put multiple funcs in here
}
