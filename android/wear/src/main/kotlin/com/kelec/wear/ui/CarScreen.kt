package com.kelec.wear.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.CircularProgressIndicator
import androidx.wear.compose.material.CompactButton
import androidx.wear.compose.material.ButtonDefaults
import androidx.wear.compose.material.Icon
import androidx.wear.compose.material.Text
import com.kelec.carapi.BatteryStatus
import com.kelec.carapi.HvacTemperature
import com.kelec.shared.AppPreferences
import com.kelec.shared.Formatting
import com.kelec.shared.SharedStore
import com.kelec.shared.UserCar
import com.kelec.shared.VehicleStatus
import com.kelec.shared.label
import com.kelec.wear.R
import com.kelec.wear.complication.BatteryComplicationService
import com.kelec.wear.vehicleCommands
import com.kelec.wear.vehicleLoader
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.temporal.ChronoUnit

/**
 * Page d'une voiture (pendant de `CarView` + `BatteryCardView` sur l'Apple Watch) : le cache s'affiche tout de suite,
 * puis le statut chargé. Boutons : confort thermique, rafraîchir, carte.
 */
@Composable
fun CarScreen(car: UserCar, lastSync: Long) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val store = remember { SharedStore(context) }

    var battery by remember(car.vin) { mutableStateOf<BatteryStatus?>(null) }
    // rien à afficher pour l'instant (pas de cache)
    var isLoading by remember(car.vin) { mutableStateOf(true) }
    // un chargement est en cours
    var isRefreshing by remember(car.vin) { mutableStateOf(false) }
    val prefs = remember(lastSync) { store.loadPreferences() ?: AppPreferences() }
    // dernière température choisie pour cette voiture, enregistrée à chaque changement (comme l'app RN)
    var temperature by remember(car.vin) { mutableStateOf(HvacTemperature.parse(store.savedTemperature(car.vin))) }

    var showHvacConfirm by remember { mutableStateOf(false) }
    var isLaunchingHvac by remember { mutableStateOf(false) }
    var hvacResult by remember { mutableStateOf<Boolean?>(null) }
    var showMap by remember { mutableStateOf(false) }

    suspend fun load() {
        isRefreshing = true
        val loader = vehicleLoader(context)
        (withContext(Dispatchers.IO) { loader.cached(car) } as? VehicleStatus.Loaded)?.let {
            battery = it.battery
            isLoading = false
        }
        battery = (loader.load(car) as? VehicleStatus.Loaded)?.battery
        isLoading = false
        isRefreshing = false
    }

    fun refresh() {
        scope.launch {
            load()
            BatteryComplicationService.requestUpdate(context)
        }
    }

    LaunchedEffect(car.vin, lastSync) { load() }

    Box(Modifier.fillMaxSize()) {
        val current = battery
        when {
            isLoading -> CircularProgressIndicator(Modifier.align(Alignment.Center))
            current == null -> ServerError(car, onRetry = ::refresh)
            else -> BatteryCard(
                car = car,
                battery = current,
                prefs = prefs,
                isLaunchingHvac = isLaunchingHvac,
                onHvac = { showHvacConfirm = true },
                onRefresh = ::refresh,
                onMap = { showMap = true },
            )
        }
        if (isRefreshing && !isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.align(Alignment.TopEnd).padding(top = 30.dp, end = 26.dp).size(16.dp),
                strokeWidth = 2.dp,
            )
        }
    }

    HvacConfirmDialog(
        show = showHvacConfirm,
        temperature = temperature,
        onTemperatureChange = {
            temperature = it
            store.saveTemperature(car.vin, it)
        },
        onDismiss = { showHvacConfirm = false },
        onConfirm = {
            showHvacConfirm = false
            isLaunchingHvac = true
            scope.launch {
                hvacResult = vehicleCommands(context).launchHvac(car, temperature)
                isLaunchingHvac = false
            }
        },
    )
    HvacResultDialog(result = hvacResult, onDismiss = { hvacResult = null })
    CarMapDialog(show = showMap, car = car, onDismiss = { showMap = false })
}

@Composable
private fun BatteryCard(
    car: UserCar,
    battery: BatteryStatus,
    prefs: AppPreferences,
    isLaunchingHvac: Boolean,
    onHvac: () -> Unit,
    onRefresh: () -> Unit,
    onMap: () -> Unit,
) {
    val context = LocalContext.current
    val level = battery.batteryLevel ?: 0
    val remaining = battery.chargingRemainingTime ?: 0
    // heure de fin : seulement si la voiture charge activement et que l'heure du statut est connue
    val endTime = Formatting.parseTimestamp(battery.timestamp)
        ?.takeIf { battery.chargingState.isActivelyCharging(level) }
        ?.plus(remaining.toLong(), ChronoUnit.MINUTES)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(top = 26.dp, bottom = 20.dp, start = 18.dp, end = 18.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Text(
            text = car.model,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center,
            fontSize = 13.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(text = "$level", fontSize = 24.sp, fontWeight = FontWeight.Bold)
            Text(text = "%", fontSize = 24.sp, color = WearColors.secondary)
            Spacer(Modifier.weight(1f))
            CarImage(car, Modifier.size(width = 80.dp, height = 40.dp))
        }
        BatteryBar(battery)
        Row {
            if (battery.isPlugged) {
                Text(text = battery.chargingState.label(context).removeSuffix(" | ") + " ", fontSize = 13.sp)
            }
            Text(text = Formatting.range(battery.batteryAutonomy ?: 0, prefs), fontSize = 13.sp, color = WearColors.secondary)
        }
        if (battery.isPlugged) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(painter = painterResource(R.drawable.ic_hourglass), contentDescription = null, modifier = Modifier.size(14.dp))
                Text(text = if (endTime != null) Formatting.duration(remaining) else "--h--", fontSize = 13.sp)
                if (endTime != null) {
                    Spacer(Modifier.width(6.dp))
                    Icon(
                        painter = painterResource(R.drawable.ic_battery_full),
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = WearColors.secondary,
                    )
                    Text(text = Formatting.localTime(endTime), fontSize = 13.sp, color = WearColors.secondary)
                }
            }
        }
        Row(
            modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
        ) {
            if (isLaunchingHvac) {
                CircularProgressIndicator(Modifier.size(ButtonDefaults.ExtraSmallButtonSize))
            } else {
                IconButton(R.drawable.ic_hvac, stringResource(R.string.launch_pre_heat), onHvac)
            }
            IconButton(R.drawable.ic_refresh, stringResource(R.string.refresh), onRefresh)
            IconButton(R.drawable.ic_map, null, onMap)
        }
    }
}

@Composable
private fun IconButton(icon: Int, description: String?, onClick: () -> Unit) {
    CompactButton(onClick = onClick, colors = ButtonDefaults.secondaryButtonColors()) {
        Icon(painter = painterResource(icon), contentDescription = description, modifier = Modifier.size(18.dp))
    }
}

/** Pas de statut (ni réseau ni cache) : logo, message d'erreur et bouton pour réessayer. */
@Composable
private fun ServerError(car: UserCar, onRetry: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        CarImage(car, Modifier.size(width = 90.dp, height = 45.dp))
        Text(
            text = stringResource(R.string.car_maker_server_error, car.maker.raw.replaceFirstChar { it.uppercase() }),
            textAlign = TextAlign.Center,
            fontSize = 13.sp,
        )
        IconButton(R.drawable.ic_refresh, stringResource(R.string.refresh), onRetry)
    }
}
