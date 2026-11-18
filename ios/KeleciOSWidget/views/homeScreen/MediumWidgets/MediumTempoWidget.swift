//
//  MediumTempoWidget.swift
//  KeleciOSWidgetExtension
//
//  Created by Kelyan PEGEOT SELME on 18/09/2024.
//

import Foundation
import SwiftUI
import WidgetKit
import renaultApi

struct TempoWidgetEntryView: View {
  var entry: TempoProvider.Entry
  var twoDays: Bool
  @Environment(\.widgetFamily) var family
  var body: some View{
    switch family{
    case .systemMedium:
      CarWidgetStateView(account: entry.account, userCar: entry.userCar, apiHandler: entry.apiHandler, serverError: "tempoCarServerError") { _, userCar, apiHandler in
        if let tempoApi = entry.tempoApi {
          // the result of the pre-heating button covers the whole widget
          HvacFeedbackContainer(vin: userCar.car?.vin, feedback: entry.hvacFeedback) {
            if (self.twoDays) {
              MediumTempo2DaysWidgetView(apiHandler: apiHandler, carName: entry.carName, image: entry.image, appPreferences: entry.appPreferences, tempoApi: tempoApi, vin: userCar.car?.vin)
            } else {
              MediumTempoWidgetView(apiHandler: apiHandler, carName: entry.carName, image: entry.image, appPreferences: entry.appPreferences, tempoApi: tempoApi, vin: userCar.car?.vin)
            }
          }
          .widgetBackground()
        } else {
          Text("tempoRteServerError")
        }
      }
    default:
      Text("error")
    }
  }
}

struct MediumTempoWidgetView: View{
  var apiHandler: ApiHandler
  var carName: String
  var image: String
  var appPreferences: AppPreferences?
  var tempoApi: tempoFinalReturn
  var vin: String? = nil
  var body: some View{
    GeometryReader { geo in
      HStack{
        
        SmallCarWidgetView(apiHandler: apiHandler, carName: carName, image: image, appPreferences: appPreferences, vin: vin)
          .widgetBackground()
        .frame(width: geo.size.width/2, height: geo.size.height)
        
        
        VStack{
          Text(TempoStyle.formatDate(tempoApi.latestDate))
            .font(.title3)
            .fontWeight(.bold)
            .foregroundStyle(TempoStyle.foregroundColour(tempoApi.latestColour))
            .accentColor(.clear)
          Spacer()
          Text("\(localized(tempoApi.latestColour))")
            .font(.title2)
            .fontWeight(.bold)
            .foregroundStyle(TempoStyle.foregroundColour(tempoApi.latestColour))
            .accentColor(.clear)
          Spacer()
          Text("HP \(String(format: "%.2f", TempoStyle.hpPrice(tempoApi.latestColour))) c/kWh")
            .widgetAccentable(false)
            .font(.caption)
            .foregroundColor(TempoStyle.foregroundColour(tempoApi.latestColour))
            
          Text("HC \(String(format: "%.2f", TempoStyle.hcPrice(tempoApi.latestColour))) c/kWh")
            .font(.caption)
            .foregroundStyle(TempoStyle.foregroundColour(tempoApi.latestColour))
            .accentColor(.clear)
        }
        .padding()
        .frame(width: geo.size.width/2, height: geo.size.height)
        .foregroundStyle(TempoStyle.backgroundColour(tempoApi.latestColour))
        .background(TempoStyle.backgroundColour(tempoApi.latestColour))
        
      }
      
    }
  }
}
