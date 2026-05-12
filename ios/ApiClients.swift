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
  case "renault":
    let gigyaApiKey = envVar("GIGYA_API_KEY")
    let kamareonApiKey = envVar("KAMEREON_API_KEY")
    return RenaultApiClient(
      username: usercar.getEmail(),
      password: usercar.getPassword(),
      kamereonAccountId: usercar.kamereonAccountID ?? "",
      gigyaApiKey: gigyaApiKey,
      kamareonApiKey: kamareonApiKey
  )
  case "hyundai":
    return HyundaiApiClient(email: usercar.getEmail(), password: usercar.getPassword(), pin: usercar.pinCode ?? "")
  default:
    return DemoApiClient()
  }
}


