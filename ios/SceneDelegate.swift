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
  }
}
