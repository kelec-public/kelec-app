//
//  CarMakerClient.swift
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

public func getCarMakerApiClient(usercar: UserCar) -> ApiClient{
  switch (usercar.getCarMaker()){
  case "renault", "dacia", "alpine":
    let gigyaApiKey = envVar("GIGYA_API_KEY")
    let kamareonApiKey = envVar("KAMEREON_API_KEY")
    
    var apiClient = RenaultApiClient(
      username: usercar.getEmail(),
      password: usercar.getPassword(),
      kamereonAccountId: usercar.kamereonAccountID ?? "",
      gigyaApiKey: gigyaApiKey,
      kamareonApiKey: kamareonApiKey
    )
      
    // try to get cookie value from keychain
      if let cookieValueFromKeychain = getCryptedCookieValue(email: usercar.getEmail()) {
        apiClient.setCookieValue(cookieValue: cookieValueFromKeychain.cookieValue)
        writeWidgetLog(message: "Crypted cookie value loaded")
      }
    return apiClient
  case "hyundai":
    return HyundaiApiClient(email: usercar.getEmail(), password: usercar.getPassword(), pin: usercar.pinCode ?? "")
  default:
    return DemoApiClient()
  }
}


