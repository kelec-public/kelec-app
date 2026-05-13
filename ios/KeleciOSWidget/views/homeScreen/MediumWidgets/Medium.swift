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




struct iosWidgetMediumView: View{
  var date:Date
  var carAccount: UserAccount
  var apiHandler: ApiHandler
  var userCar: UserCar
  var image: String
  var value: String
  var appPreferences: AppPreferences?
  var NormalColours: [Color] = [
    Color(red: 151/255, green: 207/255, blue: 1),
    Color(red: 10/255, green: 120/255, blue: 1)
  ]
  var ChargingColours: [Color] = [
    Color(red: 185/255, green: 1, blue: 222/255),
    Color(red: 44/255, green: 212/255, blue: 6/255)
  ]
  var body: some View{
    GeometryReader{ geo in
      VStack(alignment: .leading, spacing: 5) {
        HStack(spacing: 5) {
          Image("\(userCar.getCarMaker())Logo")
            .resizable()
            .scaledToFit()
            .frame(width: userCar.getCarMaker() == "renault" ? 20 : 40)
          
          // car name
          Text("\(value)")
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
              .foregroundColor(getChargingColour(isV2GorV2L: apiHandler.getIsV2GorV2L()))
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
              .foregroundColor(apiHandler.getIsCarPlugged() ? getChargingColour(isV2GorV2L: apiHandler.getIsV2GorV2L()) : .blue)
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
        .widgetAccentable(false)
        HStack{
          VStack(spacing: 10) {
            if(apiHandler.getIsCarPlugged()){
              
              HStack(spacing: 15){
                HStack(spacing: 3) {
                  Image(systemName: "hourglass")
                  Text((!apiHandler.getIsCarCharging() || apiHandler.getBatteryLevel() == 100) ? "--h--" : "\(Int(apiHandler.getChargingRemainingTime()/60))h\(apiHandler.getChargingRemainingTime()%60 <= 9 ? "0" : "")\(apiHandler.getChargingRemainingTime()%60)")
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
  let date = Date() - 60 * 14
  let car = UserCar(email: "email", password: "password", carMaker: "renault")
  let carAlpine = UserCar(email: "email", password: "password", carMaker: "alpine")
  let carDacia = UserCar(email: "email", password: "password", carMaker: "dacia")
  let carAccount = UserAccount(selectedCar: "car", cars: [car])
  let carAccountAlpine = UserAccount(selectedCar: "car", cars: [carAlpine])
  let carAccountDacia = UserAccount(selectedCar: "car", cars: [carDacia])
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
    date: Date() - 60 * 12, account: carAccountDacia, userCar: carDacia, carName: "Dacia Spring",
    image: "megane", appPreferences: nil, apiHandler: renaultApiHandler)
  // plugged and charging
  SimpleEntry(
    date: Date() - 60 * 12, account: carAccountAlpine, userCar: carAlpine, carName: "Alpine A290",
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
