//
//  inlineView.swift
//  KeleciOSWidgetExtension
//
//  Created by Kelyan Pegeot-Selme on 26/06/2024.
//

import Foundation
import WidgetKit
import SwiftUI
import renaultApi

struct KelecLockScreenInlineView:View{
  var apiHandler: ApiHandler
  var body: some View{
    HStack{
      Image(systemName: carStatusIcon(isPlugged: apiHandler.getIsCarPlugged(), isCharging: apiHandler.getIsCarCharging()))
      Text("\(apiHandler.getBatteryLevel())%")
    }
  }
}
