//
//  MediumTempo2DaysWidget.swift
//  KeleciOSWidgetExtension
//
//  Created by Kelyan PEGEOT SELME on 21/05/2026.
//

import Foundation
import SwiftUI
import WidgetKit
import renaultApi

struct KeleciOSTempoMedium2DaysWidgetView: View {
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
        
        VStack(spacing: 0) {
          // partie du haut, previous
          VStack{
            Text(TempoStyle.formatDate(tempoApi.previousDate))
              .font(.title3)
              .fontWeight(.bold)
              .foregroundStyle(TempoStyle.foregroundColour(tempoApi.previousColour))
              .accentColor(.clear)
            Text("\(LocalizedStringKey(tempoApi.previousColour).stringValue())")
              .font(.title2)
              .fontWeight(.bold)
              .foregroundStyle(TempoStyle.foregroundColour(tempoApi.previousColour))
              .accentColor(.clear)
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity)
          .background(TempoStyle.backgroundColour(tempoApi.previousColour))
          
          VStack{
            Text(TempoStyle.formatDate(tempoApi.latestDate))
              .font(.title3)
              .fontWeight(.bold)
              .foregroundStyle(TempoStyle.foregroundColour(tempoApi.latestColour))
              .accentColor(.clear)
            Text("\(LocalizedStringKey(tempoApi.latestColour).stringValue())")
              .font(.title2)
              .fontWeight(.bold)
              .foregroundStyle(TempoStyle.foregroundColour(tempoApi.latestColour))
              .accentColor(.clear)
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity)
          .background(TempoStyle.backgroundColour(tempoApi.latestColour))
        }
        .frame(width: geo.size.width/2, height: geo.size.height)
      }
    }
  }
}


