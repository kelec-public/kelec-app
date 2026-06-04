//
//  storageHandler.swift
//  Kelec
//
//  Created by Kelyan PEGEOT SELME on 04/06/2026.
//

import Foundation


public struct GigyaTokenFunctionResponse: Codable {
  public var canLogin: Bool
  public var cookieValue: String
}

public typealias CookieMap = [String: GigyaTokenFunctionResponse]

public func getCryptedCookieValue(email: String)->GigyaTokenFunctionResponse? {
  do {
    let rawCookieValue = try getPasswordFromKeychain(key: "cookieValue_\(email)")
    
    guard let data = rawCookieValue.data(using: .utf8) else {
      return nil
    }
    
    let decoder = JSONDecoder()
    return try decoder.decode(GigyaTokenFunctionResponse.self, from: data)
    
  } catch {
    return nil
  }
}
