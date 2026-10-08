package com.kelec.wear.ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.Icon
import androidx.wear.compose.material.ListHeader
import androidx.wear.compose.material.Text
import com.kelec.shared.SharedStore
import com.kelec.shared.UserAccount
import com.kelec.wear.R
import com.kelec.wear.complication.BatteryComplicationService
import com.kelec.wear.watchCar

/** Réglages de l'app de la montre : la voiture affichée par les complications (pendant de `WatchSettingsView`). */
@Composable
fun SettingsScreen(account: UserAccount) {
    val context = LocalContext.current
    val store = remember { SharedStore(context) }
    var widgetVin by remember(account) { mutableStateOf(watchCar(account, store)?.vin) }

    ScalingLazyColumn(modifier = Modifier.fillMaxWidth()) {
        item {
            ListHeader { Text(stringResource(R.string.watch_settings)) }
        }
        item {
            Text(
                text = stringResource(R.string.watch_widget_car),
                fontSize = 12.sp,
                color = WearColors.secondary,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
        }
        items(account.cars, key = { it.vin }) { car ->
            val selected = car.vin == widgetVin
            Chip(
                modifier = Modifier.fillMaxWidth(),
                onClick = {
                    store.saveWatchWidgetVin(car.vin)
                    widgetVin = car.vin
                    BatteryComplicationService.requestUpdate(context)
                },
                label = { Text(car.model) },
                icon = if (selected) {
                    { Icon(painter = painterResource(R.drawable.ic_check), contentDescription = null, modifier = Modifier.size(ChipDefaults.IconSize)) }
                } else null,
                colors = if (selected) ChipDefaults.primaryChipColors() else ChipDefaults.secondaryChipColors(),
            )
        }
    }
}
