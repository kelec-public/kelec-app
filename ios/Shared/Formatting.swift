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

func getChargingColour(isV2GorV2L: Bool)->Color {
  return isV2GorV2L ? .orange : .green
}

// localized text for a key only known at runtime (Tempo colours, alert texts)
func localized(_ key: String) -> String {
  return NSLocalizedString(key, comment: "")
}
