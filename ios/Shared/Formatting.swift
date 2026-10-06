//
//  Formatting.swift
//  Kelec
//

import Foundation
import SwiftUI

func convertTimestamp(date: String) -> Date{
  let formatter = DateFormatter()
  formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZZZZZZ"
  return(formatter.date(from: date) ?? Date.now)
}

func isBeforeToday(_ date: Date) -> Bool{
  let calendar = Calendar.current
  let today = calendar.startOfDay(for: Date())
  let otherDate = calendar.startOfDay(for: date)
  if today == otherDate {
    return false
  }
  
  return otherDate < today
}

// remaining charging time as "2h05"
func formatChargingTime(minutes: Int) -> String {
  return "\(minutes/60)h\(minutes%60 <= 9 ? "0" : "")\(minutes%60)"
}

// number rounded and grouped by thousands with spaces, as "45 801"
func formatNumber(_ number: Double) -> String {
  let formatter = NumberFormatter()
  formatter.numberStyle = .decimal
  formatter.maximumFractionDigits = 0
  formatter.roundingMode = .halfUp
  formatter.usesGroupingSeparator = true
  formatter.groupingSeparator = " "
  return formatter.string(from: NSNumber(value: number)) ?? String(Int(number.rounded()))
}

// SF Symbol of the battery for a level in percent
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

func getChargingColour(isV2GorV2L: Bool)->Color {
  return isV2GorV2L ? .orange : .green
}

// localized text for a key only known at runtime (Tempo colours, alert texts)
func localized(_ key: String) -> String {
  return NSLocalizedString(key, comment: "")
}
