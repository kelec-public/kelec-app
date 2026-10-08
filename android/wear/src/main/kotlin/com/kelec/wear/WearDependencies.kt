package com.kelec.wear

import android.content.Context
import com.kelec.carapi.RenaultApiKeys
import com.kelec.shared.SharedStore
import com.kelec.shared.UserAccount
import com.kelec.shared.UserCar
import com.kelec.shared.VehicleCommands
import com.kelec.shared.VehicleLoader

/** Clés d'API lues dans le `.env` (react-native-config), comme dans l'app du téléphone. */
object ApiKeys {
    val renault = RenaultApiKeys(
        gigyaApiKey = BuildConfig.GIGYA_API_KEY,
        kamereonApiKey = BuildConfig.KAMEREON_API_KEY,
    )
}

fun vehicleLoader(context: Context) = VehicleLoader(context, ApiKeys.renault)

fun vehicleCommands(context: Context) = VehicleCommands(context, ApiKeys.renault)

/** Voiture des complications : celle choisie dans les Réglages de l'app de la montre, sinon la première (comme `watchCar`). */
fun watchCar(account: UserAccount, store: SharedStore): UserCar? = account.carFor(store.watchWidgetVin())
