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
    TempoEntry.preview
  }
  
  func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> TempoEntry {
    TempoEntry.preview
  }
  
  func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<TempoEntry>  {
    let currentDate = Date()
    let nextRefresh = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
    let data = await VehicleLoader.loadWidgetData { account in
      widgetCar(account: account, configuredVin: configuration.car?.id)
    }
    // tempo data is only useful when a car is displayed
    let tempoApi = data.userCar != nil ? await TempoService.fetch() : nil
    let entry = TempoEntry(date: currentDate, data: data, tempoApi: tempoApi)
    return Timeline(entries: [entry], policy: .after(nextRefresh))
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

extension TempoEntry {
  init(date: Date, data: CarWidgetData, tempoApi: tempoFinalReturn?) {
    self.init(date: date, account: data.account, userCar: data.userCar, carName: data.carName, image: data.image, appPreferences: data.appPreferences, tempoApi: tempoApi, apiHandler: data.apiHandler)
  }

  static var preview: TempoEntry {
    TempoEntry(date: Date(), account: PreviewData.account, userCar: PreviewData.userCar, carName: PreviewData.carName, image: PreviewData.image, appPreferences: nil, tempoApi: PreviewData.tempo, apiHandler: PreviewData.apiHandler)
  }
}


struct KeleciOSTempoWidget: Widget {
  let kind: String = "KeleciOSTempoWidget"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: TempoProvider()) { entry in
      TempoWidgetEntryView(entry: entry, twoDays: false)
    }
    .contentMarginsDisabled()
    .configurationDisplayName("Renault E-Tech Tempo")
    .description(LocalizedStringKey("tempoWidgetDescription").stringValue())
    .supportedFamilies([.systemMedium])
  }
}

struct KeleciOSTempo2DaysWidget: Widget {
  let kind: String = "KeleciOSTempo2DaysWIidget"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: TempoProvider()) { entry in
      TempoWidgetEntryView(entry: entry, twoDays: true)
    }
    .contentMarginsDisabled()
    .configurationDisplayName("Renault E-Tech Tempo")
    .description(LocalizedStringKey("tempo2DaysWidgetDescription").stringValue())
    .supportedFamilies([.systemMedium])
  }
}
