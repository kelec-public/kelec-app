//
//  KelecWatchOsApp.swift
//  KelecWatchOs Watch App
//
//  Created by Kelyan Pegeot-Selme on 28/06/2024.
//

import SwiftUI
import WatchKit
import WidgetKit

@main
struct KelecWatchOs_Watch_AppApp: App {
    @WKApplicationDelegateAdaptor private var appDelegate: WatchAppDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

final class WatchAppDelegate: NSObject, WKApplicationDelegate {
    func applicationDidFinishLaunching() {
        WatchSync.shared.activate()
        // the widgets offered per car may have been computed before the account was synced
        WidgetCenter.shared.invalidateConfigurationRecommendations()
    }

    // the app can be woken in background to receive the data synced by the iPhone
    func handle(_ backgroundTasks: Set<WKRefreshBackgroundTask>) {
        for task in backgroundTasks {
            if let syncTask = task as? WKWatchConnectivityRefreshBackgroundTask {
                WatchSync.shared.handle(syncTask)
            } else {
                task.setTaskCompletedWithSnapshot(false)
            }
        }
    }
}
