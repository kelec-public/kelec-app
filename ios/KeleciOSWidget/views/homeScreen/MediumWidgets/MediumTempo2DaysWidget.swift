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

struct KeleciOSTempoMedium2DaysEntryView: View{
  var entry: TempoEntry
  var body: some View{
    if #available(iOS 17, *){
      ZStack{
        KeleciOSTempoMedium2DaysWidgetView(date: entry.date, carAccount: entry.account!, apiHandler: entry.apiHandler!, userCar: entry.userCar!, image: entry.image, value: entry.carName,  appPreferences: entry.appPreferences, tempoApi: entry.tempoApi!)
          .containerBackground(for: .widget) {
            Color("blanc")
          }
      }
    }else{
      ZStack{
        KeleciOSTempoMedium2DaysWidgetView(date: entry.date, carAccount: entry.account!, apiHandler: entry.apiHandler!, userCar: entry.userCar!, image: entry.image, value: entry.carName,  appPreferences: entry.appPreferences, tempoApi: entry.tempoApi!)
      }
    }
  }
}


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
        
        iosWidgetEntryViewSmall(date: date, carAccount: carAccount, apiHandler: apiHandler, userCar: userCar, image: image, value: value, appPreferences: appPreferences)
          .frame(width: geo.size.width/2, height: geo.size.height)
        
        VStack(spacing: 0) {
          // partie du haut, previous
          VStack{
            Text(formatDate(date: tempoApi.previousDate))
              .font(.title3)
              .fontWeight(.bold)
              .foregroundStyle(self.getFgColour(colour: tempoApi.previousColour))
              .accentColor(.clear)
            Text("\(LocalizedStringKey(tempoApi.previousColour).stringValue())")
              .font(.title2)
              .fontWeight(.bold)
              .foregroundStyle(self.getFgColour(colour: tempoApi.previousColour))
              .accentColor(.clear)
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity)
          .background(self.getBgColour(colour: tempoApi.previousColour))
          
          VStack{
            Text(formatDate(date: tempoApi.latestDate))
              .font(.title3)
              .fontWeight(.bold)
              .foregroundStyle(self.getFgColour(colour: tempoApi.latestColour))
              .accentColor(.clear)
            Text("\(LocalizedStringKey(tempoApi.latestColour).stringValue())")
              .font(.title2)
              .fontWeight(.bold)
              .foregroundStyle(self.getFgColour(colour: tempoApi.latestColour))
              .accentColor(.clear)
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity)
          .background(self.getBgColour(colour: tempoApi.latestColour))
        }
        .frame(width: geo.size.width/2, height: geo.size.height)
      }
    }
  }
  private func formatDate(date: Date) -> String {
    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "dd/MM"
    return dateFormatter.string(from: date)
  }
  
  func getBgColour(colour: String) -> Color{
    switch(colour){
    case "BLUE":
      return Color.blue
    case "WHITE":
      return Color.white
    case "RED":
      return Color.red
    default:
      return Color.pink
    }
  }
  
  func getFgColour(colour: String) -> Color{
    switch(colour){
    case "WHITE":
      return Color.black
    default:
      return Color.white
    }
  }
}


