//
//  CarMakerClient.swift
//  Kelec
//
//  Created by Kelyan PEGEOT SELME on 12/05/2026.
//

import Foundation
import renaultApi
import Security

func envVar(_ key: String) -> String {
  return Bundle.main.object(forInfoDictionaryKey: key) as? String ?? ""
}

private struct TokenRefreshLock {
    private let fd: Int32
    static func acquire() -> TokenRefreshLock? {
        guard let groupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.kelyanselme.MyRenaultPlus") else { return nil }
        let lockURL = groupURL.appendingPathComponent("token_refresh.lock")
        if !FileManager.default.fileExists(atPath: lockURL.path) {
            FileManager.default.createFile(atPath: lockURL.path, contents: nil)
        }
        let fd = open(lockURL.path, O_RDWR)
        guard fd != -1 else { return nil }
        flock(fd, LOCK_EX)
        return TokenRefreshLock(fd: fd)
    }
    func release() { flock(fd, LOCK_UN); close(fd) }
}

public struct OidcTokens: Codable {
    let access_token: String
    let refresh_token: String
    let id_token: String?
    let expires_in: Int?
    let token_type: String?
    var email: String?
    var personId: String?
}

private let keychainAppGroup = "group.kelyanselme.MyRenaultPlus"

private func readTokensFromKeychain(email: String) -> OidcTokens? {
    let key = "\(email)_tokens"
    let query: [String: Any] = [
        kSecClass as String:           kSecClassGenericPassword,
        kSecAttrAccount as String:     key,
        kSecAttrAccessGroup as String: keychainAppGroup,
        kSecReturnData as String:      true,
        kSecMatchLimit as String:      kSecMatchLimitOne
    ]
    var item: CFTypeRef?
    guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
          let data = item as? Data,
          let tokens = try? JSONDecoder().decode(OidcTokens.self, from: data) else { return nil }
    return tokens
}

private func saveTokensToKeychain(email: String, tokens: OidcTokens) {
    guard let data = try? JSONEncoder().encode(tokens) else { return }
    let key = "\(email)_tokens"
    let deleteQuery: [String: Any] = [
        kSecClass as String:           kSecClassGenericPassword,
        kSecAttrAccount as String:     key,
        kSecAttrAccessGroup as String: keychainAppGroup
    ]
    SecItemDelete(deleteQuery as CFDictionary)
    let insertQuery: [String: Any] = [
        kSecClass as String:           kSecClassGenericPassword,
        kSecAttrAccount as String:     key,
        kSecAttrAccessGroup as String: keychainAppGroup,
        kSecAttrAccessible as String:  kSecAttrAccessibleAfterFirstUnlock,
        kSecValueData as String:       data
    ]
    SecItemAdd(insertQuery as CFDictionary, nil)
}

private func isTokenExpired(_ accessToken: String) -> Bool {
    let parts = accessToken.split(separator: ".")
    guard parts.count >= 2 else { return true }
    var payload = String(parts[1])
        .replacingOccurrences(of: "-", with: "+")
        .replacingOccurrences(of: "_", with: "/")
    let pad = (4 - payload.count % 4) % 4
    payload += String(repeating: "=", count: pad)
    guard let data = Data(base64Encoded: payload),
          let claims = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          let exp = claims["exp"] as? TimeInterval else { return true }
    return exp < Date().timeIntervalSince1970 + 30
}

private func refreshOidcTokens(tokens: OidcTokens) async -> OidcTokens? {
    let endpoint = envVar("OIDC_ENDPOINT_TOKEN")
    let clientId = envVar("OIDC_CLIENT_ID")
    let redirectUri = envVar("OIDC_REDIRECT_URI")
    guard !endpoint.isEmpty, let url = URL(string: endpoint) else { return nil }

    let body = "grant_type=refresh_token&refresh_token=\(tokens.refresh_token)&client_id=\(clientId)&redirect_uri=\(redirectUri)&scope=openid%20email%20personId%20lang%20renaultGroupFull"
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
    request.httpBody = body.data(using: .utf8)

    guard let (data, response) = try? await URLSession.shared.data(for: request),
          (response as? HTTPURLResponse)?.statusCode == 200,
          var newTokens = try? JSONDecoder().decode(OidcTokens.self, from: data) else { return nil }

    newTokens.email = tokens.email
    newTokens.personId = tokens.personId
    return newTokens
}

public func getValidToken(email: String) async -> OidcTokens? {
    guard let tokens = readTokensFromKeychain(email: email) else { return nil }

    if !isTokenExpired(tokens.access_token) { return tokens }

    let lock = TokenRefreshLock.acquire()
    defer { lock?.release() }

    // Double-check après acquisition du lock
    if let fresh = readTokensFromKeychain(email: email), !isTokenExpired(fresh.access_token) {
        return fresh
    }

    guard let refreshed = await refreshOidcTokens(tokens: tokens) else { return nil }
    saveTokensToKeychain(email: email, tokens: refreshed)
    return refreshed
}

func getRteClient() -> rteApi {
  return rteApi(basicAuth: envVar("RTE_BASIC_AUTH"))
}

public func getCarMakerApiClient(usercar: UserCar) -> ApiClient{
  switch (usercar.getCarMaker()){
  case "renault", "dacia", "alpine":
    let kamareonApiKey = envVar("KAMEREON_API_KEY")
    return RenaultApiClient(
      username: usercar.getEmail(),
      password: usercar.getPassword(),
      kamereonAccountId: usercar.kamereonAccountID ?? "",
      kamareonApiKey: kamareonApiKey
  )
  case "hyundai":
    return HyundaiApiClient(email: usercar.getEmail(), password: usercar.getPassword(), pin: usercar.pinCode ?? "")
  default:
    return DemoApiClient()
  }
}


