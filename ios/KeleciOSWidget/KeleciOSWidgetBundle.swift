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
    KeleciOSWidgetAlternative()
    KelecLockScreenWidget()
    KelecLockScreenWidgetAlternative()
    KeleciOSTempoWidget()
    KeleciOSTempo2DaysWidget()
    TempoLockScreenWidget()
  }
}
