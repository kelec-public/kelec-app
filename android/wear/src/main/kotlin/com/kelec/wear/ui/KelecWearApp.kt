package com.kelec.wear.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.wear.compose.material.CircularProgressIndicator
import androidx.wear.compose.material.HorizontalPageIndicator
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.PageIndicatorState
import androidx.wear.compose.material.Scaffold
import androidx.wear.compose.material.Text
import androidx.wear.compose.material.TimeText
import com.kelec.shared.SharedStore
import com.kelec.shared.UserAccount
import com.kelec.wear.R
import com.kelec.wear.sync.WatchSync

/**
 * Écran principal (pendant de `ContentView` sur l'Apple Watch) : une page par voiture, puis les Réglages.
 * Sans compte ou sans voiture : un message pour synchroniser depuis le téléphone, et un bouton pour relire.
 */
@Composable
fun KelecWearApp() {
    val context = LocalContext.current
    val lastSync by WatchSync.lastSync.collectAsState()
    var account by remember { mutableStateOf<UserAccount?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    // relit le compte enregistré (bouton « Rafraîchir » des écrans vides)
    var reloadCount by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) { WatchSync.loadLatest(context) }
    LaunchedEffect(lastSync, reloadCount) {
        account = SharedStore(context).loadAccount()
        isLoading = false
    }

    MaterialTheme {
        Scaffold(timeText = { TimeText() }) {
            val current = account
            when {
                isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
                current == null -> EmptyScreen(stringResource(R.string.watch_open_phone_to_sync)) { reloadCount++ }
                current.cars.isEmpty() -> EmptyScreen(stringResource(R.string.watch_add_vehicle_on_phone)) { reloadCount++ }
                else -> CarsPager(current, lastSync)
            }
        }
    }
}

@Composable
private fun CarsPager(account: UserAccount, lastSync: Long) {
    val pageCount = account.cars.size + 1
    val pagerState = rememberPagerState { pageCount }
    val indicatorState = remember(pagerState) {
        object : PageIndicatorState {
            override val pageOffset: Float get() = pagerState.currentPageOffsetFraction
            override val selectedPage: Int get() = pagerState.currentPage
            override val pageCount: Int get() = pagerState.pageCount
        }
    }

    Box(Modifier.fillMaxSize()) {
        HorizontalPager(state = pagerState) { page ->
            if (page < account.cars.size) {
                CarScreen(account.cars[page], lastSync)
            } else {
                SettingsScreen(account)
            }
        }
        HorizontalPageIndicator(pageIndicatorState = indicatorState)
    }
}

@Composable
private fun EmptyScreen(message: String, onRefresh: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(text = message, textAlign = TextAlign.Center)
        IconLabelButton(icon = R.drawable.ic_refresh, label = stringResource(R.string.refresh), onClick = onRefresh)
    }
}
