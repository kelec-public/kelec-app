//
//  SmallWidgets.swift
//  KeleciOSWidgetExtension
//
//  Created by Kelyan Pegeot-Selme on 18/03/2024.
//

import Foundation
import WidgetKit
import renaultApi
import SwiftUI


struct SmallCarWidgetView: View{
  var apiHandler: ApiHandler
  var carName: String
  var image: String
  var appPreferences: AppPreferences?
  var body: some View{
    VStack(alignment: .leading, spacing: 0){
      HStack{
        Spacer()
        Text("\(carName)")
          .widgetAccentable()
          .font(.system(size: 15))
        Spacer()
      }
      
      HStack(spacing: 0){
        Spacer()
        if(apiHandler.getIsCarPlugged()){
          Image(systemName: "bolt.fill")
            .widgetAccentable(false)
            .foregroundStyle(apiHandler.chargingColour)
            .frame(height: 13)
        }
        Text("\(apiHandler.getBatteryLevel())")
          .widgetAccentable(false)
          .foregroundStyle(apiHandler.chargingColour(unplugged: Color("noir")))
          .fontWeight(.bold)
          .font(.system(size: 13))
        Text("% | ")
          .widgetAccentable(false)
          .foregroundColor(apiHandler.chargingColour(unplugged: .gray))
          .font(.system(size: 13))
        if(apiHandler.getIsCarCharging()){
          HStack(spacing: 15){
            HStack(spacing: 3) {
              Image(systemName: "hourglass")
                .frame(height: 13)
              Text(apiHandler.chargingTimeText)
                .widgetAccentable(false)
                .font(.system(size: 13))
            }
          }
        }else{
          Text(" \(apiHandler.getBatteryRange(appPreferences: appPreferences)) \(getUnitsText(useMiles: appPreferences?.displayMiles ?? false))")
            .widgetAccentable()
            .foregroundColor(.gray)
            .font(.system(size: 13))
          
        }
        Spacer()
      }
      Spacer()
      ZStack{
        HStack{
          VStack(alignment: .center, spacing: 0) {
            CarImageView(image: image)

          }
          
          Spacer()
        }
        VStack{
          Spacer()
          HStack(spacing: 0){
            Spacer()
            LastRefreshLabel(lastRefreshDate: apiHandler.getLastRefreshDate(), font: .system(size: 10))
          }
        }
      }
      .padding(.top, -10)
      
    }
    .padding()
  }
  
}


#Preview(as: .systemSmall) {
  KeleciOSWidget()
} timeline: {
  SimpleEntry.previewStates()
}
