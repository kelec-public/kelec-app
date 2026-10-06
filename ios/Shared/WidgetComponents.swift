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
          content(account, userCar, apiHandler)
        } else {
          Text(serverError)
        }
      } else {
        Text("widgetNoCarSelected")
      }
    } else {
      Text("widgetNotLoggedIn")
    }
  }
}

// SF Symbol of the car state for the lock screen and watch widgets
func carStatusIcon(isPlugged: Bool, isCharging: Bool) -> String {
  isPlugged ? (isCharging ? "bolt.car.fill" : "bolt") : "car.fill"
}
