//
//  rectangularView.swift
//  KeleciOSWidgetExtension
//
//  Created by Kelyan Pegeot-Selme on 26/06/2024.
//

import Foundation
import renaultApi
import SwiftUI

struct KelecLockScreenRectangularView:View{
  var apiHandler: ApiHandler
  var value: String
  var appPreferences: AppPreferences?
  var body: some View{
      VStack(alignment: .leading, spacing: 6){
        HStack() {
          Image(systemName: carStatusIcon(isPlugged: apiHandler.getIsCarPlugged(), isCharging: apiHandler.getIsCarCharging()))
            .widgetAccentable()
          Text("\(value)")
            .widgetAccentable()
          
        }
        
        HStack(spacing: 0) {
          Text("\(apiHandler.getBatteryLevel())% ")
            .fontWeight(.bold)
            .widgetAccentable()
          Text(" | \(apiHandler.getBatteryRange(appPreferences: appPreferences)) \(getUnitsText(useMiles: appPreferences?.displayMiles ?? false))")
            .widgetAccentable()
          
        }
        ZStack {
          
          Gauge(value: Double(apiHandler.getBatteryLevel()) , in: 0...100) {
            
          }
          .gaugeStyle(.accessoryLinearCapacity)
          .tint(.accentColor)
          .widgetAccentable()
        }
  }
}
}
