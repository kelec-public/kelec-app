//
//  CarView.swift
//  KelecWatchOs Watch App
//
//  Created by Kelyan Pegeot-Selme on 28/06/2024.
//

import SwiftUI
import renaultApi

struct CarView: View {
  let carAccount: UserCar
  @StateObject private var viewModel: CarViewModel
  @ObservedObject private var sync = WatchSync.shared

  init(carAccount: UserCar) {
    self.carAccount = carAccount
    _viewModel = StateObject(wrappedValue: CarViewModel(userCar: carAccount))
  }

  var body: some View {
    NavigationView {
      if(viewModel.isLoading){
        ProgressView()
          .task {
            await viewModel.load()
          }
      }else{
        ZStack{
          if let apiHandler = viewModel.apiHandler {
            BatteryCardView(refreshApi: refresh, launchHVAC: viewModel.launchHVAC, imageUrl: URL(string: carAccount.car?.imageUrl ?? ""), apiHandler: apiHandler, appPreferences: viewModel.appPreferences, carMaker: carAccount.getCarMaker(), carAccount: carAccount)
              .navigationBarTitleDisplayMode(.inline)
              .navigationTitle(Text("\(carAccount.car?.model ?? "Unknown")"))
          }else{
            VStack {
              Image("zoe")
                .resizable()
                .scaledToFit()

              Text("carMakerServerError \(carAccount.getCarMaker())")
              Button{
                Task{
                  await viewModel.load()
                }
              }label: {
                Image(systemName: "arrow.clockwise")
              }
            }
          }
          if viewModel.isRefreshing {
            VStack {
              HStack {
                Spacer()
                ProgressView()
                  .frame(width: 20, height: 20)
              }
              Spacer()
            }
          }
        }
      }
    }
    // new data synced from the iPhone
    .onChange(of: sync.lastSyncDate){ _ in
      refresh()
    }
  }

  func refresh() {
    Task{
      await viewModel.refresh()
    }
  }
}

#Preview {
  let carModel = CarModel(vin: "VIN", image: "image", imageUrl: "https://api.kelec.app/ioniq", model: "DEMO")
  let car = UserCar(email: "", password: "", carMaker: "demo", car: carModel)
  CarView(carAccount: car)
}
