//
//  KeleciOSTempoLockScreenWidget.swift
//  KeleciOSWidgetExtension
//
//  Created by Kelyan PEGEOT SELME on 18/09/2024.
//

import Foundation
import SwiftUI
import WidgetKit
import renaultApi

struct LockScreenTempoProvider: TimelineProvider{
  func placeholder(in context: Context) -> TempoLockScreenEntry {
    TempoLockScreenEntry(date: Date(), tempoApi: PreviewData.tempo)
  }
  
  func getSnapshot(in context: Context, completion: @escaping (TempoLockScreenEntry) -> Void) {
    completion(TempoLockScreenEntry(date: Date(), tempoApi: PreviewData.tempo))
  }
  
  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    Task{
      let entryDate = Date()
      let nextRefresh = Calendar.current.date(byAdding: .minute, value: 15, to: entryDate)!
      let entry = TempoLockScreenEntry(date: entryDate, tempoApi: await TempoService.fetch())
      completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
    }
  }

}

struct TempoLockScreenEntryView: View {
  var entry: LockScreenTempoProvider.Entry
  @Environment(\.widgetFamily) var family
  var body: some View{
    switch family{
    case .accessoryRectangular:
      TempoLockScreenRectangularView(tempoApi: entry.tempoApi)
    case .accessoryInline:
      TempoLockScreenInlineView(tempoApi: entry.tempoApi)
    default:
      Text("error")
    }
  }
}

struct TempoLockScreenInlineView: View {
  var tempoApi: tempoFinalReturn?
  var body: some View {
    if let tempoApi = tempoApi {
      Text("\(TempoStyle.formatDate(tempoApi.latestDate)) \(localized(tempoApi.latestColour))")
          .fontWeight(.bold)
    }else{
      Text("tempoLoadingError")
    }
  }
}

struct TempoLockScreenRectangularView: View {
  var tempoApi: tempoFinalReturn?
  var body: some View {
    if let tempoApi = tempoApi {
      VStack{
        Text(TempoStyle.formatDate(tempoApi.latestDate))
          .fontWeight(.bold)
        Spacer()
        Text("\(localized(tempoApi.latestColour))")
          .fontWeight(.bold)
        Spacer()
        HStack(spacing: 10){
          Text("HP \(String(format: "%.2f", TempoStyle.hpPrice(tempoApi.latestColour))) / HC \(String(format: "%.2f", TempoStyle.hcPrice(tempoApi.latestColour)))")
            .font(.caption)
        }
       
      }
    }else{
      Text("tempoLoadingError")
    }
  }
}


struct TempoLockScreenEntry: TimelineEntry {
  let date: Date
  let tempoApi: tempoFinalReturn?
}

struct TempoLockScreenWidget: Widget {
  let kind: String = "iosTempoLockScreen"
  
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: LockScreenTempoProvider()) { entry in
      TempoLockScreenEntryView(entry: entry)
    }
    .configurationDisplayName("Tempo")
    .description("tempoLockScreenWidgetDescription")
    .supportedFamilies([.accessoryRectangular, .accessoryInline, .accessoryCircular])
  }
}
