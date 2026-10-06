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
    SimpleEntry.preview
  }
  
  func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
    SimpleEntry.preview
  }
  
  func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry>  {
    let currentDate = Date()
    let nextRefresh = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
    let data = await VehicleLoader.loadWidgetData { account in
      widgetCar(account: account, configuredVin: configuration.car?.id)
    }
    let entry = SimpleEntry(date: currentDate, data: data)
    return Timeline(entries: [entry], policy: .after(nextRefresh))
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

extension SimpleEntry {
  init(date: Date, data: CarWidgetData) {
    self.init(date: date, account: data.account, userCar: data.userCar, carName: data.carName, image: data.image, appPreferences: data.appPreferences, apiHandler: data.apiHandler)
  }

  static var preview: SimpleEntry {
    SimpleEntry(date: Date(), account: PreviewData.account, userCar: PreviewData.userCar, carName: PreviewData.carName, image: PreviewData.image, appPreferences: nil, apiHandler: PreviewData.apiHandler)
  }
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
      }else if(entry.userCar == nil){
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
      else if(entry.userCar == nil){
        Text(String(localized: "Vous devez d'abord sélectionner une voiture sur l'appli"))
      }else if(entry.apiHandler == nil){
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
      else if(entry.userCar == nil){
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
      else if(entry.userCar == nil){
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

