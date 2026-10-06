//
//  Keychain.swift
//  Kelec
//
//  Same attributes as the RN bridge (RNSharedWidget.m): items written by one side are read by the other.
//

import Foundation
import Security

enum Keychain {
  // nil when the item is missing or empty
  static func read(_ key: String) -> String? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: key,
      kSecAttrAccessGroup as String: AppGroup.id,
      kSecMatchLimit as String: kSecMatchLimitOne,
      kSecReturnData as String: true,
    ]

    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    guard status == errSecSuccess,
          let data = item as? Data,
          let value = String(data: data, encoding: .utf8),
          !value.isEmpty
    else {
      if status != errSecItemNotFound {
        print("Failed to retrieve data from Keychain. Error: \(status)")
      }
      return nil
    }
    return value
  }

  @discardableResult
  static func save(_ key: String, value: String) -> Bool {
    guard let data = value.data(using: .utf8) else { return false }

    delete(key)

    let addQuery: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: key,
      kSecAttrAccessGroup as String: AppGroup.id,
      kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
      kSecValueData as String: data,
    ]
    return SecItemAdd(addQuery as CFDictionary, nil) == errSecSuccess
  }

  // true when the item is deleted or was already missing
  @discardableResult
  static func delete(_ key: String) -> Bool {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: key,
      kSecAttrAccessGroup as String: AppGroup.id,
    ]
    let status = SecItemDelete(query as CFDictionary)
    return status == errSecSuccess || status == errSecItemNotFound
  }
}
