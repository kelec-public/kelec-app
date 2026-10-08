//
//  MediumAlt1.swift
//  KeleciOSWidgetExtension
//
//  Created by Kelyan Pegeot-Selme on 18/03/2024.
//

import Foundation
import WidgetKit
import renaultApi
import SwiftUI




struct MediumCarWidgetView: View{
  var apiHandler: ApiHandler
  var userCar: UserCar
  var carName: String
  var image: String
  var appPreferences: AppPreferences?
  var body: some View{
    GeometryReader{ geo in
      VStack(alignment: .leading, spacing: 5) {
        HStack(spacing: 5) {
          Image("\(userCar.getCarMaker())Logo")
            .resizable()
            .scaledToFit()
            .frame(width: userCar.maker == .RENAULT ? 20 : 40)
          
          // car name
          Text("\(carName)")
            .widgetAccentable()
          
          
          Spacer()
          HStack(spacing: 0){
            if(!apiHandler.getIsCarLocked()){
              Image(systemName: "lock.open")
                .widgetAccentable()
                .padding(.trailing, 5)
            }
              
            
              
            Text("\(apiHandler.getBatteryLevel())")
              .widgetAccentable()
              .fontWeight(.bold)
              .font(.title)
            Text("%")
              .widgetAccentable()
              .font(.title)
              .foregroundColor(.gray)
          }
          
          
                              
          //
        }
        ZStack {
          HStack{
            Rectangle()
              .foregroundColor(Color("gris"))
              .frame(width: geo.size.width, height: 15)
              .cornerRadius(7)
              .widgetAccentable(false)
            Spacer()
          }
          HStack(spacing: 0) {
            Rectangle()
              .widgetAccentable()
              .foregroundColor(apiHandler.chargingColour)
              .frame(width: CGFloat(
                (apiHandler.getChargeLimit()*Int(geo.size.width)))/100, height: 15
              )
              .cornerRadius(7)
              .opacity(apiHandler.getIsCarPlugged() ? 0.3 : 0)
            Spacer()
          }
          HStack(spacing: 0) {
            Rectangle()
              .widgetAccentable()
              .foregroundColor(apiHandler.chargingColour(unplugged: .blue))
              .frame(width: CGFloat((apiHandler.getBatteryLevel()*Int(geo.size.width)))/100, height: 15)
              .cornerRadius(7)
            Spacer()
          }
          HStack{
            // only for hyundai and gen1 zoé
            if(apiHandler.getChargeInstantaneousPowerInWatts()  > 500){
              Text("\(apiHandler.getChargeInstantaneousPowerInWatts()/1000, specifier: floor(apiHandler.getChargeInstantaneousPowerInWatts()/1000) == apiHandler.getChargeInstantaneousPowerInWatts()/1000 ? "%.0f" :"%.1f") kW")
                .font(.caption)
                .foregroundColor(.black)
                .opacity(apiHandler.getIsCarPlugged() ? apiHandler.getChargingRemainingTime() == 0 ? 0 : 1 : 0)
            }
          }
        }
        HStack(spacing: 0){
          Text("\(apiHandler.getChargeText())")
          Text("\(apiHandler.getBatteryRange(appPreferences: appPreferences)) \(getUnitsText(useMiles: appPreferences?.displayMiles ?? false))")
            .foregroundColor(.gray)
          Spacer()
          LastRefreshLabel(lastRefreshDate: apiHandler.getLastRefreshDate())
        }
        .widgetAccentable(false)
        HStack{
          VStack(spacing: 10) {
            if(apiHandler.getIsCarPlugged()){
              
              HStack(spacing: 15){
                HStack(spacing: 3) {
                  Image(systemName: "hourglass")
                  Text(apiHandler.chargingTimeText)
                }
                HStack(spacing: 3) {
                  Image(systemName: "bolt.batteryblock.fill")
                  Text(Calendar.current.date(byAdding: .minute, value: apiHandler.getChargingRemainingTime(), to: convertTimestamp(date: apiHandler.getLastRefreshDate()))!,style: .time)
                }.foregroundColor(.gray)
                  .opacity(apiHandler.getIsCarCharging() ? 1 : 0)
              }
            }
          }
          .widgetAccentable(false)
          Spacer()
          VStack(alignment: .trailing, spacing: 0) {
            CarImageView(image: image)

          }  .padding(.bottom, -10)
        }
      }
    }
    .padding()
  }
}

#Preview(as: .systemMedium) {
  KeleciOSWidget()
} timeline: {
  for entry in SimpleEntry.previewStates(cars: [
    (UserCar(email: "", password: "", carMaker: "dacia"), "Dacia Spring"),
    (UserCar(email: "", password: "", carMaker: "alpine"), "Alpine A290"),
  ]) {
    entry
  }
}
