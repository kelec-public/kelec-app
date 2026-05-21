//
//  KeleciOSWidgetBundle.swift
//  KeleciOSWidget
//
//  Created by Kelyan Pegeot-Selme on 18/03/2024.
//
import WidgetKit
import SwiftUI

@main
struct KeleciOSWidgetBundle: WidgetBundle {
  var body: some Widget {
    KeleciOSWidget()
    KeleciOSWidget2()
    KelecLockScreenWidget()
    KelecLockScreenWidgetAlternative()
    KeleciOSTempoWidget()
    KeleciOSTempo2DaysWidget()
    iosTempoLockScreen()
    //KeleciOSWidgetLiveActivity()
  }
}
