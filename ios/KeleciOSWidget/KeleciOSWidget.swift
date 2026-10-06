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
      CarWidgetStateView(account: entry.account, userCar: entry.userCar, apiHandler: entry.apiHandler) { account, userCar, apiHandler in
        iosWidgetSmallView(date: entry.date, carAccount: account, apiHandler: apiHandler, userCar: userCar, image: entry.image, value: entry.carName, appPreferences: entry.appPreferences)
          .widgetBackground()
      }
    case .systemMedium:
      CarWidgetStateView(account: entry.account, userCar: entry.userCar, apiHandler: entry.apiHandler) { account, userCar, apiHandler in
        if self.alternative == 1 {
          iosAlt1WidgetMediumView(date: entry.date, carAccount: account, apiHandler: apiHandler, userCar: userCar, image: entry.image, value: entry.carName, appPreferences: entry.appPreferences)
            .widgetBackground()
        } else {
          iosWidgetMediumView(date: entry.date, carAccount: account, apiHandler: apiHandler, userCar: userCar, image: entry.image, value: entry.carName, appPreferences: entry.appPreferences)
            .widgetBackground()
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
    .description(String(localized: "widgetHomeScreenDescription"))
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
    .description(String(localized: "widgetHomeScreenDescription"))
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
      CarWidgetStateView(account: entry.account, userCar: entry.userCar, apiHandler: entry.apiHandler) { _, _, apiHandler in
        KelecLockScreenInlineView(apiHandler: apiHandler)
      }
    case .accessoryRectangular:
      CarWidgetStateView(account: entry.account, userCar: entry.userCar, apiHandler: entry.apiHandler) { _, _, apiHandler in
        KelecLockScreenRectangularView(apiHandler: apiHandler, value: entry.carName, appPreferences: entry.appPreferences)
          .widgetBackground()
      }
    case .accessoryCircular:
      KelecLockScreenCircularView(apiHandler: entry.apiHandler, alternative: alternative)
        .widgetBackground()
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
    .description(LocalizedStringKey("widgetLockScreenDescription").stringValue())
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
    .description(LocalizedStringKey("widgetLockScreenDescription").stringValue())
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

