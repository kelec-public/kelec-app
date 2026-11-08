//
//  Tempo.swift
//  KeleciOSWidgetExtension
//
//  RTE Tempo data and display helpers shared by the Tempo widgets.
//

import Foundation
import SwiftUI
import renaultApi

enum TempoService {
  // fetches tempo data from RTE and caches it, falls back to the cache when the fetch fails
  // same log messages as TempoLoader (Android)
  static func fetch() async -> tempoFinalReturn? {
    do {
      let tempo = try await getRteClient().getTempo()
      save(tempo: tempo)
      writeWidgetLog(message: "Tempo data fetched")
      return tempo
    } catch {
      let cached = loadCached()
      writeWidgetLog(message: "Loading cached Tempo data: \(error)" + (cached == nil ? " (no cached data)" : ""))
      return cached
    }
  }

  @discardableResult
  static func save(tempo: tempoFinalReturn) -> Bool {
    guard let encoded = try? JSONEncoder().encode(tempo) else {
      return false
    }
    UserDefaults.standard.set(encoded, forKey: StorageKey.tempo)
    return true
  }

  static func loadCached() -> tempoFinalReturn? {
    guard let data = UserDefaults.standard.data(forKey: StorageKey.tempo) else {
      return nil
    }
    return try? JSONDecoder().decode(tempoFinalReturn.self, from: data)
  }
}

enum TempoStyle {
  static func backgroundColour(_ colour: String) -> Color {
    switch colour {
    case "BLUE":
      return Color.blue
    case "WHITE":
      return Color.white
    case "RED":
      return Color.red
    default:
      return Color.pink
    }
  }

  static func foregroundColour(_ colour: String) -> Color {
    colour == "WHITE" ? Color.black : Color.white
  }

  // "dd/MM"
  static func formatDate(_ date: Date) -> String {
    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "dd/MM"
    return dateFormatter.string(from: date)
  }

  static func hpPrice(_ colour: String) -> Float {
    getRteClient().getHPPrice(colour: colour)
  }

  static func hcPrice(_ colour: String) -> Float {
    getRteClient().getHCPrice(colour: colour)
  }
}
