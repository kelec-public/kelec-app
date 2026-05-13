//
//  MediumAlt1.swift
//  KeleciOSWidgetExtension
//
//  Created by Kelyan PEGEOT SELME on 16/07/2025.
//

import SwiftUI
import WidgetKit
import renaultApi

struct GetImageView: View {
  var image: String
  var body: some View {
    if #available(iOSApplicationExtension 18.0, *) {
      if Image(base64str: image) != nil && image != "" {
        Image(base64str: image)!
          .resizable()
          .widgetAccentedRenderingMode(.fullColor)
          .scaledToFit()
      } else if image == "megane" {
        Image("megane")
          .resizable()
          .widgetAccentedRenderingMode(.fullColor)
          .scaledToFit()
      } else {
        Image("renaultLogo")
          .resizable()
          .widgetAccentedRenderingMode(.fullColor)
          .scaledToFit()
      }
    } else {
      if Image(base64str: image) != nil && image != "" {
        Image(base64str: image)!
          .resizable()
          .scaledToFit()
      } else if image == "megane" {
        Image("megane")
          .resizable()
          .scaledToFit()
      } else {
        Image("renaultLogo")
          .resizable()
          .scaledToFit()
      }
    }
  }
}

struct iosAlt1WidgetMediumView: View {
  var date: Date
  var carAccount: UserAccount
  var apiHandler: ApiHandler
  var userCar: UserCar
  var image: String
  var value: String
  var appPreferences: AppPreferences?
  var body: some View {
    VStack {
      HStack {
        Text("\(value)")
          .widgetAccentable()
          .font(.title3)
          .fontWeight(.bold)
        Spacer()
        if(apiHandler.getIsCarPlugged()){
          Image(systemName: "clock.badge.checkmark")
            .foregroundColor(getChargingColour(isV2GorV2L: apiHandler.getIsV2GorV2L()))
          Text((!apiHandler.getIsCarCharging() || apiHandler.getBatteryLevel() == 100) ? "--h--" : "\(Int(apiHandler.getChargingRemainingTime()/60))h\(apiHandler.getChargingRemainingTime()%60 <= 9 ? "0" : "")\(apiHandler.getChargingRemainingTime()%60)")
            .foregroundColor(getChargingColour(isV2GorV2L: apiHandler.getIsV2GorV2L()))
            .widgetAccentable()
        }
      }
      HStack {
        VStack(alignment: .leading) {
          HStack(spacing: 5) {
            Text("\(apiHandler.getBatteryRange(appPreferences: appPreferences))")
              .widgetAccentable()
              .fontWeight(.bold)
              .font(.title2)
            Text("\(getUnitsText(useMiles: appPreferences?.displayMiles ?? false))")
              .widgetAccentable()
              .font(.title2)
              .foregroundColor(.gray)
          }

          HStack{
            Image(systemName: getBatteryIcon(batteryLevel: apiHandler.getBatteryLevel()))
              .foregroundColor(apiHandler.getIsCarPlugged() ? getChargingColour(isV2GorV2L: apiHandler.getIsV2GorV2L()) : Color.noir)
              .widgetAccentable(true)
            HStack(spacing: 0){
            Text("\(apiHandler.getBatteryLevel())")
              .fontWeight(.bold)
              .font(.title3)
              .foregroundColor(apiHandler.getIsCarPlugged() ? getChargingColour(isV2GorV2L: apiHandler.getIsV2GorV2L()) : Color.noir)
              .widgetAccentable()
            Text("%")
              .widgetAccentable()
              .font(.title3)
              .foregroundColor(apiHandler.getIsCarPlugged() ? getChargingColour(isV2GorV2L: apiHandler.getIsV2GorV2L()) : .gray)
            }
            if(apiHandler.getIsCarPlugged() && apiHandler.getIsCarCharging()){
              Image(systemName: apiHandler.getBatteryLevel() == 100 ? "bolt.badge.checkmark.fill" : "bolt.fill")
                .foregroundColor(getChargingColour(isV2GorV2L: apiHandler.getIsV2GorV2L()))
            }
            if(apiHandler.getIsCarPlugged() && !apiHandler.getIsCarCharging()){
              Image(systemName: apiHandler.getBatteryLevel() == 100 ? "bolt.badge.checkmark.fill" : "powercord")
                .foregroundColor(getChargingColour(isV2GorV2L: apiHandler.getIsV2GorV2L()))
            }
          }
        }
        Spacer()
        GetImageView(image: image)
          .padding(-5)

      }
      HStack {
        Text(
          "\(formatNumber(apiHandler.getMilage(appPreferences: appPreferences))) \(getUnitsText(useMiles: appPreferences?.displayMiles ?? false))"
        )
        .widgetAccentable()
        .font(.caption)
        .foregroundColor(.gray)
        Spacer()
        HStack(spacing: 0){
          if(isBeforeToday(convertTimestamp(date: apiHandler.getLastRefreshDate()))){
            Text("\(convertTimestamp(date: apiHandler.getLastRefreshDate()), style: .date) ")
              .widgetAccentable(true)
              .font(.caption)
              .foregroundColor(.gray)
          }
          Text(" \(convertTimestamp(date: apiHandler.getLastRefreshDate()), style: .time)")
            .widgetAccentable(true)
            .font(.caption)
            .foregroundColor(.gray)
        }
      }

    }
    .padding()
  }

  func formatNumber(_ number: Double) -> String {
    // Round the number
    let roundedNumber = Int(round(number))
    let str = String(roundedNumber)
    var newStr = ""

    for (i, char) in str.reversed().enumerated() {
      if i != 0 && i % 3 == 0 {
        newStr = " " + newStr
      }
      newStr = String(char) + newStr
    }
    
    return newStr
  }
  
  func getBatteryIcon(batteryLevel: Int) -> String {
    switch batteryLevel {
    case 0...20:
      return "battery.0percent"
    case 21...40:
      return "battery.25percent"
    case 41...60:
      return "battery.50percent"
    case 61...80:
      return "battery.75percent"
    default:
      return "battery.100percent"
    }
  }
  
}

#Preview(as: .systemMedium) {
  KeleciOSWidget2()
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
