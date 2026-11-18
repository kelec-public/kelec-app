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
    let data = await VehicleLoader.loadWidgetData(
      selectCar: { account in widgetCar(account: account, configuredVin: configuration.car?.id) },
      // reload right after the pre-heating button: the status has not changed, no need for a request
      useCache: { userCar in WidgetHvacFeedback.isJustSaved(vin: userCar.car?.vin, now: currentDate) }
    )
    // tempo data is only useful when a car is displayed
    let tempoApi = data.userCar != nil ? await TempoService.fetch() : nil
    // result of the pre-heating button: shown until it expires, then the button again
    return WidgetHvacFeedback.timeline(vin: data.userCar?.car?.vin, now: currentDate, nextRefresh: nextRefresh) { date, hvacFeedback in
      var entry = TempoEntry(date: date, data: data, tempoApi: tempoApi)
      entry.hvacFeedback = hvacFeedback
      return entry
    }
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
  // result of the pre-heating button, nil to show the button
  var hvacFeedback: WidgetHvacFeedback? = nil
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
    .description(localized("tempoWidgetDescription"))
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
    .description(localized("tempo2DaysWidgetDescription"))
    .supportedFamilies([.systemMedium])
  }
}
