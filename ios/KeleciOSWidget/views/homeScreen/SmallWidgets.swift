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


struct iosWidgetEntryViewSmall: View{
  var date:Date
  var carAccount: UserAccount
  var apiHandler: ApiHandler
  var userCar: UserCar
  var image: String
  var value: String
  var appPreferences: AppPreferences?
  var body: some View{
    if #available(iOS 17, *){
      ZStack{
        iosWidgetSmallView(date: date, carAccount: carAccount, apiHandler: apiHandler, userCar: userCar, image: image, value: value, appPreferences: appPreferences)
          .containerBackground(for: .widget) {
            Color("blanc")
          }
      }
    }else{
      ZStack{
        iosWidgetSmallView(date: date, carAccount: carAccount,  apiHandler: apiHandler, userCar: userCar, image: image, value: value, appPreferences: appPreferences)
      }
    }
  }
}

struct iosWidgetSmallView: View{
  var date:Date
  var carAccount: UserAccount
  var apiHandler: ApiHandler
  var userCar: UserCar
  var image: String
  var value: String
  var appPreferences: AppPreferences?
  var body: some View{
    VStack(alignment: .leading, spacing: 0){
      HStack{
        Spacer()
        Text("\(value)")
          .widgetAccentable()
          .font(.system(size: 15))
        Spacer()
      }
      
      HStack(spacing: 0){
        Spacer()
        if(apiHandler.getIsCarPlugged()){
          Image(systemName: "bolt.fill")
            .widgetAccentable(false)
            .foregroundStyle(getChargingColour(isV2GorV2L: apiHandler.getIsV2GorV2L()))
            .frame(height: 13)
        }
        Text("\(apiHandler.getBatteryLevel())")
          .widgetAccentable(false)
          .foregroundStyle(apiHandler.getIsCarPlugged() ? getChargingColour(isV2GorV2L: apiHandler.getIsV2GorV2L()) : Color("noir"))
          .fontWeight(.bold)
          .font(.system(size: 13))
        Text("% | ")
          .widgetAccentable(false)
          .foregroundColor(apiHandler.getIsCarPlugged() ? getChargingColour(isV2GorV2L: apiHandler.getIsV2GorV2L()) : .gray)
          .font(.system(size: 13))
        if(apiHandler.getIsCarCharging()){
          HStack(spacing: 15){
            HStack(spacing: 3) {
              Image(systemName: "hourglass")
                .frame(height: 13)
              Text((!apiHandler.getIsCarCharging() || apiHandler.getBatteryLevel() == 100) ? "--h--" : "\(Int(apiHandler.getChargingRemainingTime()/60))h\(apiHandler.getChargingRemainingTime()%60 <= 9 ? "0" : "")\(apiHandler.getChargingRemainingTime()%60)")
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
            if #available(iOSApplicationExtension 18.0, *) {
              if(Image(base64str: image) != nil && image != ""){
                Image(base64str: image)!
                  .resizable()
                  .widgetAccentedRenderingMode(.fullColor)
                  .scaledToFit()
              }else if(image == "megane"){
                Image("megane")
                  .resizable()
                  .widgetAccentedRenderingMode(.fullColor)
                  .scaledToFit()
              }else{
                Image("renaultLogo")
                  .resizable()
                  .widgetAccentedRenderingMode(.fullColor)
                  .scaledToFit()
              }
            }else{
              if(Image(base64str: image) != nil && image != ""){
                Image(base64str: image)!
                  .resizable()
                  .scaledToFit()
              }else if(image == "megane"){
                Image("megane")
                  .resizable()
                  .scaledToFit()
              }else{
                Image("renaultLogo")
                  .resizable()
                  .scaledToFit()
              }
            }

          }
          
          Spacer()
        }
        VStack{
          Spacer()
          HStack(spacing: 0){
            Spacer()
            if(isBeforeToday(convertTimestamp(date: apiHandler.getLastRefreshDate()))){
              Text("\(convertTimestamp(date: apiHandler.getLastRefreshDate()), style: .date) ")
                .widgetAccentable()
                .font(.system(size: 10))
                .foregroundColor(.gray)
            }
            Text(" \(convertTimestamp(date:apiHandler.getLastRefreshDate()), style: .time)")
              .widgetAccentable()
              .font(.system(size: 10))
              .foregroundColor(.gray)
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
  let date = Date() - 60 * 14
  let car = UserCar(email: "email", password: "password", carMaker: "renault")
  let carAccount = UserAccount(selectedCar: "car", cars: [car])
  let renaultBatteryStatus = RenaultBatteryStatus(
    timestamp: "2025-07-15T08:40:54Z", batteryLevel: 69, batteryAutonomy: 216, batteryCapacity: nil,
    batteryAvailableEnergy: nil, plugStatus: 0, chargingStatus: 0, chargingRemainingTime: 150,
    chargingInstantaneousPower: nil)
  var renaultApiHandler = RenaultApiHandler(batteryStatus: renaultBatteryStatus)

  let cockpitStatus = RenaultCockpitStatus(totalMilage: 45801)
  let result: Void = renaultApiHandler.setCockpitStatus(cockpitStatus: cockpitStatus)
  
  
  let renaultBatteryStatus2 = RenaultBatteryStatus(
    timestamp: "2025-07-15T08:40:54Z", batteryLevel: 69, batteryAutonomy: 216, batteryCapacity: nil,
    batteryAvailableEnergy: nil, plugStatus: 1, chargingStatus: 1, chargingRemainingTime: 150,
    chargingInstantaneousPower: nil)
  var renaultApiHandler2 = RenaultApiHandler(batteryStatus: renaultBatteryStatus2)
  let result2: Void = renaultApiHandler2.setCockpitStatus(cockpitStatus: cockpitStatus)
  
  let renaultBatteryStatus3 = RenaultBatteryStatus(
    timestamp: "2025-07-15T08:40:54Z", batteryLevel: 69, batteryAutonomy: 216, batteryCapacity: nil,
    batteryAvailableEnergy: nil, plugStatus: 1, chargingStatus: -1, chargingRemainingTime: 150,
    chargingInstantaneousPower: nil)
  var renaultApiHandler3 = RenaultApiHandler(batteryStatus: renaultBatteryStatus3)
  let result3: Void = renaultApiHandler3.setCockpitStatus(cockpitStatus: cockpitStatus)
  
  let renaultBatteryStatus4 = RenaultBatteryStatus(
    timestamp: "2025-07-15T08:40:54Z", batteryLevel: 100, batteryAutonomy: 216, batteryCapacity: nil,
    batteryAvailableEnergy: nil, plugStatus: 1, chargingStatus: 0.4, chargingRemainingTime: 150,
    chargingInstantaneousPower: nil)
  var renaultApiHandler4 = RenaultApiHandler(batteryStatus: renaultBatteryStatus4)
  let result4: Void = renaultApiHandler4.setCockpitStatus(cockpitStatus: cockpitStatus)
  
  let renaultBatteryStatus5 = RenaultBatteryStatus(
    timestamp: "2025-07-15T08:40:54Z", batteryLevel: 100, batteryAutonomy: 216, batteryCapacity: nil,
    batteryAvailableEnergy: nil, plugStatus: 1, chargingStatus: -1.3, chargingRemainingTime: 150,
    chargingInstantaneousPower: nil)
  var renaultApiHandler5 = RenaultApiHandler(batteryStatus: renaultBatteryStatus5)
  let result5: Void = renaultApiHandler5.setCockpitStatus(cockpitStatus: cockpitStatus)

  SimpleEntry(
    date: Date() - 60 * 12, account: carAccount, userCar: car, carName: "Megane E-Tech",
    image: "megane", appPreferences: nil, apiHandler: renaultApiHandler)
  // plugged and charging
  SimpleEntry(
    date: Date() - 60 * 12, account: carAccount, userCar: car, carName: "Megane E-Tech",
    image: "megane", appPreferences: nil, apiHandler: renaultApiHandler2)
  // plugged but not charging
  SimpleEntry(
    date: Date() - 60 * 12, account: carAccount, userCar: car, carName: "Megane E-Tech",
    image: "megane", appPreferences: nil, apiHandler: renaultApiHandler3)
  // charged 100%
  SimpleEntry(
    date: Date() - 60 * 12, account: carAccount, userCar: car, carName: "Megane E-Tech",
    image: "megane", appPreferences: nil, apiHandler: renaultApiHandler4)
  // v2g
  SimpleEntry(
    date: Date() - 60 * 12, account: carAccount, userCar: car, carName: "Megane E-Tech",
    image: "megane", appPreferences: nil, apiHandler: renaultApiHandler5)
  
}
