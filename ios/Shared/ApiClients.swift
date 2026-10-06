//
//  ApiClients.swift
//  Kelec
//
//  Created by Kelyan PEGEOT SELME on 12/05/2026.
//

import Foundation
import renaultApi

func envVar(_ key: String) -> String {
  return Bundle.main.object(forInfoDictionaryKey: key) as? String ?? ""
}

func getRteClient() -> rteApi {
  return rteApi(basicAuth: envVar("RTE_BASIC_AUTH"))
}

// the password is stored in the keychain under "<vin>_password".
// the password in the account JSON is only a fallback for watches synced before passwords were moved to the keychain
func getCarPassword(usercar: UserCar) -> String {
  return Keychain.read(StorageKey.password(vin: usercar.car?.vin ?? "")) ?? usercar.getPassword()
}

public func getCarMakerApiClient(usercar: UserCar) -> ApiClient{
  let password = getCarPassword(usercar: usercar)
  switch usercar.maker {
  case .RENAULT, .DACIA, .ALPINE:
    let gigyaApiKey = envVar("GIGYA_API_KEY")
    let kamareonApiKey = envVar("KAMEREON_API_KEY")
    
    var apiClient = RenaultApiClient(
      username: usercar.getEmail(),
      password: password,
      kamereonAccountId: usercar.kamereonAccountID ?? "",
      gigyaApiKey: gigyaApiKey,
      kamareonApiKey: kamareonApiKey,
      logger: { writeWidgetLog(message: $0) }
    )
      
    // try to get cookie value from keychain
      if let cookieValueFromKeychain = getCryptedCookieValue(email: usercar.getEmail()) {
        apiClient.setCookieValue(cookieValue: cookieValueFromKeychain.cookieValue)
        writeWidgetLog(message: "Crypted cookie value loaded")
      }
    return apiClient
  case .HYUNDAI:
    return HyundaiApiClient(email: usercar.getEmail(), password: password, pin: usercar.pinCode ?? "")
  case .DEMO:
    return DemoApiClient()
  }
}

// sends the pre-heating command, false when it could not be sent
func sendHVACCommand(userCar: UserCar) async -> Bool {
  let client = getCarMakerApiClient(usercar: userCar)
  return (try? await client.launchHvac(vin: userCar.car?.vin ?? "")) ?? false
}
