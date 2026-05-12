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
        KeleciOSTempoMediumEntryView(entry: entry)
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
          Text(formatDate(date: tempoApi.date))
            .font(.title3)
            .fontWeight(.bold)
            .foregroundStyle(self.getFgColour())
            .accentColor(.clear)
          Spacer()
          Text("\(LocalizedStringKey(tempoApi.colour).stringValue())")
            .font(.title2)
            .fontWeight(.bold)
            .foregroundStyle(self.getFgColour())
            .accentColor(.clear)
          Spacer()
          Text("HP \(String(format: "%.2f", self.getHPPrice())) c/kWh")
            .widgetAccentable(false)
            .font(.caption)
            .foregroundColor(self.getFgColour())
            
          Text("HC \(String(format: "%.2f", self.getHCPrice())) c/kWh")
            .font(.caption)
            .foregroundStyle(self.getFgColour())
            .accentColor(.clear)
        }
        .padding()
        .frame(width: geo.size.width/2, height: geo.size.height)
        .foregroundStyle(self.getBgColour())
        .background(self.getBgColour())
        
      }
      
    }
  }
  private func formatDate(date: Date) -> String {
          let dateFormatter = DateFormatter()
          dateFormatter.dateFormat = "dd/MM"
          return dateFormatter.string(from: date)
      }
  
  func getHPPrice()->Float{
    let client = getRteClient()
    return client.getHPPrice(colour: self.tempoApi.colour)
  }
  
  func getHCPrice()->Float{
    let client = getRteClient()
    return client.getHCPrice(colour: self.tempoApi.colour)
  }
  
  func getBgColour()->Color{
    switch(self.tempoApi.colour){
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
  
  func getFgColour()->Color{
    switch(self.tempoApi.colour){
    case "WHITE":
      return Color.black
    default:
      return Color.white
    }
  }
}
