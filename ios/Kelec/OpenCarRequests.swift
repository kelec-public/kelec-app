//
//  OpenCarRequests.swift
//  Kelec
//
//  RN bridge (src/packages/kelec-car-shortcuts): the car to show, asked by Spotlight, a Quick Action or a widget.
//  The request waits until the RN app reads it (it may not be started yet), and an event tells it a request arrived.
//

import Foundation
import React

@objc(OpenCarRequests)
final class OpenCarRequests: RCTEventEmitter {
  private static let event = "openCarRequested"

  // main queue only
  private static var pendingVin: String?
  private static weak var listening: OpenCarRequests?

  static func request(vin: String) {
    DispatchQueue.main.async {
      pendingVin = vin
      listening?.sendEvent(withName: event, body: nil)
    }
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func supportedEvents() -> [String]! {
    [Self.event]
  }

  override func startObserving() {
    DispatchQueue.main.async { Self.listening = self }
  }

  override func stopObserving() {
    DispatchQueue.main.async {
      if Self.listening === self { Self.listening = nil }
    }
  }

  // the VIN of the last request, null when there is none; a request is only read once
  @objc(consume:rejecter:)
  func consume(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let vin = Self.pendingVin
      Self.pendingVin = nil
      resolve(vin)
    }
  }
}
