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
        Keychain.save(StorageKey.password(vin: vin), value: password)
      }
    }
    
    if let appPreferencesJson = payload["appPreferences"] as? String {
      if let appPreferencesRecieved = try? decoder.decode(AppPreferences.self, from: Data(appPreferencesJson.utf8)){
        print("app preferences recieved an decoded")
        let currentAppPreferences = SharedStore.loadPreferences()
        if (currentAppPreferences == nil || currentAppPreferences != appPreferencesRecieved){
          SharedStore.savePreferences(appPreferencesRecieved)
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
      let currentAccount = SharedStore.loadAccount()
      if(currentAccount == nil || currentAccount != accountRecieved){
        SharedStore.saveAccount(accountRecieved)
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
      Keychain.save(StorageKey.cookieValue(email: email), value: value)
    }
  }
  
  func endRefresh()->Void{
    self.shouldRefreshView = false
  }
}

