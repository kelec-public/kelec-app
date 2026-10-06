//
//  circularView.swift
//  KeleciOSWidgetExtension
//
//  Created by Kelyan Pegeot-Selme on 26/06/2024.
//

import Foundation
import SwiftUI
import WidgetKit
import renaultApi

struct KelecLockScreenCircularView:View{
  var apiHandler: ApiHandler?
  var style: WidgetStyle
  var body: some View{
    Gauge(value: Double(apiHandler?.getBatteryLevel() ?? 0) , in: 0...100) {
      Image(systemName: apiHandler?.getIsCarCharging() ?? false  ? (apiHandler?.getIsCarPlugged() ?? false ? "bolt.car.fill" : "bolt") : "car.fill")
    }currentValueLabel: {
      if(style == .alternative){
        Image(systemName: apiHandler?.getIsCarCharging() ?? false  ? (apiHandler?.getIsCarPlugged() ?? false ? "bolt.car.fill" : "bolt") : "car.fill")
          .resizable()
          .scaledToFit()
          .frame(width: 25)
      }else{
        Text("\(apiHandler?.getBatteryLevel() ?? 0)")
      }
      
    }
    
    .if(isCapacityStyle){ view in
      view.gaugeStyle(.accessoryCircularCapacity)
    }
    .if(!isCapacityStyle){ view in
      view.gaugeStyle(.accessoryCircular)}
    .tint(.accentColor)
    .widgetAccentable()
  }
  
  private var isCapacityStyle: Bool {
    return self.style == .alternative
  }
  
}

extension View {
    /// Applies the given transform if the given condition evaluates to `true`.
    /// - Parameters:
    ///   - condition: The condition to evaluate.
    ///   - transform: The transform to apply to the source `View`.
    /// - Returns: Either the original `View` or the modified `View` if the condition is `true`.
    @ViewBuilder func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}
