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

struct KeleciOSTempoEntryView: View {
  var entry: TempoProvider.Entry
  var twoDays: Bool
  @Environment(\.widgetFamily) var family
  var body: some View{
    switch family{
    case .systemMedium:
      CarWidgetStateView(account: entry.account, userCar: entry.userCar, apiHandler: entry.apiHandler, serverError: "tempoCarServerError") { account, userCar, apiHandler in
        if let tempoApi = entry.tempoApi {
          if (self.twoDays) {
            KeleciOSTempoMedium2DaysWidgetView(date: entry.date, carAccount: account, apiHandler: apiHandler, userCar: userCar, image: entry.image, value: entry.carName, appPreferences: entry.appPreferences, tempoApi: tempoApi)
              .widgetBackground()
          } else {
            KeleciOSTempoMediumView(date: entry.date, carAccount: account, apiHandler: apiHandler, userCar: userCar, image: entry.image, value: entry.carName, appPreferences: entry.appPreferences, tempoApi: tempoApi)
              .widgetBackground()
          }
        } else {
          Text("tempoRteServerError")
        }
      }
    default:
      Text("error")
    }
  }
}

struct KeleciOSTempoMediumView: View{
  var date:Date
  var carAccount: UserAccount
  var apiHandler: ApiHandler
  var userCar: UserCar
  var image: String
  var value: String
  var appPreferences: AppPreferences?
  var tempoApi: tempoFinalReturn
  var body: some View{
    GeometryReader { geo in
      HStack{
        
        iosWidgetSmallView(date: date, carAccount: carAccount, apiHandler: apiHandler, userCar: userCar, image: image, value: value, appPreferences: appPreferences)
          .widgetBackground()
        .frame(width: geo.size.width/2, height: geo.size.height)
        
        
        VStack{
          Text(TempoStyle.formatDate(tempoApi.latestDate))
            .font(.title3)
            .fontWeight(.bold)
            .foregroundStyle(TempoStyle.foregroundColour(tempoApi.latestColour))
            .accentColor(.clear)
          Spacer()
          Text("\(LocalizedStringKey(tempoApi.latestColour).stringValue())")
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
