package com.kelec.wear.ui

import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.rotary.onRotaryScrollEvent
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.ButtonDefaults
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.CircularProgressIndicator
import androidx.wear.compose.material.CompactButton
import androidx.wear.compose.material.Icon
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text
import androidx.wear.compose.material.dialog.Alert
import androidx.wear.compose.material.dialog.Dialog
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.MapUiSettings
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import com.kelec.carapi.HvacTemperature
import com.kelec.shared.UserCar
import com.kelec.wear.R
import com.kelec.wear.vehicleCommands
import kotlin.math.abs

/**
 * Confirmation du confort thermique avec la température (- / + comme l'app RN, ou la couronne / le lunette rotative),
 * pendant de `HVACConfirmView` sur l'Apple Watch.
 */
@Composable
fun HvacConfirmDialog(
    show: Boolean,
    temperature: Int,
    onTemperatureChange: (Int) -> Unit,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit,
) {
    Dialog(showDialog = show, onDismissRequest = onDismiss) {
        val focusRequester = remember { FocusRequester() }
        // défilement accumulé de la couronne : un cran de température tous les ROTARY_STEP pixels
        var rotaryDelta by remember { mutableFloatStateOf(0f) }
        LaunchedEffect(Unit) { focusRequester.requestFocus() }

        fun step(by: Int) {
            onTemperatureChange((temperature + by).coerceIn(HvacTemperature.MIN, HvacTemperature.MAX))
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
                .onRotaryScrollEvent {
                    rotaryDelta += it.verticalScrollPixels
                    if (abs(rotaryDelta) >= ROTARY_STEP) {
                        step(if (rotaryDelta > 0) 1 else -1)
                        rotaryDelta = 0f
                    }
                    true
                }
                .focusRequester(focusRequester)
                .focusable(),
            verticalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterVertically),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(text = stringResource(R.string.launch_pre_heat), fontWeight = FontWeight.Bold, textAlign = TextAlign.Center, fontSize = 14.sp)
            Text(
                text = stringResource(R.string.are_you_sure_launch_pre_heating),
                color = WearColors.secondary,
                textAlign = TextAlign.Center,
                fontSize = 11.sp,
            )
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                CompactButton(onClick = { step(-1) }, colors = ButtonDefaults.secondaryButtonColors()) {
                    Icon(painter = painterResource(R.drawable.ic_remove), contentDescription = null, modifier = Modifier.size(18.dp))
                }
                Text(
                    text = HvacTemperature.label(temperature),
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = temperatureColour(temperature),
                )
                CompactButton(onClick = { step(1) }, colors = ButtonDefaults.secondaryButtonColors()) {
                    Icon(painter = painterResource(R.drawable.ic_add), contentDescription = null, modifier = Modifier.size(18.dp))
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(onClick = onDismiss, colors = ButtonDefaults.secondaryButtonColors()) {
                    Icon(painter = painterResource(R.drawable.ic_close), contentDescription = stringResource(R.string.cancel))
                }
                Button(onClick = onConfirm) {
                    Icon(painter = painterResource(R.drawable.ic_check), contentDescription = stringResource(R.string.confirm))
                }
            }
        }
    }
}

private const val ROTARY_STEP = 40f

/** LOW en bleu, HIGH en rouge, comme l'app RN. */
@Composable
private fun temperatureColour(temperature: Int): Color = when (temperature) {
    HvacTemperature.MIN -> WearColors.low
    HvacTemperature.MAX -> WearColors.high
    else -> MaterialTheme.colors.onSurface
}

/** Résultat du confort thermique : null = pas de dialogue. */
@Composable
fun HvacResultDialog(result: Boolean?, onDismiss: () -> Unit) {
    Dialog(showDialog = result != null, onDismissRequest = onDismiss) {
        val sent = result == true
        Alert(
            title = { Text(stringResource(if (sent) R.string.information_sent else R.string.error), textAlign = TextAlign.Center) },
            message = {
                Text(stringResource(if (sent) R.string.pre_heat_launched else R.string.command_send_error), textAlign = TextAlign.Center)
            },
        ) {
            item {
                Chip(onClick = onDismiss, label = { Text("OK") })
            }
        }
    }
}

private sealed interface LocationState {
    data object Loading : LocationState
    data object Failed : LocationState
    data class Loaded(val position: LatLng) : LocationState
}

/** Position de la voiture sur une carte (pendant de `MapView` sur l'Apple Watch). */
@Composable
fun CarMapDialog(show: Boolean, car: UserCar, onDismiss: () -> Unit) {
    Dialog(showDialog = show, onDismissRequest = onDismiss) {
        val context = LocalContext.current
        var state by remember { mutableStateOf<LocationState>(LocationState.Loading) }
        LaunchedEffect(car.vin) {
            val location = vehicleCommands(context).location(car)
            val latitude = location?.gpsLatitude
            val longitude = location?.gpsLongitude
            state = if (latitude != null && longitude != null) LocationState.Loaded(LatLng(latitude, longitude)) else LocationState.Failed
        }

        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            when (val current = state) {
                LocationState.Loading -> CircularProgressIndicator()
                LocationState.Failed -> Text(
                    text = stringResource(R.string.watch_car_location_error),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(20.dp),
                )
                is LocationState.Loaded -> {
                    val camera = rememberCameraPositionState {
                        position = CameraPosition.fromLatLngZoom(current.position, MAP_ZOOM)
                    }
                    GoogleMap(
                        modifier = Modifier.fillMaxSize(),
                        cameraPositionState = camera,
                        // le glissement horizontal ferme la carte (comme les autres dialogues de la montre)
                        uiSettings = MapUiSettings(zoomControlsEnabled = false, scrollGesturesEnabled = false, mapToolbarEnabled = false),
                    ) {
                        Marker(state = MarkerState(position = current.position), title = car.model)
                    }
                }
            }
        }
    }
}

/** Zoom proche de celui de l'Apple Watch (environ 250 m autour de la voiture). */
private const val MAP_ZOOM = 17f
