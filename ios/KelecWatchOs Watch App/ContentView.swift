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
            CarView(account: account, carAccount: car)
          }
        }
      }else{
        VStack{
          Text(account == nil
               ? LocalizedStringKey("Ouvrez l'appli sur l'iPhone pour synchroniser")
               : LocalizedStringKey("Ajoutez un véhicule sur l'appli sur iPhone"))
          Button{
            loadAccount()
          }label: {
            HStack{
              Image(systemName: "arrow.clockwise")
              Text("Rafraîchir")
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
