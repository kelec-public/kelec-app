//
//  MediumAlt1.swift
//  KeleciOSWidgetExtension
//
//  Created by Kelyan PEGEOT SELME on 16/07/2025.
//

import SwiftUI
import WidgetKit
import renaultApi

struct MediumCarWidgetAltView: View {
  var apiHandler: ApiHandler
  var carName: String
  var image: String
  var appPreferences: AppPreferences?
  var body: some View {
    VStack {
      HStack {
        Text("\(carName)")
          .widgetAccentable()
          .font(.title3)
          .fontWeight(.bold)
        Spacer()
        if(apiHandler.getIsCarPlugged()){
          Image(systemName: "clock.badge.checkmark")
            .foregroundColor(apiHandler.chargingColour)
          Text(apiHandler.chargingTimeText)
            .foregroundColor(apiHandler.chargingColour)
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
              .foregroundColor(apiHandler.chargingColour(unplugged: Color.noir))
              .widgetAccentable(true)
            HStack(spacing: 0){
            Text("\(apiHandler.getBatteryLevel())")
              .fontWeight(.bold)
              .font(.title3)
              .foregroundColor(apiHandler.chargingColour(unplugged: Color.noir))
              .widgetAccentable()
            Text("%")
              .widgetAccentable()
              .font(.title3)
              .foregroundColor(apiHandler.chargingColour(unplugged: .gray))
            }
            if(apiHandler.getIsCarPlugged() && apiHandler.getIsCarCharging()){
              Image(systemName: apiHandler.getBatteryLevel() == 100 ? "bolt.badge.checkmark.fill" : "bolt.fill")
                .foregroundColor(apiHandler.chargingColour)
            }
            if(apiHandler.getIsCarPlugged() && !apiHandler.getIsCarCharging()){
              Image(systemName: apiHandler.getBatteryLevel() == 100 ? "bolt.badge.checkmark.fill" : "powercord")
                .foregroundColor(apiHandler.chargingColour)
            }
          }
        }
        Spacer()
        CarImageView(image: image)
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
        LastRefreshLabel(lastRefreshDate: apiHandler.getLastRefreshDate())
      }

    }
    .padding()
  }
}

#Preview(as: .systemMedium) {
  KeleciOSWidgetAlternative()
} timeline: {
  SimpleEntry.previewStates()
}
