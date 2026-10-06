package com.kelec

import com.kelec.carapi.RenaultApiKeys

/** Clés d'API lues dans le `.env` (react-native-config), passées aux clients de :carapi. */
object ApiKeys {
    val renault = RenaultApiKeys(
        gigyaApiKey = BuildConfig.GIGYA_API_KEY,
        kamereonApiKey = BuildConfig.KAMEREON_API_KEY,
    )
}
