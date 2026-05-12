//
//  zeServices.swift
//  KeleciOSWidgetExtension
//
//  Created by Kelyan Pegeot-Selme on 18/03/2024.
//

import Foundation
import renaultApi
import SwiftUI

protocol VehicleToSave: Codable{
  var vin: String { get  }
}

public struct saveLocation: Codable{
  public var vin: String
  public var latitude: Latitude
  public var longitude: Longitude
}


struct RenaultSaved: Codable, VehicleToSave{
  var vin: String
  public var batteryStatus: RenaultBatteryStatus
}

struct HyundaiSaved: Codable, VehicleToSave{
  var vin: String
  public var hyundaiStatus: HyundaiLayerReturn
}

struct zeServices{
  static func saveTempoData(tempo: tempoFinalReturn)->Bool{
    let encoder = JSONEncoder()
    if let encoded = try? encoder.encode(tempo){
      UserDefaults.standard.set(encoded, forKey: "tempo")
      return true
    }
    return false
  }
  
  
  static func saveLoadedCar(vin: String, zecar: ApiHandler)->Bool{
    var finalCars:[VehicleToSave] = []
    var carToSave: VehicleToSave
    switch (zecar.getCarMaker()){
    case .RENAULT:
      carToSave = RenaultSaved(vin: vin, batteryStatus: zecar.getApiData() as! RenaultBatteryStatus)
      if let data = UserDefaults.standard.data(forKey: "RENAULT_carsLoaded")
      {
        let decoder = JSONDecoder()
        if let loadedCars = try? decoder.decode([RenaultSaved].self, from: data){
          finalCars = loadedCars
        }
      }
    case .HYUNDAI:
      carToSave = HyundaiSaved(vin: vin, hyundaiStatus: zecar.getApiData() as! HyundaiLayerReturn)
      if let data = UserDefaults.standard.data(forKey: "HYUNDAI_carsLoaded")
      {
        let decoder = JSONDecoder()
        if let loadedCars = try? decoder.decode([HyundaiSaved].self, from: data){
          finalCars = loadedCars
        }
      }
    case .DEMO:
      // no need to save anything
      return true
    }
    
    
    var index = -1
    for i in 0..<finalCars.count{
      if finalCars[i].vin == vin{
        index = i
      }
    }
    if(index == -1){
      finalCars.append(carToSave)
    }else{
      finalCars[index] = carToSave
    }
    
    switch(zecar.getCarMaker()){
      
    case .RENAULT:
      let finalConvertedCars = finalCars as! [RenaultSaved]
      let encoder = JSONEncoder()
      if let encoded = try? encoder.encode(finalConvertedCars){
        UserDefaults.standard.set(encoded, forKey: "RENAULT_carsLoaded")
        return true
      }
      break
    case .HYUNDAI:
      let finalConvertedCars = finalCars as! [HyundaiSaved]
      let encoder = JSONEncoder()
      if let encoded = try? encoder.encode(finalConvertedCars){
        UserDefaults.standard.set(encoded, forKey: "HYUNDAI_carsLoaded")
        return true
      }
      break
    case .DEMO:
      // no need to save anything for demo car
      break
    }
    
    return false
  }
  
  static func saveLoadedLocation(vin:String, latitude: Latitude, longitude: Longitude)->Void{
    let locationToSave = saveLocation(vin: vin, latitude: latitude, longitude: longitude)
    let encoder = JSONEncoder()
    if let encodedData = try? encoder.encode(locationToSave){
      UserDefaults.standard.set(encodedData, forKey: "savedLocation_\(vin)")
    }
  }
  
  static func loadSavedLocations(vin: String)->saveLocation?{
    if let data = UserDefaults.standard.data(forKey: "savedLocation_\(vin)"){
      let decoder = JSONDecoder()
      if let loadedLocation = try? decoder.decode(saveLocation.self, from: data){
        return loadedLocation
      }
    }
    return nil
  }
  
  static func loadSavedCar(vin: String, carMaker: CarMaker)->ApiHandler?{
    switch(carMaker){
    case .RENAULT:
      var carsLoaded: [RenaultSaved] = []
      if let data = UserDefaults.standard.data(forKey: "RENAULT_carsLoaded"){
        let decoder = JSONDecoder()
        if let loadedCars = try? decoder.decode([RenaultSaved].self, from: data){
          carsLoaded = loadedCars
          for i in 0..<carsLoaded.count{
            if carsLoaded[i].vin == vin{
              return RenaultApiHandler(batteryStatus: carsLoaded[i].batteryStatus)
            }
          }
        }
      }
      return nil
    case .HYUNDAI:
      var carsLoaded: [HyundaiSaved] = []
      if let data = UserDefaults.standard.data(forKey: "HYUNDAI_carsLoaded"){
        let decoder = JSONDecoder()
        if let loadedCars = try? decoder.decode([HyundaiSaved].self, from: data){
          carsLoaded = loadedCars
          for i in 0..<carsLoaded.count{
            if carsLoaded[i].vin == vin{
              return HyundaiApiHandler(apiData: carsLoaded[i].hyundaiStatus)
            }
          }
        }
      }
      return nil
    case .DEMO:
      return DemoApiHandler()
    }

  }
  

  
  static func loadTempoData()->tempoFinalReturn?{
    if let data = UserDefaults.standard.data(forKey: "tempo"){
      let decoder = JSONDecoder()
      if let loadedTempo = try? decoder.decode(tempoFinalReturn.self, from: data){
        return loadedTempo
      }
    }
    return nil
  }

}



func convertTimestamp(date: String) -> Date{
  let formatter = DateFormatter()
  formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZZZZZZ"
  return(formatter.date(from: date) ?? Date.now)
}

func isBeforeToday(_ date: Date) -> Bool{
  let calendar = Calendar.current
  let today = calendar.startOfDay(for: Date())
  let otherDate = calendar.startOfDay(for: date)
  if today == otherDate {
    return false
  }
  
  return otherDate < today
}



public struct UserAccount:Codable, Equatable{
  public static func == (lhs: UserAccount, rhs: UserAccount) -> Bool {
    return lhs.selectedCar == rhs.selectedCar && lhs.cars == rhs.cars
  }
  
  var selectedCar: String
  var cars: [UserCar]
  
}


public struct CarModel: Codable, Equatable{
  var vin: String
  var image: String
  var imageUrl: String
  var model: String // car name
}

public struct UserCar: Codable, Equatable{
  public static func == (lhs: UserCar, rhs: UserCar) -> Bool {
    return lhs.email == rhs.email
    && lhs.password == rhs.password
    && lhs.carMaker == rhs.carMaker
    && lhs.kamereonAccountID == rhs.kamereonAccountID
    && lhs.car == rhs.car
    && lhs.pinCode == rhs.pinCode
  }
  
  private var email: String
  var password: String
  var carMaker: String
  var kamereonAccountID: String?
  var car: CarModel?
  var pinCode: String?
  
  public init(email: String, password: String, carMaker: String, kamereonAccountID: String? = nil, car: CarModel? = nil, pinCode: String? = nil) {
    self.email = email
    self.password = password
    self.carMaker = carMaker
    self.kamereonAccountID = kamereonAccountID
    self.car = car
    self.pinCode = pinCode
  }
  
  func getCarMaker() -> String {
    return self.carMaker
  }
  
  func getPassword() -> String{
    return self.password
  }
  
  func getEmail() -> String{
    return self.email
  }
}



public struct CarAccount: Codable{
  var model: String
  var vin: String
  var imageUrl: String
  var id : String?
  var carMaker: String
}




public func parseCarMaker(carMaker: String)->CarMaker{
  // parse a carMaker string as usable enum
  switch (carMaker){
  case "renault":
    return .RENAULT
  case "hyundai":
    return .HYUNDAI
  default:
    return .DEMO
  }
}
