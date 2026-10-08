package com.kelec.wear.ui

import android.graphics.BitmapFactory
import androidx.annotation.DrawableRes
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.Icon
import androidx.wear.compose.material.Text
import com.kelec.carapi.BatteryStatus
import com.kelec.shared.CarMaker
import com.kelec.shared.UserCar
import com.kelec.wear.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URL

/** Couleurs de l'app de la montre (celles de l'Apple Watch). */
object WearColors {
    val secondary = Color.Gray
    val track = Color(0xFF3A3A3C)
    val charging = Color(0xFF27CD41)
    val notCharging = Color(0xFF007AFF)
    val low = Color(0xFF007AFF)
    val high = Color(0xFFFF3B30)
}

@DrawableRes
fun logoFor(maker: CarMaker): Int = when (maker) {
    CarMaker.ALPINE -> R.drawable.alpine_logo
    CarMaker.DACIA -> R.drawable.dacia_logo
    else -> R.drawable.renault_logo
}

/** Jauge de batterie : verte si branchée, bleue sinon. */
@Composable
fun BatteryBar(battery: BatteryStatus, modifier: Modifier = Modifier) {
    val level = (battery.batteryLevel ?: 0).coerceIn(0, 100)
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(10.dp)
            .clip(RoundedCornerShape(5.dp))
            .background(WearColors.track)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(level / 100f)
                .fillMaxHeight()
                .clip(RoundedCornerShape(5.dp))
                .background(if (battery.isPlugged) WearColors.charging else WearColors.notCharging)
        )
    }
}

/** Image de la voiture chez le constructeur (`imageUrl`), sinon le logo du constructeur. */
@Composable
fun CarImage(car: UserCar, modifier: Modifier = Modifier) {
    var image by remember(car.imageUrl) { mutableStateOf(CarImages.cached(car.imageUrl)) }
    LaunchedEffect(car.imageUrl) {
        if (image == null) image = CarImages.load(car.imageUrl)
    }
    val loaded = image
    if (loaded != null) {
        Image(bitmap = loaded, contentDescription = car.model, modifier = modifier, contentScale = ContentScale.Fit)
    } else {
        Image(painter = painterResource(logoFor(car.maker)), contentDescription = car.model, modifier = modifier, contentScale = ContentScale.Fit)
    }
}

/** Images des voitures téléchargées, gardées en mémoire le temps de l'app. */
private object CarImages {
    private const val MAX_WIDTH = 300
    private val cache = mutableMapOf<String, ImageBitmap>()

    fun cached(url: String): ImageBitmap? = cache[url]

    suspend fun load(url: String): ImageBitmap? {
        if (url.isEmpty()) return null
        return withContext(Dispatchers.IO) {
            try {
                val bytes = URL(url).openStream().use { it.readBytes() }
                val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
                var sampleSize = 1
                while (bounds.outWidth / (sampleSize * 2) >= MAX_WIDTH) sampleSize *= 2
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size, BitmapFactory.Options().apply { inSampleSize = sampleSize })
                    ?.asImageBitmap()
                    ?.also { cache[url] = it }
            } catch (e: Exception) {
                null
            }
        }
    }
}

@Composable
fun IconLabelButton(@DrawableRes icon: Int, label: String, onClick: () -> Unit) {
    Chip(
        onClick = onClick,
        label = { Text(label) },
        icon = { Icon(painter = painterResource(icon), contentDescription = null, modifier = Modifier.size(ChipDefaults.IconSize)) },
        colors = ChipDefaults.secondaryChipColors(),
    )
}
