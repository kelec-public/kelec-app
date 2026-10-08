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
  var launchHVAC: (_ temperature: Int) async -> Bool
  // target temperature of the pre-heating, saved for this car on each change
  @Binding var temperature: Int
  var imageUrl: URL?
  var apiHandler: ApiHandler
  var appPreferences: AppPreferences?
  var carMaker: String
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
            Text(!apiHandler.getIsCarCharging() ? "--h--" : formatChargingTime(minutes: apiHandler.getChargingRemainingTime()))
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
    // an alert cannot hold the temperature picker: confirmation in a sheet
    .sheet(isPresented: $shouldShowHVACConfirm){
      HVACConfirmView(temperature: $temperature, onConfirm: confirmLaunchHVAC)
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
      let hasLaunchedHVAC = await launchHVAC(temperature)
      if(hasLaunchedHVAC){
        self.hvacAlertTitle = localized("informationSent")
        self.hvacAlertMessage = localized("preHeatLaunched")
      }else{
        self.hvacAlertTitle = localized("error")
        self.hvacAlertMessage = localized("commandSendError")
      }
      
      // open modal
      self.shouldShowHVACAlert = true
      self.isLightLoadingHVAC = false
    }
  }
  
  
  
}

// pre-heating confirmation with the target temperature (- / + like the RN app, or the Digital Crown)
private struct HVACConfirmView: View {
  @Binding var temperature: Int
  var onConfirm: () -> Void
  @Environment(\.dismiss) private var dismiss

  var body: some View {
    ScrollView {
      VStack(spacing: 8) {
        Text(LocalizedStringKey("launchPreHeat"))
          .font(.headline)
          .multilineTextAlignment(.center)
        Text(LocalizedStringKey("areYouSureYouWantToLaunchPreheating"))
          .font(.footnote)
          .foregroundColor(.gray)
          .multilineTextAlignment(.center)

        Stepper(value: $temperature, in: HvacTemperature.min...HvacTemperature.max) {
          Text(HvacTemperature.label(temperature))
            .font(.title2)
            .fontWeight(.bold)
            .foregroundColor(temperatureColour)
            .monospacedDigit()
        }
        .focusable()
        .digitalCrownRotation(
          crownTemperature,
          from: Double(HvacTemperature.min),
          through: Double(HvacTemperature.max),
          by: 1,
          sensitivity: .low,
          isContinuous: false,
          isHapticFeedbackEnabled: true
        )

        Button(LocalizedStringKey("confirm"), action: onConfirm)
          .buttonStyle(.borderedProminent)
        Button(LocalizedStringKey("cancel"), role: .cancel) {
          dismiss()
        }
      }
    }
  }

  // LOW in blue, HIGH in red, like the RN app
  private var temperatureColour: Color {
    switch temperature {
    case HvacTemperature.min: return .blue
    case HvacTemperature.max: return .red
    default: return .primary
    }
  }

  private var crownTemperature: Binding<Double> {
    Binding(
      get: { Double(temperature) },
      set: { temperature = Int($0.rounded()) }
    )
  }
}
