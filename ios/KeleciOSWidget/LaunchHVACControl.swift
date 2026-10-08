//
//  LaunchHVACControl.swift
//  KeleciOSWidget
//
//  Control Center / lock screen / Action button control (iOS 18) that launches the pre-heating.
//  A control cannot ask anything when tapped: the car and the temperature are chosen when the control is added.
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
