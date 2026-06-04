//
//  KeleciOSWidget.swift
//  KeleciOSWidget
//
//  Created by Kelyan Pegeot-Selme on 18/03/2024.
//

import WidgetKit
import SwiftUI
import renaultApi




struct Provider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> SimpleEntry {
    let mockAccount = UserAccount(selectedCar: "mock", cars: [])
    let mockRenaultBatteryStatus = RenaultBatteryStatus(timestamp: "2022-01-01", batteryLevel: 50, batteryAutonomy: 50, batteryCapacity: 0, batteryAvailableEnergy: 10, plugStatus: 1, chargingStatus: 1.0,  chargingRemainingTime: 50, chargingInstantaneousPower: 10)
    let mockData = RenaultApiHandler(batteryStatus: mockRenaultBatteryStatus)
    let mockUserCar = UserCar(email: "", password: "", carMaker: "renault")
    return SimpleEntry(date: Date(), account: mockAccount, userCar: mockUserCar, carName: "Megane E-Tech", image: "megane", appPreferences: nil, apiHandler: mockData)
  }
  
  func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
    let mockAccount = UserAccount(selectedCar: "mock", cars: [])
    let mockRenaultBatteryStatus = RenaultBatteryStatus(timestamp: "2022-01-01", batteryLevel: 50, batteryAutonomy: 50, batteryCapacity: 0, batteryAvailableEnergy: 10, plugStatus: 1, chargingStatus: 1.0,  chargingRemainingTime: 50, chargingInstantaneousPower: 10)
    let mockData = RenaultApiHandler(batteryStatus: mockRenaultBatteryStatus)
    let mockUserCar = UserCar(email: "", password: "", carMaker: "renault")
    return SimpleEntry(date: Date(), account: mockAccount, userCar: mockUserCar, carName: "Megane E-Tech", image: "megane", appPreferences: nil, apiHandler: mockData)
  }
  
  func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry>  {
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
      
      userAccount = getUserAccount(userBundle: userBundle)
      
      // try to get the app preferences
      appPreferences = getUserAppPreferences(userBundle: userBundle)
      
      // write log
      if (appPreferences == nil){
        writeWidgetLog(message: "APP PREFERENCES POSSIBLY FOUND BUT COULDN'T BE DECODED")
      }else{
        writeWidgetLog(message: "APP PREFERENCES FOUND AND DECODED")
      }
    }
    
    // if the user is logged, we can proceed
    if (userAccount != nil){
      // first, find which car is selected for widgets
      let cars = userAccount?.cars ?? []
      
      if let configuredVin = configuration.car?.id {
        userCar = cars.first{ $0.car?.vin == configuredVin }
        if userCar == nil {
          writeWidgetLog(message: "Configured car not found (vin: \(configuredVin), falling back to first car")
          userCar = cars.first
        }
      } else {
        writeWidgetLog(message: "No car configured, using first available car")
        userCar = cars.first
      }
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
        

      }
    }
    
    let entry = SimpleEntry(date: currentDate, account: userAccount, userCar: userCar, carName: carName, image: carImage, appPreferences: appPreferences, apiHandler: apiHandler)
    let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))
    return timeline
  }
}

struct SimpleEntry: TimelineEntry {
  let date: Date
  let account: UserAccount?
  let userCar: UserCar?
  let carName: String
  let image: String
  let appPreferences: AppPreferences?
  let apiHandler: ApiHandler?
}

struct KeleciOSWidgetEntryView : View {
  var entry: Provider.Entry
  var alternative: Int = 0
  @Environment(\.widgetFamily) var family
  var body: some View{
    switch family{
    case .systemSmall:
      if(entry.account == nil){
        Text("Vous devez d'abord vous connecter sur l'appli")
      }else if(entry.account?.selectedCar ?? "" == ""){
        Text(String(localized: "Vous devez d'abord sélectionner une voiture sur l'appli"))
      }else if(entry.apiHandler == nil){
        Text("Impossible de se connecter au serveur")
      }else{
        iosWidgetEntryViewSmall(date: entry.date, carAccount: entry.account!, apiHandler: entry.apiHandler!, userCar: entry.userCar!, image: entry.image, value:entry.carName, appPreferences: entry.appPreferences)
      }
    case .systemMedium:
      if(entry.account == nil){
        Text(String(localized: "Vous devez d'abord vous connecter sur l'appli"))
      }
      else if(entry.account?.selectedCar ?? "" == ""){
        Text(String(localized: "Vous devez d'abord sélectionner une voiture sur l'appli"))
      }else if(entry.account?.selectedCar ?? "" != "" && entry.apiHandler == nil){
        Text(String(localized: "Impossible de se connecter au serveur"))
      }else{
        switch (self.alternative){
        case 0:
          iosWidgetEntryViewMedium(date: entry.date, carAccount: entry.account!, apiHandler: entry.apiHandler!, userCar: entry.userCar!, image: entry.image, value:entry.carName, alternative: alternative, appPreferences: entry.appPreferences)
        case 1:
          iosAlt1EntryViewMedium(date: entry.date, carAccount: entry.account!, apiHandler: entry.apiHandler!, userCar: entry.userCar!, image: entry.image, value:entry.carName, alternative: alternative, appPreferences: entry.appPreferences)

        default:
          iosWidgetEntryViewMedium(date: entry.date, carAccount: entry.account!, apiHandler: entry.apiHandler!, userCar: entry.userCar!, image: entry.image, value:entry.carName, alternative: alternative, appPreferences: entry.appPreferences)

        }
      }
    default:
      Text("error")
    }
  }
}

struct KeleciOSWidget: Widget {
  let kind: String = "KeleciOSWidget"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
      KeleciOSWidgetEntryView(entry: entry)
    }

    .contentMarginsDisabledIfAvailable()
    .configurationDisplayName("Renault E-Tech")
    .description(String(localized: "Regroupe les informations de votre Renault E-Tech sur votre écran d'accueil"))
    .supportedFamilies([.systemMedium, .systemSmall])
  }
}

struct KeleciOSWidget2: Widget {
  let kind: String = "KeleciOSWidget2"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
      KeleciOSWidgetEntryView(entry: entry, alternative: 1)
    }

    .contentMarginsDisabledIfAvailable()
    .configurationDisplayName("Renault E-Tech")
    .description(String(localized: "Regroupe les informations de votre Renault E-Tech sur votre écran d'accueil"))
    .supportedFamilies([.systemMedium])
  }
}

struct KelecLockScreenWidgetEntryView:View {
  var entry: Provider.Entry
  var alternative: Int = 0
  @Environment(\.widgetFamily) var family
  var body: some View {
    switch family{
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
    case .accessoryCircular:
      KelecLockScreenCircularEntryView(apiHandler: entry.apiHandler, alternative: alternative)
    default:
      Text("error")
    }
  }
}

struct KelecLockScreenWidget: Widget {
  let kind: String = "KelecLockScreenWidget"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
      KelecLockScreenWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Renault E-Tech")
    .description(LocalizedStringKey("Regroupe les informations de votre Renault E-Tech sur votre écran de verrouillage").stringValue())
    .supportedFamilies([.accessoryRectangular, .accessoryInline, .accessoryCircular])
  }
}

struct KelecLockScreenWidgetAlternative: Widget{
  let kind: String = "KelecLockScreenWidgetAlternative"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
      KelecLockScreenWidgetEntryView(entry: entry, alternative: 1)
    }
    .configurationDisplayName("Renault E-Tech")
    .description(LocalizedStringKey("Regroupe les informations de votre Renault E-Tech sur votre écran de verrouillage").stringValue())
    .supportedFamilies([.accessoryCircular])
  }
  
}



extension Image{
  init?(base64str: String){
    guard let data = Data(base64Encoded: base64str) else { return nil}
    guard let uiImg = UIImage(data: data) else { return nil}
    self = Image(uiImage: uiImg)
  }
}



extension WidgetConfiguration
{
  func contentMarginsDisabledIfAvailable() -> some WidgetConfiguration
  {
    if #available(iOSApplicationExtension 17.0, *)
    {
      return self.contentMarginsDisabled()
    }
    else
    {
      return self
    }
  }
}

