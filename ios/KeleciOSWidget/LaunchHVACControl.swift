//
//  LaunchHVACControl.swift
//  KeleciOSWidget
//
//  Control Center / lock screen / Action button control (iOS 18) that launches the pre-heating.
//  A control cannot ask anything when tapped: the car and the temperature are chosen when the control is added.
//  Also the pre-heating button of the home screen widgets (LaunchHVACWidgetIntent), its confirmation
//  (ConfirmHVACWidgetIntent) and its feedback.
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

// action of the pre-heating button of the home screen widgets: asks for a confirmation first. WidgetKit then reloads
// the widget, which shows it over the whole widget (HvacFeedbackContainer) until Cancel, Confirm or displayDuration.
// The control (LaunchHVACControl) has no confirmation: nothing can be shown between the tap and the command.
struct LaunchHVACWidgetIntent: AppIntent {
  static let title: LocalizedStringResource = "launchPreHeat"
  static let isDiscoverable = false

  // the car of the widget, like LaunchHVACControlIntent
  @Parameter(title: "Car")
  var car: CarEntity?

  init() {}

  init(vin: String) {
    self.car = CarEntity(name: "", id: vin, registrationNumber: nil)
  }

  func perform() async throws -> some IntentResult {
    guard let vin = car?.id else {
      writeWidgetLog(message: "HVAC widget: no car")
      return .result()
    }
    WidgetHvacFeedback.save(vin: vin, status: .confirming)
    return .result()
  }
}

// Confirm button of the confirmation: the car of the widget, at 21 °C.
// While it runs, the confirmation shows the system loading effect (invalidatableContent); WidgetKit then reloads the
// widget, which shows the saved result (WidgetHvacFeedback) over the whole widget (HvacFeedbackContainer).
// Cancel is DismissHvacFeedbackIntent.
struct ConfirmHVACWidgetIntent: AppIntent {
  static let title: LocalizedStringResource = "confirm"
  static let isDiscoverable = false

  @Parameter(title: "Car")
  var car: CarEntity?

  init() {}

  init(vin: String) {
    self.car = CarEntity(name: "", id: vin, registrationNumber: nil)
  }

  func perform() async throws -> some IntentResult {
    guard let vin = car?.id else {
      writeWidgetLog(message: "HVAC widget: no car")
      return .result()
    }
    // the confirmation must still be shown: not cancelled, not expired, not already confirmed
    guard WidgetHvacFeedback.load(vin: vin)?.status == .confirming else {
      writeWidgetLog(message: "HVAC widget: no confirmation pending")
      return .result()
    }
    // a second tap on Confirm while the command is sent does nothing (iOS does not redraw the widget meanwhile)
    WidgetHvacFeedback.dismiss(vin: vin)
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

// OK button of the result of the pre-heating button, and Cancel of its confirmation: the widget goes back to the car
// before displayDuration
struct DismissHvacFeedbackIntent: AppIntent {
  static let title: LocalizedStringResource = "widgetHvacOk"
  static let isDiscoverable = false

  @Parameter(title: "Car")
  var car: CarEntity?

  init() {}

  init(vin: String) {
    self.car = CarEntity(name: "", id: vin, registrationNumber: nil)
  }

  func perform() async throws -> some IntentResult {
    if let vin = car?.id {
      WidgetHvacFeedback.dismiss(vin: vin)
    }
    return .result()
  }
}

// confirmation, then result, of the last pre-heating button tap of a car, shown over the home screen widgets for
// `displayDuration` or until Cancel / OK. Saved in the App Group under "<vin>/widgetHvacStatus":
// {"status":"success","date":<seconds since 1970>} (confirming, success or error), and "dismissed":true after Cancel / OK.
struct WidgetHvacFeedback: Codable {
  enum Status: String, Codable {
    case confirming
    case success
    case error
  }

  static let temperature = HvacTemperature.defaultValue
  static let displayDuration: TimeInterval = 10
  // reloads that follow the tap within this delay use the cached status (WidgetKit reloads every widget of the kind)
  static let reloadDelay: TimeInterval = 15

  let status: Status
  let date: Double
  // Cancel or OK tapped: no longer shown, but still a recent tap for isJustSaved
  var dismissed: Bool? = nil

  // when the widget must show the button again
  var expiryDate: Date {
    Date(timeIntervalSince1970: date + Self.displayDuration)
  }

  // nil when there is none, when it has expired or after Cancel / OK
  static func load(vin: String?, now: Date = Date()) -> WidgetHvacFeedback? {
    guard let feedback = stored(vin: vin), feedback.dismissed != true, feedback.expiryDate > now else {
      return nil
    }
    return feedback
  }

  private static func stored(vin: String?) -> WidgetHvacFeedback? {
    guard let vin = vin,
          let data = AppGroup.userDefaults?.data(forKey: StorageKey.widgetHvacStatus(vin: vin))
    else {
      return nil
    }
    return try? JSONDecoder().decode(WidgetHvacFeedback.self, from: data)
  }

  // timeline of a car widget: one entry with the feedback until it expires, then one with the button
  static func timeline<Entry: TimelineEntry>(
    vin: String?,
    now: Date,
    nextRefresh: Date,
    entry: (Date, WidgetHvacFeedback?) -> Entry
  ) -> Timeline<Entry> {
    guard let feedback = load(vin: vin, now: now) else {
      return Timeline(entries: [entry(now, nil)], policy: .after(nextRefresh))
    }
    return Timeline(entries: [entry(now, feedback), entry(feedback.expiryDate, nil)], policy: .after(nextRefresh))
  }

  // true right after a tap on the button of this car, on Confirm, Cancel or OK
  static func isJustSaved(vin: String?, now: Date = Date()) -> Bool {
    guard let feedback = stored(vin: vin) else { return false }
    return now.timeIntervalSince1970 - feedback.date < reloadDelay
  }

  static func save(vin: String, status: Status) {
    write(vin: vin, feedback: WidgetHvacFeedback(status: status, date: Date().timeIntervalSince1970))
  }

  // Cancel / OK: the date is kept, so the reload that follows still uses the cache
  static func dismiss(vin: String) {
    guard var feedback = stored(vin: vin) else { return }
    feedback.dismissed = true
    write(vin: vin, feedback: feedback)
  }

  private static func write(vin: String, feedback: WidgetHvacFeedback) {
    guard let data = try? JSONEncoder().encode(feedback) else { return }
    AppGroup.userDefaults?.set(data, forKey: StorageKey.widgetHvacStatus(vin: vin))
  }
}
