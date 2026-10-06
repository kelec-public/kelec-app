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
  var registrationNumber: String?
  
  static var typeDisplayRepresentation: TypeDisplayRepresentation = "Car"
  static var defaultQuery = CarQuery()
  
  // the plate when the car has one, the VIN otherwise
  private var plateOrVin: String {
    guard let plate = registrationNumber, !plate.isEmpty else { return id }
    return plate
  }
  
  public var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(name)", subtitle: "\(plateOrVin)")
  }
}


struct CarQuery: EntityQuery{
  
  func entities(for identifiers: [CarEntity.ID]) async throws -> [CarEntity] {
    let allCars = buildCarWidgetEntityFromUserCars(userCars: SharedStore.loadAccount()?.cars ?? [])
    
    // an unknown id (car deleted) returns nothing: widgets then fall back to the first car themselves
    return identifiers.compactMap { id in
      allCars.first(where: {$0.id == id})
    }
  }
  
  func suggestedEntities() async throws -> [CarEntity] {
    buildCarWidgetEntityFromUserCars(userCars: SharedStore.loadAccount()?.cars ?? [])
  }
  
  func defaultResult() async -> CarEntity? {
    try? await suggestedEntities().first
  }
}


func buildCarWidgetEntityFromUserCars(userCars: [UserCar]) -> [CarEntity] {
  var carWidgetEntities: [CarEntity] = []
  userCars.forEach { carWidgetEntities.append(CarEntity(name: $0.car?.model ?? "ERROR", id: $0.car?.vin ?? "ERROR", registrationNumber: $0.car?.registrationNumber)) }
  return carWidgetEntities
}

