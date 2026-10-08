package com.kelec.widgets

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import androidx.annotation.StringRes
import com.kelec.ApiKeys
import com.kelec.carapi.BatteryStatus
import com.kelec.carapi.Tempo
import com.kelec.shared.AppPreferences
import com.kelec.shared.SharedStore
import com.kelec.shared.StorageKey
import com.kelec.shared.TempoLoader
import com.kelec.shared.UserCar
import com.kelec.shared.VehicleLoader
import com.kelec.shared.VehicleStatus
import com.kelec.shared.R as SharedR

/** Ce qu'affiche un widget de voiture : un message (pas connecté, erreur…) ou la voiture chargée. */
sealed interface CarWidgetState {
    data class Message(val text: String) : CarWidgetState

    data class Loaded(
        val car: UserCar,
        val battery: BatteryStatus,
        val prefs: AppPreferences,
        val image: Bitmap?,
    ) : CarWidgetState
}

/**
 * Données des widgets, lues **sans réseau** (le réseau n'est appelé que par [WidgetRefreshWorker], qui enregistre
 * le statut avant de redessiner les widgets) : même résultat que le dernier chargement, cache compris.
 */
object WidgetData {
    /** Largeur maximale de l'image de la voiture : les RemoteViews ont une limite de mémoire pour les bitmaps. */
    private const val MAX_IMAGE_WIDTH = 400

    fun carState(
        context: Context,
        appWidgetId: Int,
        @StringRes serverError: Int = SharedR.string.widget_server_error,
    ): CarWidgetState {
        val store = SharedStore(context)
        val account = store.loadAccount()
            ?: return CarWidgetState.Message(context.getString(SharedR.string.not_yet_logged_in))
        val car = account.carFor(store.widgetVin(appWidgetId))
            ?: return CarWidgetState.Message(context.getString(SharedR.string.no_car_added))

        return when (val status = VehicleLoader(context, ApiKeys.renault).cached(car)) {
            is VehicleStatus.Loaded -> CarWidgetState.Loaded(
                car = car,
                battery = status.battery,
                prefs = store.loadPreferences() ?: AppPreferences(),
                image = carImage(store, car.vin),
            )
            VehicleStatus.NotLoggedIn -> CarWidgetState.Message(context.getString(SharedR.string.not_yet_logged_in))
            VehicleStatus.Unavailable -> CarWidgetState.Message(context.getString(serverError))
        }
    }

    fun tempo(context: Context): Tempo? = TempoLoader(context, ApiKeys.rteBasicAuth).cached()

    /** Image base64 enregistrée par l'app RN, réduite pour le widget ; null si absente ou illisible. */
    private fun carImage(store: SharedStore, vin: String): Bitmap? = try {
        store.getString(StorageKey.carImage(vin))
            ?.takeIf { it.isNotEmpty() }
            ?.substringAfter("base64,")
            ?.let { Base64.decode(it, Base64.DEFAULT) }
            ?.let { decodeScaled(it) }
    } catch (e: Exception) {
        null
    }

    private fun decodeScaled(bytes: ByteArray): Bitmap? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
        var sampleSize = 1
        while (bounds.outWidth / (sampleSize * 2) >= MAX_IMAGE_WIDTH) sampleSize *= 2
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.size, BitmapFactory.Options().apply { inSampleSize = sampleSize })
    }
}
