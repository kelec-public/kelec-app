//
//  RenaultSession.swift
//  Kelec
//
//  Renault group session cookies, saved in the keychain by the RN app (and by the watch sync).
//

import Foundation

public struct GigyaTokenFunctionResponse: Codable {
  public var canLogin: Bool
  public var cookieValue: String
}

public typealias CookieMap = [String: GigyaTokenFunctionResponse]

public func getCryptedCookieValue(email: String)->GigyaTokenFunctionResponse? {
  guard let rawCookieValue = Keychain.read(StorageKey.cookieValue(email: email)) else {
    return nil
  }
  return try? JSONDecoder().decode(GigyaTokenFunctionResponse.self, from: Data(rawCookieValue.utf8))
}
