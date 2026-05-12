//
//  widgetHelper.swift
//  Kelec
//
//  Created by Kelyan PEGEOT SELME on 11/18/24.
//

import Foundation
import renaultApi
import SwiftUI

func getPasswordFromKeychain(key: String) throws -> String {
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword, // Match the class used in Objective-C
        kSecAttrAccount as String: key, // Match the attribute used in Objective-C
        kSecMatchLimit as String: kSecMatchLimitOne,
        kSecReturnAttributes as String: true,
        kSecReturnData as String: true,
        kSecAttrAccessGroup as String: "group.kelyanselme.MyRenaultPlus"
    ]
    
    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    
    if status == errSecSuccess,
       let existingItem = item as? [String: Any],
       let passwordData = existingItem[kSecValueData as String] as? Data,
       let password = String(data: passwordData, encoding: .utf8) {
      if(password == ""){
        throw NSError()
      }else{
        return password
      }

    } else {
        print("Failed to retrieve data from Keychain. Error: \(status)")
      throw NSError()
    }
}

func getUserAccount(userBundle: UserDefaults) -> UserAccount? {
  // this function returns the main user of the app if there is at least one car configured.
  // return none else.
  
  // try to get the main account
  if let accountText = userBundle.value(forKey: "account") as? String {
    let accountData = Data(accountText.utf8)
    if let valuesData = try? JSONDecoder().decode(UserAccount.self, from: accountData){
      return valuesData
    }
  }
  return nil
}

func getUserAppPreferences(userBundle: UserDefaults) -> AppPreferences? {
  // this function returns the user app preferences (for example use miles instead of km etc...)
  // return nil else
  
  // try to get the app preferences
  if let preferencesText = userBundle.value(forKey: "appPreferences") as? String {
    let preferencesData = Data(preferencesText.utf8)
    if let valuesData = try? JSONDecoder().decode(AppPreferences.self, from: preferencesData){
      return valuesData
    }
  }
  return nil
  
}

func getAccountUserCar(userAccount: UserAccount) -> UserCar?{
  // this function return the car the user selected to be displayed on widgets
  if(userAccount.selectedCar == ""){
    // there are no car added yet
    return nil
  }
  
  let selectedCar = userAccount.selectedCar
  // now iterate over cars to find the good one
  for car in userAccount.cars{
    if(car.car?.vin == selectedCar){
      return car
    }
  }
  
  // car not found (shouldn't happen?)
  return nil
}

func getCarImage(vin: String, userBundle: UserDefaults) -> String {
  // this function get the car image as base64
  if let carImage = userBundle.value(forKey: "\(vin)/image") as? String{
    return carImage
  }
  
  // image not found
  return ""
}


func getTempoData() async -> tempoFinalReturn? {
  let rteClient = getRteClient()
  if let tempoReturn = try? await rteClient.getTempo(){
    zeServices.saveTempoData(tempo: tempoReturn)
    return tempoReturn
  }
  
  // unable to fetch tempo data, try to get it from local
  let cachedTempo = zeServices.loadTempoData()
  return cachedTempo
}


func saveAccountToUserDefaults(account: UserAccount)->Bool{
  let encoder = JSONEncoder()
  if let encoded = try? encoder.encode(account){
    if let userDefaults = UserDefaults(suiteName: "group.kelyanselme.MyRenaultPlus"){
      userDefaults.set(encoded, forKey: "account")
    }
  }
  return false
}


func saveAppPreferencesToUserDefaults(appPreferences: AppPreferences)->Bool{
  let encoder = JSONEncoder()
  if let encoded = try? encoder.encode(appPreferences){
    if let userDefaults = UserDefaults(suiteName: "group.kelyanselme.MyRenaultPlus"){
      userDefaults.set(encoded, forKey: "appPreferences")
      return true
    }
  }
  return false
}

// ONLY FOR APPLE WATCH
func getAccountFromUserDefaults()->UserAccount?{
  if let userDefaults = UserDefaults(suiteName: "group.kelyanselme.MyRenaultPlus"){
    if let accountData = userDefaults.object(forKey: "account"){
      let decoder = JSONDecoder()
      if let loadedAccount = try? decoder.decode(UserAccount.self, from: accountData as! Data){
        return loadedAccount
      }
    }
  }
  return nil
}


func getUserAppPreferencesFromUserDefaults()->AppPreferences?{
  if let userDefaults = UserDefaults(suiteName: "group.kelyanselme.MyRenaultPlus"){
    if let accountData = userDefaults.object(forKey: "appPreferences"){
      let decoder = JSONDecoder()
      if let loadedAccount = try? decoder.decode(AppPreferences.self, from: accountData as! Data){
        return loadedAccount
      }
    }
  }
  return nil
}


func getChargingColour(isV2GorV2L: Bool)->Color {
  return isV2GorV2L ? .orange : .green
}
