//
//  LaunchHVACControl.swift
//  KeleciOSWidget
//
//  Control Center / lock screen / Action button control (iOS 18) that launches the pre-heating.
//  A control cannot ask anything when tapped: the car and the temperature are chosen when the control is added.
//  Also the pre-heating button of the medium home screen widgets (LaunchHVACWidgetIntent) and its feedback.
//

import AppIntents
import SwiftUI
import WidgetKit

@available(iOS 18.0, *)
struct LaunchHVACControl: ControlWidget {
  static let kind = "LaunchHVACControl"

  var body: some ControlWidgetConfiguration {
    AppIntentControlConfiguration(kind: Self.kind, intent: LaunchHVACControlConfiguration.self) { configuration in
      ControlWidgetButton(action: LaunchHVACControlIntent(car: configuration.car, temperature: configuration.temperature)) {
        Label {
          Text(configuration.car?.name ?? localized("launchPreHeat"))
          Text("\(configuration.temperature) °C")
        } icon: {
          Image(systemName: "heat.waves.and.fan")
        }
      } actionLabel: { isActive in
        // shown while the command is sent
        if isActive {
          Label("launchPreHeat", systemImage: "heat.waves.and.fan")
        }
      }
    }
    .displayName("launchPreHeat")
    .description("launchPreHeatControlDescription")
    // the car must be chosen when the control is added
    .promptsForUserConfiguration()
  }
}

// settings of the control, chosen when it is added (long press → edit to change them)
@available(iOS 18.0, *)
struct LaunchHVACControlConfiguration: ControlConfigurationIntent {
  static let title: LocalizedStringResource = "launchPreHeat"

  @Parameter(title: "Car", description: "launchPreHeatCarDescription")
  var car: CarEntity?

  // same range and default as HvacTemperature (AppIntents needs literals)
  @Parameter(
    title: "launchPreHeatTemperature",
    description: "launchPreHeatTemperatureDescription",
    default: 21,
    controlStyle: .stepper,
    inclusiveRange: (17, 27)
  )
  var temperature: Int
}

// action of the control, run in the widget extension; hidden from Shortcuts (LaunchHVACIntent is the Siri one)
struct LaunchHVACControlIntent: AppIntent {
  static let title: LocalizedStringResource = "launchPreHeat"
  static let isDiscoverable = false

  @Parameter(title: "Car")
  var car: CarEntity?

  @Parameter(title: "launchPreHeatTemperature", default: 21)
  var temperature: Int

  init() {}

  init(car: CarEntity?, temperature: Int) {
    self.car = car
    self.temperature = temperature
  }

  func perform() async throws -> some IntentResult {
    let temperature = min(max(temperature, HvacTemperature.min), HvacTemperature.max)
    guard let vin = car?.id,
          let userCar = SharedStore.loadAccount()?.cars.first(where: { $0.car?.vin == vin })
    else {
      writeWidgetLog(message: "HVAC control: car not found")
      throw LaunchHVACControlError.carNotFound
    }
    guard await sendHVACCommand(userCar: userCar, temperature: temperature) else {
      writeWidgetLog(message: "HVAC control: command not sent")
      throw LaunchHVACControlError.commandNotSent
    }
    return .result()
  }
}

enum LaunchHVACControlError: Error, CustomLocalizedStringResourceConvertible {
  case carNotFound
  case commandNotSent

  var localizedStringResource: LocalizedStringResource {
    switch self {
    case .carNotFound: return "widgetNoCarSelected"
    case .commandNotSent: return "commandSendError"
    }
  }
}

// action of the pre-heating button of the medium widgets: the car of the widget, at 21 °C.
// While it runs, the button is dimmed (invalidatableContent); WidgetKit then reloads the widget,
// which shows the saved result (WidgetHvacFeedback) for WidgetHvacFeedback.displayDuration.
struct LaunchHVACWidgetIntent: AppIntent {
  static let title: LocalizedStringResource = "launchPreHeat"
  static let isDiscoverable = false

  @Parameter(title: "Car")
  var vin: String

  init() {}

  init(vin: String) {
    self.vin = vin
  }

  func perform() async throws -> some IntentResult {
    var sent = false
    if let userCar = SharedStore.loadAccount()?.cars.first(where: { $0.car?.vin == vin }) {
      sent = await sendHVACCommand(userCar: userCar, temperature: WidgetHvacFeedback.temperature)
    } else {
      writeWidgetLog(message: "HVAC widget: car not found")
    }
    writeWidgetLog(message: sent ? "HVAC widget: command sent" : "HVAC widget: command not sent")
    WidgetHvacFeedback.save(vin: vin, status: sent ? .success : .error)
    return .result()
  }
}

// result of the last pre-heating button tap of a car, shown by the medium widgets for `displayDuration`.
// Saved in the App Group under "<vin>/widgetHvacStatus": {"status":"success","date":<seconds since 1970>}
struct WidgetHvacFeedback: Codable {
  enum Status: String, Codable {
    case success
    case error
  }

  static let temperature = HvacTemperature.defaultValue
  static let displayDuration: TimeInterval = 60
  // reloads that follow the tap within this delay use the cached status (WidgetKit reloads every widget of the kind)
  static let reloadDelay: TimeInterval = 15

  let status: Status
  let date: Double

  // when the widget must show the button again
  var expiryDate: Date {
    Date(timeIntervalSince1970: date + Self.displayDuration)
  }

  // nil when there is none or when it has expired
  static func load(vin: String?, now: Date = Date()) -> WidgetHvacFeedback? {
    guard let vin = vin,
          let data = AppGroup.userDefaults?.data(forKey: StorageKey.widgetHvacStatus(vin: vin)),
          let feedback = try? JSONDecoder().decode(WidgetHvacFeedback.self, from: data),
          feedback.expiryDate > now
    else {
      return nil
    }
    return feedback
  }

  // true right after a tap on the button of this car
  static func isJustSaved(vin: String?, now: Date = Date()) -> Bool {
    guard let feedback = load(vin: vin, now: now) else { return false }
    return now.timeIntervalSince1970 - feedback.date < reloadDelay
  }

  static func save(vin: String, status: Status) {
    let feedback = WidgetHvacFeedback(status: status, date: Date().timeIntervalSince1970)
    guard let data = try? JSONEncoder().encode(feedback) else { return }
    AppGroup.userDefaults?.set(data, forKey: StorageKey.widgetHvacStatus(vin: vin))
  }
}
