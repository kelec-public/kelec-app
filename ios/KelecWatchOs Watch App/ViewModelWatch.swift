//
//  ViewModelWatch.swift
//  KelecWatchOs Watch App
//
//  Created by Kelyan Pegeot-Selme on 28/06/2024.
//

import Foundation
import WatchConnectivity
import WidgetKit
import renaultApi
import Combine


class ViewModelWatch: NSObject, WCSessionDelegate, ObservableObject{
  @Published var shouldRefreshView = false
  var session: WCSession
  var recieved = ""
  init(session: WCSession = .default){
    self.session = session
    super.init()
    self.session.delegate = self
    self.connect()
  }
  
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?){
    // data synced while the watch app was closed
    if activationState == .activated && !session.receivedApplicationContext.isEmpty {
      handleSyncPayload(session.receivedApplicationContext)
    }
  }
  
  func connect(){
    guard WCSession.isSupported() else{
      return
    }
    session.activate()
    print("Session activated")
    return
  }
  
  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    handleSyncPayload(applicationContext)
  }
  
  // kept for iPhones still sending the data with sendMessage
  func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping([String: Any]) -> Void) {
    handleSyncPayload(message)
    replyHandler([:])
  }
  
  func handleSyncPayload(_ payload: [String: Any]) {
    let decoder = JSONDecoder()
    var hasChanged = false
    
    if let cookieMapJson = payload["cookieValue"] as? String,
       let cookieMap = try? decoder.decode(CookieMap.self, from: Data(cookieMapJson.utf8)) {
      saveCookieMapToKeychain(cookieMap: cookieMap)
    }
    
    // passwords (hyundai only) by vin. A missing key never removes a password already saved
    if let passwordsJson = payload["passwords"] as? String,
       let passwords = try? decoder.decode([String: String].self, from: Data(passwordsJson.utf8)) {
      for (vin, password) in passwords where !password.isEmpty {
        saveToKeychain(key: "\(vin)_password", value: password)
      }
    }
    
    if let appPreferencesJson = payload["appPreferences"] as? String {
      if let appPreferencesRecieved = try? decoder.decode(AppPreferences.self, from: Data(appPreferencesJson.utf8)){
        print("app preferences recieved an decoded")
        let currentAppPreferences = getUserAppPreferencesFromUserDefaults()
        if (currentAppPreferences == nil || currentAppPreferences != appPreferencesRecieved){
          saveAppPreferencesToUserDefaults(appPreferences: appPreferencesRecieved)
          hasChanged = true
        }
      }else{
        print("impossible de décoder les app preferences")
      }
    }
    
    // the account is received without passwords: it replaces the one saved by older versions with passwords
    if let accountJson = payload["message"] as? String,
       let accountRecieved = try? decoder.decode(UserAccount.self, from: Data(accountJson.utf8)) {
      print("message reçu et décodé")
      let currentAccount = getAccountFromUserDefaults()
      if(currentAccount == nil || currentAccount != accountRecieved){
        saveAccountToUserDefaults(account: accountRecieved)
        hasChanged = true
      }
    }
    
    if hasChanged {
      if #available(watchOS 9, *){
        WidgetCenter.shared.reloadAllTimelines()
      }
      DispatchQueue.main.async {
        self.shouldRefreshView = true
      }
    }
  }
  
  func saveCookieMapToKeychain(cookieMap: CookieMap) {
      for (email, entry) in cookieMap {
          guard let data = try? JSONEncoder().encode(entry),
                let value = String(data: data, encoding: .utf8) else { continue }
          
          saveToKeychain(key: "cookieValue_\(email)", value: value)
      }
  }
  
  func saveToKeychain(key: String, value: String) {
      guard let data = value.data(using: .utf8) else { return }
      
      // Supprime l'ancien si existe
      let deleteQuery: [String: Any] = [
          kSecClass as String: kSecClassGenericPassword,
          kSecAttrAccount as String: key,
          kSecAttrAccessGroup as String: "group.kelyanselme.MyRenaultPlus"
      ]
      SecItemDelete(deleteQuery as CFDictionary)
      
      // Sauvegarde le nouveau
      let addQuery: [String: Any] = [
          kSecClass as String: kSecClassGenericPassword,
          kSecAttrAccount as String: key,
          kSecValueData as String: data,
          kSecAttrAccessGroup as String: "group.kelyanselme.MyRenaultPlus",
          kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
      ]
      
      let status = SecItemAdd(addQuery as CFDictionary, nil)
  }
  
  
  func endRefresh()->Void{
    self.shouldRefreshView = false
  }
  
  func getShouldRefresh()->Bool{
    return self.shouldRefreshView
  }
}

