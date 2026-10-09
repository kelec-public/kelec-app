package com.kelec.shortcuts

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import com.kelec.MainActivity
import com.kelec.R
import com.kelec.shared.SharedStore

/**
 * Un raccourci par voiture (appui long sur l'icône, épinglable sur l'écran d'accueil). Comme le tap sur un widget,
 * il ouvre l'app sur la page de sa voiture avec le lien `kelec://car/<vin>` (même lien que sur iOS).
 */
object CarShortcuts {
    private const val SCHEME = "kelec"
    private const val HOST = "car"

    fun uri(vin: String): Uri = Uri.Builder().scheme(SCHEME).authority(HOST).appendPath(vin).build()

    /** Intent explicite : la donnée ne sert qu'à distinguer les voitures (PendingIntent des widgets). */
    fun openIntent(context: Context, vin: String): Intent =
        Intent(Intent.ACTION_VIEW, uri(vin), context, MainActivity::class.java)

    /** null si l'intent n'ouvre pas une voiture. */
    fun vinFrom(intent: Intent?): String? {
        val data = intent?.data ?: return null
        if (data.scheme != SCHEME || data.host != HOST) return null
        return data.lastPathSegment?.takeIf { it.isNotEmpty() }
    }

    /** Les voitures du compte partagé (aucune si déconnecté) : au lancement et quand l'app RN enregistre le compte. */
    fun update(context: Context) {
        val cars = SharedStore(context).loadAccount()?.cars.orEmpty().filter { it.vin.isNotEmpty() }
        val shortcuts = cars
            .take(ShortcutManagerCompat.getMaxShortcutCountPerActivity(context))
            .mapIndexed { rank, car ->
                ShortcutInfoCompat.Builder(context, shortcutId(car.vin))
                    .setShortLabel(car.model.ifEmpty { car.vin })
                    .setIcon(IconCompat.createWithResource(context, R.drawable.ic_shortcut_car))
                    .setIntent(openIntent(context, car.vin))
                    .setRank(rank)
                    .build()
            }
        ShortcutManagerCompat.setDynamicShortcuts(context, shortcuts)

        // un raccourci épinglé ne peut pas être supprimé : celui d'une voiture retirée est désactivé
        val current = shortcuts.map { it.id }.toSet()
        val removed = ShortcutManagerCompat.getShortcuts(context, ShortcutManagerCompat.FLAG_MATCH_PINNED)
            .map { it.id }
            .filter { it !in current }
        if (removed.isNotEmpty()) ShortcutManagerCompat.disableShortcuts(context, removed, null)
    }

    private fun shortcutId(vin: String) = "car_$vin"
}
