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


struct Provider: AppIntentTimelineProvider {
  
  func placeholder(in context: Context) -> SimpleEntry {
    SimpleEntry.preview
  }
  
  func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
    SimpleEntry.preview
  }
  
  func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry> {
    let currentDate = Date()
    let nextRefresh = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
    let data = await VehicleLoader.loadWidgetData { account in
      watchWidgetCar(account: account, configuredVin: configuration.car?.id)
    }
    let entry = SimpleEntry(date: currentDate, account: data.account, userCar: data.userCar, carName: data.carName,  appPreferences: data.appPreferences, apiHandler: data.apiHandler)
    return Timeline(entries: [entry], policy: .after(nextRefresh))
  }
  
  // watchOS has no widget configuration screen: one preconfigured widget is offered per car.
  // Refreshed by WatchSync when the synced account changes
  func recommendations() -> [AppIntentRecommendation<ConfigurationAppIntent>] {
    let cars = buildCarWidgetEntityFromUserCars(userCars: SharedStore.loadAccount()?.cars ?? [])
    guard !cars.isEmpty else {
      // not synced yet: keep a widget available, it shows what to do
      return [AppIntentRecommendation(intent: ConfigurationAppIntent(), description: "Renault E-Tech")]
    }
    return cars.map { car in
      AppIntentRecommendation(intent: ConfigurationAppIntent(car: car), description: car.name)
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

extension SimpleEntry {
  static var preview: SimpleEntry {
    SimpleEntry(date: Date(), account: PreviewData.account, userCar: PreviewData.userCar, carName: PreviewData.carName, appPreferences: nil, apiHandler: PreviewData.apiHandler)
  }
}

struct KelecWatchOSWidgetEntryView : View {
  var alternative: Int = 0
  var entry: Provider.Entry
  @Environment(\.widgetFamily) var family
  var body: some View{
    switch family{
    case .accessoryCircular:
      KelecLockScreenCircularView(apiHandler: entry.apiHandler, alternative: alternative)
        .widgetBackground()
    case .accessoryInline:
      CarWidgetStateView(account: entry.account, userCar: entry.userCar, apiHandler: entry.apiHandler) { _, _, apiHandler in
        KelecLockScreenInlineView(apiHandler: apiHandler)
      }
    case .accessoryRectangular:
      CarWidgetStateView(account: entry.account, userCar: entry.userCar, apiHandler: entry.apiHandler) { _, _, apiHandler in
        KelecLockScreenRectangularView(apiHandler: apiHandler, carName: entry.carName, appPreferences: entry.appPreferences)
          .widgetBackground()
      }
    case .accessoryCorner:
      Text("\(entry.apiHandler?.getBatteryLevel() ?? 0)%")
        .widgetLabel {
          ProgressView(value: Double(entry.apiHandler?.getBatteryLevel() ?? 0), total: 100)
            .tint(.accentColor)
            .widgetAccentable()
        }
        .widgetCurvesContent()
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
  }
}

struct KelecWatchOSWidget: Widget {
    let kind: String = "KelecWatchWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
            KelecWatchOSWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Renault E-Tech")
        .description("watchWidgetDescription")
        .supportedFamilies([.accessoryCircular, .accessoryInline, .accessoryRectangular, .accessoryCorner])
    }
}

struct KelecWatchOSWidgetAlternative: Widget {
    let kind: String = "KelecWatchWidgetAlternative"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
          KelecWatchOSWidgetEntryView(alternative: 1, entry: entry)
        }
        .configurationDisplayName("Renault E-Tech Alternative")
        .description("watchWidgetDescription")
        .supportedFamilies([.accessoryCircular])
    }
}
