//
//  CarEntity.swift
//  Kelec
//
//  Created by Kelyan PEGEOT SELME on 04/02/2025.
//

import Foundation
import AppIntents


struct CarEntity: AppEntity, Codable{
  
  var name: String
  var id: String // vin
  
  static var typeDisplayRepresentation: TypeDisplayRepresentation = "Car"
  static var defaultQuery = CarQuery()
  
  public var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(name)")
  }
}


struct CarQuery: EntityQuery{
  
  func entities(for identifiers: [CarEntity.ID]) async throws -> [CarEntity] {
    if let userBundle = UserDefaults.init(suiteName: "group.kelyanselme.MyRenaultPlus"){
      // try to get the account
      let userAccount = getUserAccount(userBundle: userBundle)
      let allCars = buildCarWidgetEntityFromUserCars(userCars: userAccount?.cars ?? [])
      
      return identifiers.compactMap { id in
        allCars.first(where: {$0.id == id}) ?? allCars.first
      }
    }
    return []
  }
  
  func suggestedEntities() async throws -> [CarEntity] {
    if let userBundle = UserDefaults.init(suiteName: "group.kelyanselme.MyRenaultPlus"){
      // try to get the account
      let userAccount = getUserAccount(userBundle: userBundle)
      return buildCarWidgetEntityFromUserCars(userCars: userAccount?.cars ?? [])
    }
    return []
  }
  
  func defaultResult() async -> CarEntity? {
    try? await suggestedEntities().first
  }
}


func buildCarWidgetEntityFromUserCars(userCars: [UserCar]) -> [CarEntity] {
  var carWidgetEntities: [CarEntity] = []
  userCars.forEach { carWidgetEntities.append(CarEntity(name: $0.car?.model ?? "ERROR", id: $0.car?.vin ?? "ERROR")) }
  return carWidgetEntities
}

