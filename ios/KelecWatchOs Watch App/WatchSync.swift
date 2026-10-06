//
//  WatchSync.swift
//  KelecWatchOs Watch App
//
//  Receives the account, preferences, Renault session cookies and Hyundai passwords sent by the iPhone
//  (src/packages/kelec-settings/services/appleWatchSync.ts).
//

import Foundation
import WatchConnectivity
import WatchKit
import WidgetKit
import renaultApi

final class WatchSync: NSObject, WCSessionDelegate, ObservableObject {
  // one session delegate for the whole app, activated at launch (WatchAppDelegate)
  static let shared = WatchSync()

  // changes each time synced data is saved: the views reload when it changes
  @Published private(set) var lastSyncDate: Date? = nil

  private let session = WCSession.default
  // background tasks waiting for the pending data to be delivered
  private var pendingTasks: [WKWatchConnectivityRefreshBackgroundTask] = []
  private var observations: [NSKeyValueObservation] = []

  func activate() {
    guard WCSession.isSupported(), session.delegate == nil else {
      return
    }
    session.delegate = self
    observations = [
      session.observe(\.activationState) { [weak self] _, _ in self?.completeTasksIfPossible() },
      session.observe(\.hasContentPending) { [weak self] _, _ in self?.completeTasksIfPossible() },
    ]
    session.activate()
  }

  // the system wakes the app in background to deliver the data sent by the iPhone
  func handle(_ task: WKWatchConnectivityRefreshBackgroundTask) {
    DispatchQueue.main.async {
      self.pendingTasks.append(task)
      self.activate()
      self.completeTasksIfPossible()
    }
  }

  private func completeTasksIfPossible() {
    DispatchQueue.main.async {
      guard !self.pendingTasks.isEmpty,
            self.session.activationState == .activated,
            !self.session.hasContentPending
      else {
        return
      }
      self.pendingTasks.forEach { $0.setTaskCompletedWithSnapshot(false) }
      self.pendingTasks.removeAll()
    }
  }

  // MARK: WCSessionDelegate

  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    // data synced while the watch app was closed
    if activationState == .activated && !session.receivedApplicationContext.isEmpty {
      handleSyncPayload(session.receivedApplicationContext)
    }
  }

  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    handleSyncPayload(applicationContext)
  }

  // kept for iPhones still sending the data with sendMessage
  func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
    handleSyncPayload(message)
    replyHandler([:])
  }

  // MARK: Payload

  private func handleSyncPayload(_ payload: [String: Any]) {
    saveCookies(payload["cookieValue"] as? String)
    savePasswords(payload["passwords"] as? String)
    let preferencesChanged = savePreferences(payload["appPreferences"] as? String)
    let accountChanged = saveAccount(payload["message"] as? String)

    if preferencesChanged || accountChanged {
      WidgetCenter.shared.reloadAllTimelines()
      DispatchQueue.main.async {
        self.lastSyncDate = Date()
      }
    }
  }

  // Renault group session cookies, by email
  private func saveCookies(_ json: String?) {
    guard let json = json,
          let cookieMap = try? JSONDecoder().decode(CookieMap.self, from: Data(json.utf8))
    else {
      return
    }
    for (email, entry) in cookieMap {
      guard let data = try? JSONEncoder().encode(entry),
            let value = String(data: data, encoding: .utf8) else { continue }
      Keychain.save(StorageKey.cookieValue(email: email), value: value)
    }
  }

  // passwords (hyundai only) by vin. A missing key never removes a password already saved
  private func savePasswords(_ json: String?) {
    guard let json = json,
          let passwords = try? JSONDecoder().decode([String: String].self, from: Data(json.utf8))
    else {
      return
    }
    for (vin, password) in passwords where !password.isEmpty {
      Keychain.save(StorageKey.password(vin: vin), value: password)
    }
  }

  // true when the preferences changed
  private func savePreferences(_ json: String?) -> Bool {
    guard let json = json else { return false }
    guard let received = try? JSONDecoder().decode(AppPreferences.self, from: Data(json.utf8)) else {
      print("impossible de décoder les app preferences")
      return false
    }
    guard SharedStore.loadPreferences() != received else { return false }
    return SharedStore.savePreferences(received)
  }

  // true when the account changed. It is received without passwords:
  // it replaces the one saved by older versions with passwords
  private func saveAccount(_ json: String?) -> Bool {
    guard let json = json,
          let received = try? JSONDecoder().decode(UserAccount.self, from: Data(json.utf8))
    else {
      return false
    }
    guard SharedStore.loadAccount() != received else { return false }
    return SharedStore.saveAccount(received)
  }
}
