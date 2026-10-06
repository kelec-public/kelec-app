//
//  ContentView.swift
//  KelecWatchOs Watch App
//
//  Created by Kelyan Pegeot-Selme on 28/06/2024.
//

import SwiftUI

struct ContentView: View {
  @ObservedObject private var sync = WatchSync.shared
  @State private var account: UserAccount?
  @State private var isLoading = true

  var body: some View {
    VStack{
      if(self.isLoading){
        ProgressView()
          .onAppear(){
            loadAccount()
          }
      }else if let account = account, !account.cars.isEmpty {
        // one page per car
        TabView{
          ForEach(account.cars, id: \.car?.vin) { car in
            CarView(carAccount: car)
          }
        }
      }else{
        VStack{
          Text(account == nil
               ? LocalizedStringKey("watchOpenIphoneToSync")
               : LocalizedStringKey("watchAddVehicleOnIphone"))
          Button{
            loadAccount()
          }label: {
            HStack{
              Image(systemName: "arrow.clockwise")
              Text("refresh")
            }
          }
          .buttonStyle(.bordered)
        }
      }
    }
    // new data synced from the iPhone
    .onChange(of: sync.lastSyncDate){ _ in
      loadAccount()
    }
  }

  func loadAccount(){
    if let account = SharedStore.loadAccount() {
      self.account = account
    }
    self.isLoading = false
  }
}

#Preview {
  ContentView()
}
