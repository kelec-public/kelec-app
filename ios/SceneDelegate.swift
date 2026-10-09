//
//  SceneDelegate.swift
//  Kelec
//
//  Created by Kelyan PEGEOT SELME on 24/09/2026.
//

import Foundation
import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window

    appDelegate.reactNativeFactory?.startReactNative(
      withModuleName: "Kelec",
      in: window,
      launchOptions: nil
    )

    // app launched from Spotlight, a Quick Action or a widget: the car is shown once the RN app is loaded
    connectionOptions.urlContexts.forEach { CarShortcuts.open($0.url) }
    connectionOptions.userActivities.forEach { CarShortcuts.open($0) }
    if let shortcutItem = connectionOptions.shortcutItem {
      CarShortcuts.open(shortcutItem)
    }
  }

  // MARK: App already running

  // widget
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    URLContexts.forEach { CarShortcuts.open($0.url) }
  }

  // Spotlight
  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    CarShortcuts.open(userActivity)
  }

  // Quick Action
  func windowScene(
    _ windowScene: UIWindowScene,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    completionHandler(CarShortcuts.open(shortcutItem))
  }
}
