//
//  ContentView.swift
//  KelecWatchOs Watch App
//
//  Created by Kelyan Pegeot-Selme on 28/06/2024.
//

import SwiftUI

import SwiftUI

struct ContentView: View {
  @StateObject var model = ViewModelWatch()
  @State var account: UserAccount?
  @State var isLoading = true
  var body: some View {
    VStack{
      if(self.isLoading){
        ProgressView()
          .onAppear(){
            loadAccount()
          }
      }else{
        if(self.account == nil){
          VStack{
            Text("Ouvrez l'appli sur l'iPhone pour synchroniser")
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
        }else{
          if(account!.cars.count > 0){
            TabView{
              ForEach(0..<account!.cars.count, id: \.self) { i in
                VStack{
                  CarView(account: account!, carAccount: account!.cars[i], model: model)

                }
               
              }
            }
          }else{
            VStack{
              Text("Ajoutez un véhicule sur l'appli sur iPhone")
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
      }
    }
    .onChange(of: model.shouldRefreshView){ _ in
      self.account = nil
      Task{
        loadAccount()
      }
      model.endRefresh()
    }
  }
  
  func loadAccount(){
    let account = SharedStore.loadAccount()
    if (account != nil){
      self.account = account
    }
    self.isLoading = false
  }
}

struct ContentView_Previews: PreviewProvider {
  static var previews: some View {
    ContentView()
  }
}


