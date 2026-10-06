//
//  WatchSettingsView.swift
//  KelecWatchOs Watch App
//
//  Settings page of the watch app: the car shown by the watch widgets.
//

import SwiftUI
import WidgetKit

struct WatchSettingsView: View {
  let account: UserAccount
  // vin of the car shown by the widgets
  @State private var widgetVin: String? = nil

  var body: some View {
    NavigationStack {
      List {
        Section(header: Text("watchWidgetCar")) {
          ForEach(account.cars, id: \.car?.vin) { car in
            Button {
              select(car)
            } label: {
              HStack {
                Text(car.car?.model ?? "")
                Spacer()
                if car.car?.vin == widgetVin {
                  Image(systemName: "checkmark")
                }
              }
            }
          }
        }
      }
      .navigationTitle(Text("watchSettings"))
    }
    .onAppear {
      widgetVin = watchCar(account: account)?.car?.vin
    }
  }

  private func select(_ car: UserCar) {
    guard let vin = car.car?.vin else { return }
    SharedStore.saveWatchWidgetVin(vin)
    widgetVin = vin
    WidgetCenter.shared.reloadAllTimelines()
  }
}
