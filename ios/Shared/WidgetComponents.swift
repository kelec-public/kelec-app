//
//  WidgetComponents.swift
//  Kelec
//
//  View helpers shared by the iOS widgets and the watch widgets.
//

import SwiftUI
import WidgetKit
import renaultApi

extension View {
  // white container background, required by widgets since iOS 17 / watchOS 10
  func widgetBackground() -> some View {
    self.containerBackground(for: .widget) {
      Color("blanc")
    }
  }
}

// the "Alternative" widgets show the same data with another layout
enum WidgetStyle {
  case standard
  case alternative
}

// Shows why the car can't be displayed (not logged, no car, server error),
// else the content with the unwrapped data.
struct CarWidgetStateView<Content: View>: View {
  var account: UserAccount?
  var userCar: UserCar?
  var apiHandler: ApiHandler?
  var serverError: LocalizedStringKey = "widgetServerError"
  @ViewBuilder var content: (UserAccount, UserCar, ApiHandler) -> Content

  var body: some View {
    if let account = account {
      if let userCar = userCar {
        if let apiHandler = apiHandler {
#if os(iOS)
          // tapping the widget opens the app on its car
          content(account, userCar, apiHandler)
            .widgetURL(userCar.car.flatMap { CarLink.url(vin: $0.vin) })
#else
          content(account, userCar, apiHandler)
#endif
        } else {
          WidgetEmptyView(text: serverError, illustration: .error)
        }
      } else {
        WidgetEmptyView(text: "widgetNoCarSelected", illustration: .car)
      }
    } else {
      WidgetEmptyView(text: "widgetNotLoggedIn", illustration: .account)
    }
  }
}

// Empty car widget (not logged in, no car, server error). Home screen widgets: an SF Symbol on a light disc above the
// message (side by side when the widget is low), like the Android widgets. Other widgets (lock screen, watch): the text.
struct WidgetEmptyView: View {
  enum Illustration {
    case account, car, error

    var symbol: String {
      switch self {
      case .account: return "person.crop.circle.fill"
      case .car: return "car.fill"
      case .error: return "icloud.slash.fill"
      }
    }

    var colour: Color {
      self == .error ? .orange : .blue
    }
  }

  var text: LocalizedStringKey
  var illustration: Illustration
  @Environment(\.widgetFamily) private var family

  var body: some View {
#if os(iOS)
    switch family {
    case .systemSmall, .systemMedium, .systemLarge, .systemExtraLarge:
      VStack(spacing: 10) {
        badge
        Text(text)
          .font(.subheadline)
          .fontWeight(.medium)
          .multilineTextAlignment(.center)
          .lineLimit(3)
          .minimumScaleFactor(0.8)
      }
      .padding()
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .widgetBackground()
    default:
      Text(text)
    }
#else
    Text(text)
#endif
  }

  // the symbol on a light disc, with a green "+" for the car to add
  private var badge: some View {
    ZStack(alignment: .bottomTrailing) {
      Image(systemName: illustration.symbol)
        .font(.system(size: 24, weight: .semibold))
        .foregroundStyle(illustration.colour)
        .frame(width: 56, height: 56)
        .background(Circle().fill(illustration.colour.opacity(0.12)))
        .widgetAccentable()
      if illustration == .car {
        Image(systemName: "plus.circle.fill")
          .font(.system(size: 18, weight: .bold))
          .symbolRenderingMode(.palette)
          .foregroundStyle(.white, .green)
          .offset(x: 2, y: 2)
      }
    }
  }
}

// SF Symbol of the car state for the lock screen and watch widgets
func carStatusIcon(isPlugged: Bool, isCharging: Bool) -> String {
  isPlugged ? (isCharging ? "bolt.car.fill" : "bolt") : "car.fill"
}

extension ApiHandler {
  // green, or orange when the car gives its energy (V2G / V2L)
  var chargingColour: Color {
    getChargingColour(isV2GorV2L: getIsV2GorV2L())
  }

  // the charging colour while plugged, else the given one
  func chargingColour(unplugged: Color) -> Color {
    getIsCarPlugged() ? chargingColour : unplugged
  }

  // remaining charging time as "2h05", "--h--" when the car is not charging or full
  var chargingTimeText: String {
    (!getIsCarCharging() || getBatteryLevel() == 100) ? "--h--" : formatChargingTime(minutes: getChargingRemainingTime())
  }
}
