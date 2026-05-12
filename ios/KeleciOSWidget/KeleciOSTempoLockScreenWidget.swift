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
    let mockTempo = tempoFinalReturn(tomorrow: true, colour: "RED", date: Date())
    return TempoLockScreenEntry(date: Date(), tempoApi: mockTempo)
  }
  
  func getSnapshot(in context: Context, completion: @escaping (TempoLockScreenEntry) -> Void) {
    let mockTempo = tempoFinalReturn(tomorrow: true, colour: "RED", date: Date())
    let entry =  TempoLockScreenEntry(date: Date(), tempoApi: mockTempo)
    completion(entry)
  }
  
  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    Task{
      let entryDate = Date()
      var tempoApi: tempoFinalReturn? = nil
      let nextRefresh = Calendar.current.date(byAdding: .minute, value: 15, to: entryDate)!
      let rteClient = getRteClient()
      if let tempoReturn = try? await rteClient.getTempo(){
        tempoApi = tempoReturn
        zeServices.saveTempoData(tempo: tempoReturn)
      }else{
        tempoApi = zeServices.loadTempoData()
      }
      let entry = TempoLockScreenEntry(date: entryDate, tempoApi: tempoApi)
      let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))
      completion(timeline)
      return
    }
  }

}

struct iosTempoLockScreenEntryView: View {
  var entry: LockScreenTempoProvider.Entry
  @Environment(\.widgetFamily) var family
  var body: some View{
    switch family{
    case .accessoryRectangular:
      iosTempoLockScreenRectangular(tempoApi: entry.tempoApi)
    case .accessoryInline:
      iosTempoLockScreenInline(tempoApi: entry.tempoApi)
    default:
      Text("error")
    }
  }
}

struct iosTempoLockScreenInline: View {
  var tempoApi: tempoFinalReturn?
  var body: some View {
    if(tempoApi != nil){
        Text("\(formatDate(date: tempoApi!.date)) \(LocalizedStringKey(tempoApi!.colour).stringValue())")
          .fontWeight(.bold)
    }else{
      Text("ERREUR CHARGEMENT DONNÉES")
    }
  }
  
  private func formatDate(date: Date) -> String {
          let dateFormatter = DateFormatter()
          dateFormatter.dateFormat = "dd/MM"
          return dateFormatter.string(from: date)
      }
  
  func getHPPrice()->Float{
    let client = getRteClient()
    return client.getHPPrice(colour: self.tempoApi!.colour)
  }
  
  func getHCPrice()->Float{
    let client = getRteClient()
    return client.getHCPrice(colour: self.tempoApi!.colour)
  }
  
}

struct iosTempoLockScreenRectangular: View {
  var tempoApi: tempoFinalReturn?
  var body: some View {
    if(tempoApi != nil){
      VStack{
        Text(formatDate(date: tempoApi!.date))
          .fontWeight(.bold)
        Spacer()
        Text("\(LocalizedStringKey(tempoApi!.colour).stringValue())")
          .fontWeight(.bold)
        Spacer()
        HStack(spacing: 10){
          Text("HP \(String(format: "%.2f", self.getHPPrice())) / HC \(String(format: "%.2f", self.getHCPrice()))")
            .font(.caption)
        }
       
      }
    }else{
      Text("ERREUR CHARGEMENT DONNÉES")
    }
  }
  
  private func formatDate(date: Date) -> String {
          let dateFormatter = DateFormatter()
          dateFormatter.dateFormat = "dd/MM"
          return dateFormatter.string(from: date)
      }
  
  func getHPPrice()->Float{
    let client = getRteClient()
    return client.getHPPrice(colour: self.tempoApi!.colour)
  }
  
  func getHCPrice()->Float{
    let client = getRteClient()
    return client.getHCPrice(colour: self.tempoApi!.colour)
  }
  
}


struct TempoLockScreenEntry: TimelineEntry {
  let date: Date
  let tempoApi: tempoFinalReturn?
}

struct iosTempoLockScreen: Widget {
  let kind: String = "iosTempoLockScreen"
  
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: LockScreenTempoProvider()) { entry in
      iosTempoLockScreenEntryView(entry: entry)
    }
    .configurationDisplayName("Tempo")
    .description("Indication Tempo")
    .supportedFamilies([.accessoryRectangular, .accessoryInline, .accessoryCircular])
  }
}
