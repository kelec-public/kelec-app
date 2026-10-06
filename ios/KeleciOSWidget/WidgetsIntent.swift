//
//  WidgetsIntent.swift
//  KeleciOSWidgetExtension
//
//  Created by Kelyan PEGEOT SELME on 01/01/2025.
//

import AppIntents
import WidgetKit

struct ConfigurationAppIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "Select car"
  static var description = IntentDescription("Selects the car to display information for.")
  
  @Parameter(title: "Car")
  var car: CarEntity?
  
  
  init(car: CarEntity) {
      self.car = car
  }
  
  
  init() {
  }
}
