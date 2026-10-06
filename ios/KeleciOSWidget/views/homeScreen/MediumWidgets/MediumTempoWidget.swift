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
      if(entry.account == nil){
        Text("Vous devez d'abord vous connecter sur l'appli")
      }else if(entry.apiHandler == nil){
        Text("Impossible de se connecter au serveur Renault")
      } else if (entry.tempoApi == nil){
        Text("Impossible de se connecter au serveur RTE")
      }else{
        if (self.twoDays) {
          KeleciOSTempoMedium2DaysEntryView(entry: entry)
        } else {
          KeleciOSTempoMediumEntryView(entry: entry)
        }
        
      }
    default:
      Text("error")
    }
  }
}

struct KeleciOSTempoMediumEntryView: View{
  var entry: TempoEntry
  var body: some View{
    if #available(iOS 17, *){
      ZStack{
        KeleciOSTempoMediumView(date: entry.date, carAccount: entry.account!, apiHandler: entry.apiHandler!, userCar: entry.userCar!, image: entry.image, value: entry.carName,  appPreferences: entry.appPreferences, tempoApi: entry.tempoApi!)
          .containerBackground(for: .widget) {
            Color("blanc")
          }
      }
    }else{
      ZStack{
        KeleciOSTempoMediumView(date: entry.date, carAccount: entry.account!, apiHandler: entry.apiHandler!, userCar: entry.userCar!, image: entry.image, value: entry.carName,  appPreferences: entry.appPreferences, tempoApi: entry.tempoApi!)
      }
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
        
        iosWidgetEntryViewSmall(date: date, carAccount: carAccount, apiHandler: apiHandler, userCar: userCar, image: image, value: value, appPreferences: appPreferences)
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
