//
//  BatteryCardView.swift
//  KelecWatchOs Watch App
//
//  Created by Kelyan Pegeot-Selme on 28/06/2024.
//

import Foundation
import SwiftUI
import WidgetKit
import renaultApi


struct BatteryCardView: View{
  @Environment(\.isLuminanceReduced) var isLuminanceReduced
  var refreshApi: () -> Void
  var imageUrl: URL
  var apiHandler: ApiHandler
  var appPreferences: AppPreferences?
  var carMaker: String
  var account: UserAccount
  var carAccount: UserCar
  @State var maxChargeOffset:CGFloat = 0
  
  @State private var shouldShowHVACAlert: Bool = false
  @State private var shouldShowHVACConfirm: Bool = false
  @State private var hvacAlertTitle: String = ""
  @State private var hvacAlertMessage: String = ""
  @State private var isLightLoadingHVAC: Bool = false // true when HVAC Start is fetching
  
  @State private var shouldShowMapModal: Bool = false
  
  var body: some View{
    GeometryReader { geo in
      VStack(alignment: .leading, spacing: 3) {
        ZStack {
          HStack {
            Spacer()
            AsyncImage(url: imageUrl){ phase in
              switch phase {
              case .empty:
                ProgressView()
              case .success(let image):
                image
                  .resizable()
                  .scaledToFit()
                  .padding(5)
              case .failure(_):
                Image("\(carMaker)Logo")
                  .resizable()
                  .scaledToFit()
                  .padding(5)
              @unknown default:
                Image("\(carMaker)Logo")
                  .resizable()
                  .scaledToFit()
                  .padding(5)
              }
            }
            
            
            
          }
          HStack(spacing: 0){
            Text("\(apiHandler.getBatteryLevel())")
              .fontWeight(.bold)
              .font(.title2)
              .privacySensitive()
            Text("%")
              .font(.title2)
              .foregroundColor(.gray)
            Spacer()
          }
          
        }
        
        if(geo.size.height > 140){
          ZStack {
            HStack(spacing: 0) {
              Rectangle()
                .foregroundColor(isLuminanceReduced ? .gray : Color("gris"))
                .frame(width: geo.size.width, height: 15)
                .cornerRadius(7)
              Spacer()
            }
            HStack(spacing: 0) {
              Rectangle()
                .foregroundColor(isLuminanceReduced ? .gray : getChargingColour(isV2GorV2L: apiHandler.getIsV2GorV2L()))
                .frame(width: CGFloat((apiHandler.getChargeLimit()*Int(geo.size.width)))/100, height: 15)
                .cornerRadius(7)
                .opacity(apiHandler.getIsCarCharging() ? 0.3 : 0)
              Spacer()
            }
            
            HStack(spacing: 0){
              Rectangle()
                .foregroundColor(isLuminanceReduced ? .gray : .blue)
                .frame(width: geo.size.width, height: 15)
                .cornerRadius(7)
                .mask(
                  HStack(spacing: 0){
                    Rectangle().frame(width: self.maxChargeOffset, height: 15)
                    Spacer()
                    
                  })
              
              Spacer()
              
            }
            HStack(spacing: 0) {
              Rectangle()
                .foregroundColor(isLuminanceReduced ? .gray : ( apiHandler.getIsCarPlugged() ? getChargingColour(isV2GorV2L: apiHandler.getIsV2GorV2L()) : .blue))
              
                .frame(width: CGFloat((apiHandler.getBatteryLevel()*Int(geo.size.width)))/100, height: 15)
                .cornerRadius(7)
              Spacer()
            }
            
          }
        }
        
        HStack{
          Text("\(apiHandler.getChargeText().dropLast(2))")
            .font(.body)
          Text("\(apiHandler.getBatteryRange(appPreferences: appPreferences)) \(getUnitsText(useMiles: appPreferences?.displayMiles ?? false))")
            .foregroundColor(.gray)
            .font(.body)
            .privacySensitive()
          Spacer()
        }
        
        HStack(spacing: 5){
          HStack(spacing: 3) {
            Image(systemName: "hourglass")
            Text(!apiHandler.getIsCarCharging() ? "--h--" : "\(Int(apiHandler.getChargingRemainingTime()/60))h\(apiHandler.getChargingRemainingTime()%60  <= 9 ? "0" : "")\(apiHandler.getChargingRemainingTime()%60)")
          }
          if(apiHandler.getIsCarCharging()){
            HStack(spacing: 3) {
              
              Image(systemName: "bolt.batteryblock.fill")
              Text(Calendar.current.date(byAdding: .minute, value: apiHandler.getChargingRemainingTime(), to: convertTimestamp(date: apiHandler.getLastRefreshDate()))!,style: .time)
            }.foregroundColor(.gray)
              .opacity(apiHandler.getChargingRemainingTime() <= 0 ? 0 : 1)
          }
          
        }
        .opacity(apiHandler.getIsCarPlugged() ? 1 : 0)
        Spacer()
        // bottom buttons
        HStack{
          
          // hvac button
          Button{
            shouldShowHVACConfirm = true
          }label: {
            if(self.isLightLoadingHVAC){
              ProgressView()
            }else{
              HStack{
                Image(systemName: "heat.waves.and.fan")
              }
            }
            
          }
          .disabled(self.isLightLoadingHVAC)
          
          
          Spacer()
          
          // refresh button
          Button{
            // trigger refresh
            refreshApi()
          }label: {
            HStack{
              Image(systemName: "arrow.clockwise")
            }
          }
          
          // map button
          Button{
            // open mapview
            shouldShowMapModal = true
          }label: {
            HStack{
              Image(systemName: "map")
            }
          }
          
        }
        
      }
    }
    .padding(.horizontal,10)
    .alert(hvacAlertTitle, isPresented: $shouldShowHVACAlert) {
      Button("OK") {
        // Handle retry
      }
    } message: {
      Text(hvacAlertMessage)
    }
    .alert(isPresented: $shouldShowHVACConfirm){
      Alert(
        title: Text(LocalizedStringKey("launchPreHeat")),
        message: Text(LocalizedStringKey("areYouSureYouWantToLaunchPreheating")),
        primaryButton: .default(
          Text(LocalizedStringKey("confirm")),
          action: confirmLaunchHVAC
        ),
        secondaryButton: .cancel(
          Text(LocalizedStringKey("cancel"))
        )
      )
    }
    
    .sheet(isPresented: $shouldShowMapModal){
      MapView(userCar: carAccount)
        .edgesIgnoringSafeArea(.all)
    }
    
    
    
  }
  
  func confirmLaunchHVAC(){
    Task{
      self.shouldShowHVACConfirm = false
      self.isLightLoadingHVAC = true
      // launch HVAC
      let hasLaunchedHVAC = await launchHVAC(carAccount: self.carAccount)
      if(hasLaunchedHVAC){
        self.hvacAlertTitle = LocalizedStringKey("informationSent").stringValue()
        self.hvacAlertMessage = LocalizedStringKey("preHeatLaunched").stringValue()
      }else{
        self.hvacAlertTitle = LocalizedStringKey("error").stringValue()
        self.hvacAlertMessage = LocalizedStringKey("commandSendError").stringValue()
      }
      
      // open modal
      self.shouldShowHVACAlert = true
      self.isLightLoadingHVAC = false
    }
  }
  
  
  func launchHVAC(carAccount: UserCar) async -> Bool {
    let vin = carAccount.car?.vin ?? "VIN"
    let client = getCarMakerApiClient(usercar: carAccount)
    
    do {
      let hvacLaunchStatus = try await client.launchHvac(vin: vin)
      return hvacLaunchStatus == true
    } catch {
      print("Failed to launch HVAC: \(error)")
      return false
    }
  }
  
}

//struct BatteryCardView_Previews: PreviewProvider {
//  static var previews: some View {
//    BatteryCardView(refreshApi: testRefesh, imageUrl: URL(string: "")!, zecar: AppAttributes(timestamp: "", batteryLevel: 30, batteryAutonomy: 30, batteryCapacity: 03, batteryAvailableEnergy: 03, plugStatus: 0, chargingStatus: 0.2, chargingRemainingTime: 10, chargingInstantaneousPower: 1000.0, batteryTemperature: 0, isLocked: true, chargeLimit: 0), carMaker: "hyundai")
//  }
//
//
//}

func testRefesh () -> Void{
  
}

extension Double{
  func rounded(toPlaces places:Int) -> Double{
    let divisor = pow(10.0, Double(places))
    return (self * divisor).rounded() / divisor
  }
}
