//
//  GetCarStatusIntent.swift
//  Kelec
//
//  Shortcuts action "Get the status of <car>": returns a CarStatusEntity whose typed properties
//  (battery level, range, charge status…) can be used by the next actions of the shortcut.
//

import Foundation
import AppIntents
import renaultApi

struct GetCarStatusIntent: AppIntent {
  static let title: LocalizedStringResource = "getCarStatus"
  static let description = IntentDescription("getCarStatusDescription")

  @Parameter(title: "Car", description: "getCarStatusCarDescription")
  var car: CarEntity

  static var parameterSummary: some ParameterSummary {
    Summary("getCarStatusSummary \(\.$car)")
  }

  func perform() async throws -> some IntentResult & ReturnsValue<CarStatusEntity> & ProvidesDialog {
    guard let userCar = SharedStore.loadAccount()?.cars.first(where: { $0.car?.vin == car.id }) else {
      throw CarStatusError.carNotFound
    }
    // fetched data, else the last cached one
    guard let apiHandler = await VehicleLoader.fetchStatus(userCar: userCar) else {
      throw CarStatusError.noData
    }

    let appPreferences = SharedStore.loadPreferences()
    let status = CarStatusEntity(carName: car.name, apiHandler: apiHandler, appPreferences: appPreferences)
    // range as displayed by the app and the widgets
    let range = "\(apiHandler.getBatteryRange(appPreferences: appPreferences)) \(getUnitsText(useMiles: appPreferences?.displayMiles ?? false))"
    let message = String(
      format: localized("carStatusDialog %@ %@ %@ %@"),
      car.name, String(apiHandler.getBatteryLevel()), range, localized(status.chargeStatus.localizationKey)
    )
    return .result(value: status, dialog: "\(message)")
  }
}

// status of a car when the action ran; not stored, so no query
struct CarStatusEntity: TransientAppEntity {
  static let typeDisplayRepresentation: TypeDisplayRepresentation = "carStatus"

  @Property(title: "Car")
  var car: String

  @Property(title: "carStatusBatteryLevel")
  var batteryLevel: Int

  @Property(title: "carStatusRange")
  var range: Measurement<UnitLength>

  @Property(title: "carStatusChargeStatus")
  var chargeStatus: CarChargeStatus

  @Property(title: "carStatusIsPlugged")
  var isPlugged: Bool

  // only while charging
  @Property(title: "carStatusRemainingTime")
  var chargingRemainingTime: Measurement<UnitDuration>?

  // not returned by Renault group cars
  @Property(title: "carStatusChargeLimit")
  var chargeLimit: Int?

  // not returned by Renault group cars
  @Property(title: "carStatusIsLocked")
  var isLocked: Bool?

  @Property(title: "carStatusMileage")
  var mileage: Measurement<UnitLength>?

  @Property(title: "carStatusLastUpdate")
  var lastUpdate: Date

  init() {}

  // distances as displayed by the app and the widgets: unit from displayMiles, conversion by the api handler
  // (range converted only with convertToMiles, mileage with displayMiles)
  init(carName: String, apiHandler: ApiHandler, appPreferences: AppPreferences?) {
    let isRenaultGroup = apiHandler.getCarMaker() != .HYUNDAI && apiHandler.getCarMaker() != .DEMO
    let chargeStatus = CarChargeStatus(apiHandler.getChargeStatus())
    let isCharging = chargeStatus == .charging
    let distanceUnit: UnitLength = appPreferences?.displayMiles == true ? .miles : .kilometers
    let mileage = apiHandler.getMilage(appPreferences: appPreferences)

    car = carName
    batteryLevel = apiHandler.getBatteryLevel()
    range = Measurement(value: Double(apiHandler.getBatteryRange(appPreferences: appPreferences)), unit: distanceUnit)
    self.chargeStatus = chargeStatus
    isPlugged = apiHandler.getIsCarPlugged()
    chargingRemainingTime = isCharging && apiHandler.getChargingRemainingTime() > 0
      ? Measurement(value: Double(apiHandler.getChargingRemainingTime()), unit: .minutes)
      : nil
    chargeLimit = isRenaultGroup ? nil : apiHandler.getChargeLimit()
    isLocked = isRenaultGroup ? nil : apiHandler.getIsCarLocked()
    // negative when the car maker didn't return it
    self.mileage = mileage >= 0 ? Measurement(value: mileage.rounded(), unit: distanceUnit) : nil
    lastUpdate = convertTimestamp(date: apiHandler.getLastRefreshDate())
  }

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(car)", subtitle: "\(batteryLevel) %")
  }
}

// ChargeStatus of renaultApi, for Shortcuts (conditions show the cases in a menu)
enum CarChargeStatus: String, AppEnum {
  case notPlugged
  case notCharging
  case charging
  case scheduled
  case ended
  case v2g
  case v2l

  static let typeDisplayRepresentation: TypeDisplayRepresentation = "carStatusChargeStatus"
  // AppIntents needs literals: keep in sync with localizationKey
  static let caseDisplayRepresentations: [CarChargeStatus: DisplayRepresentation] = [
    .notPlugged: "chargeStatusNotPlugged",
    .notCharging: "chargeStatusNotCharging",
    .charging: "chargeStatusCharging",
    .scheduled: "chargeStatusScheduled",
    .ended: "chargeStatusEnded",
    .v2g: "chargeStatusV2G",
    .v2l: "chargeStatusV2L",
  ]

  init(_ chargeStatus: ChargeStatus) {
    switch chargeStatus {
    case .notPlugged: self = .notPlugged
    case .notCharging: self = .notCharging
    case .charging: self = .charging
    case .scheduled: self = .scheduled
    case .ended: self = .ended
    case .v2g: self = .v2g
    case .v2l: self = .v2l
    }
  }

  var localizationKey: String {
    switch self {
    case .notPlugged: return "chargeStatusNotPlugged"
    case .notCharging: return "chargeStatusNotCharging"
    case .charging: return "chargeStatusCharging"
    case .scheduled: return "chargeStatusScheduled"
    case .ended: return "chargeStatusEnded"
    case .v2g: return "chargeStatusV2G"
    case .v2l: return "chargeStatusV2L"
    }
  }
}

enum CarStatusError: Error, CustomLocalizedStringResourceConvertible {
  case carNotFound
  case noData

  var localizedStringResource: LocalizedStringResource {
    switch self {
    case .carNotFound: return "widgetNoCarSelected"
    case .noData: return "widgetServerError"
    }
  }
}
