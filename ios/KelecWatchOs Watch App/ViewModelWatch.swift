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
    
  }
  
  func connect(){
    guard WCSession.isSupported() else{
      return
    }
    session.activate()
    print("Session activated")
    return
  }
  
  func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping([String: Any]) -> Void) {
     print("Message reçu")
    let decoder = JSONDecoder()
    
    if let cookieMapJson = message["cookieValue"] {
      let data = Data((cookieMapJson as! String).utf8)
      if let cookieMap = try? decoder.decode(CookieMap.self, from: data) {
          saveCookieMapToKeychain(cookieMap: cookieMap)
      }
    }
    
    if let appPreferencesData = message["appPreferences"]{
      if let decoded = try? decoder.decode(AppPreferences.self, from:  Data((appPreferencesData as! String).utf8)){
        print("app preferences recieved an decoded")
        let appPreferencesRecieved = decoded
        let currentAppPreferences = getUserAppPreferencesFromUserDefaults()
        if (currentAppPreferences == nil || currentAppPreferences != appPreferencesRecieved){
          if #available(watchOS 9, *){
            WidgetCenter.shared.reloadAllTimelines()
          }
          saveAppPreferencesToUserDefaults(appPreferences: appPreferencesRecieved)
          DispatchQueue.main.async {
            self.shouldRefreshView = true
          }
        }
      }else{
        print("impossible de décoder les app preferences")
      }
    }
    
     if let jsonData = message["message"]{
       if let decoded = try? decoder.decode(UserAccount.self, from: Data((jsonData as! String).utf8)){
         print("message reçu et décodé")
         let accountRecieved = decoded
         let currentAccount = getAccountFromUserDefaults()
         if(currentAccount == nil || currentAccount != accountRecieved){
           if #available(watchOS 9, *){
             WidgetCenter.shared.reloadAllTimelines()
           }
           saveAccountToUserDefaults(account: accountRecieved)
           DispatchQueue.main.async {
             self.shouldRefreshView = true
           }
         }
       }
     }
    
    replyHandler([:])
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

