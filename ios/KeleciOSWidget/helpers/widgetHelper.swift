//
//  widgetHelper.swift
//  Kelec
//
//  Created by Kelyan PEGEOT SELME on 11/18/24.
//

import Foundation
import renaultApi
import SwiftUI

func getChargingColour(isV2GorV2L: Bool)->Color {
  return isV2GorV2L ? .orange : .green
}

// remaining charging time as "2h05"
func formatChargingTime(minutes: Int) -> String {
  return "\(minutes/60)h\(minutes%60 <= 9 ? "0" : "")\(minutes%60)"
}
