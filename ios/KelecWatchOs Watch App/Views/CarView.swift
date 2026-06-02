//
//  CarView.swift
//  KelecWatchOs Watch App
//
//  Created by Kelyan Pegeot-Selme on 28/06/2024.
//

import SwiftUI
import WidgetKit
import renaultApi

struct CarView: View {
  
  @State var account: UserAccount
  @State var apiHandler: ApiHandler? = nil
  @State var appPreferences: AppPreferences? = nil
  @State var carAccount: UserCar
  @State var isLoading = true
  @State var isLightLoading = false
  @StateObject var model: ViewModelWatch

  var body: some View {
    NavigationView {
      if(isLoading){
        ProgressView()
          .task {
            await fetchApi(account: account, carAccount: carAccount)
          }
        
        
      }else{
        ZStack{
          
          if(apiHandler == nil){
            VStack {
              Image("zoe")
                .resizable()
                .scaledToFit()
              
              Text("Impossible de se connecter au serveur \(carAccount.getCarMaker())")
              Button{
                Task{
                  await fetchApi(account: account, carAccount: carAccount)
                }
                
              }label: {
                Image(systemName: "arrow.clockwise")
              }
            }
          }else{
              // Fallback on earlier versions
              BatteryCardView(refreshApi: refreshApi, imageUrl: URL(string: carAccount.car?.imageUrl ?? "error")!, apiHandler: apiHandler!, appPreferences: appPreferences, carMaker: carAccount.getCarMaker(), account: account, carAccount: carAccount)
              
                .navigationBarTitleDisplayMode(.inline)
                .navigationTitle(Text("\(carAccount.car?.model ?? "Unknown")"))
            
          }
          VStack {
            if self.isLightLoading {
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
      
    }
    .onChange(of: model.shouldRefreshView){ _ in
      if model.shouldRefreshView {
        refreshApi()
        model.endRefresh()
      }
    }
    
  }
  
  func refreshApi()-> Void{
    Task{
      await fetchApi(account: account, carAccount: carAccount)
      if #available(watchOS 9, *){
        WidgetCenter.shared.reloadAllTimelines()
      }
      
    }
  }
  func convertTimestamp(date: String) -> Date{
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZZZZZZ"
    return(formatter.date(from: date) ?? Date.now)
  }
  
  func fetchApi(account: UserAccount, carAccount: UserCar) async{

    // load user preferences
    self.appPreferences = getUserAppPreferencesFromUserDefaults()
    
    // load the rest
    self.isLightLoading = true
    let carMaker = parseCarMaker(carMaker: carAccount.carMaker)
    let vin = carAccount.car?.vin ?? "VIN"
    self.apiHandler = zeServices.loadSavedCar(vin: vin, carMaker: carMaker)
    if(self.apiHandler != nil){
      self.isLoading = false
    }
    let client = getCarMakerApiClient(usercar: carAccount)
    let semaphore = DispatchSemaphore(value: 0)
    do{
      let fetchedApiHandler = try await client.getVehicleInfo(vin: vin, jwt: "")
      zeServices.saveLoadedCar(vin: vin, zecar: fetchedApiHandler)
      self.apiHandler = fetchedApiHandler
      

      
      semaphore.signal()
    }catch{
      apiHandler = zeServices.loadSavedCar(vin: vin, carMaker: carMaker)
      semaphore.signal()
    }
    semaphore.wait()
    self.isLoading = false
    self.isLightLoading = false
    
  }
  

  
}

//struct CarView_Previews: PreviewProvider {
//  static var previews: some View {
//    CarView(account: UserAccount(selectedCar: "ABC", cars: [UserCar(email: "", password: "", carMaker: "hyundai", car: CarModel(vin: "ABC", image: "image", imageUrl: "image", model: "abc"))]), carApi: AppCarApi(data: AppCar(type: "", id: "", attributes: AppAttributes(timestamp: Date().ISO8601Format(), batteryLevel: 50, batteryAutonomy: 250, batteryCapacity: 10, batteryAvailableEnergy: 0, plugStatus: 1, chargingStatus: 1.0, chargingRemainingTime: 150, chargingInstantaneousPower: 0, batteryTemperature: 0, isLocked: true, chargeLimit: 80))), carAccount: UserCar(email: "", password: "", carMaker: ""))
//  }
//}
//
//

#Preview {
  let carModel = CarModel(vin: "VIN", image: "image", imageUrl: "https://api.kelec.app/ioniq", model: "DEMO")
  let car = UserCar(email: "", password: "", carMaker: "demo", car: carModel)
  let account = UserAccount(selectedCar: "VIN", cars: [car])
  let model = ViewModelWatch()
  CarView(account: account, carAccount: car, model: model)
}
