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

struct MediumTempo2DaysWidgetView: View {
  var apiHandler: ApiHandler
  var carName: String
  var image: String
  var appPreferences: AppPreferences?
  var tempoApi: tempoFinalReturn
  
  var body: some View{
    GeometryReader { geo in
      HStack{
        
        SmallCarWidgetView(apiHandler: apiHandler, carName: carName, image: image, appPreferences: appPreferences)
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
            Text("\(localized(tempoApi.previousColour))")
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
            Text("\(localized(tempoApi.latestColour))")
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


