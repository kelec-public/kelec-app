//
//  Models.swift
//  Kelec
//
//  The account shared by the RN app (JSON in the App Group): field names are serialized, never rename them.
//

import Foundation
import renaultApi

public struct UserAccount:Codable, Equatable{
  public static func == (lhs: UserAccount, rhs: UserAccount) -> Bool {
    return lhs.cars == rhs.cars
  }
  
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
  
  // carMaker stays a String in the stored JSON; unknown values are the demo car
  var maker: CarMaker {
    return CarMaker(rawValue: carMaker) ?? .DEMO
  }
  
  func getPassword() -> String{
    return self.password
  }
  
  func getEmail() -> String{
    return self.email
  }
}
