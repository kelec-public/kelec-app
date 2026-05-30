package com.kelec;


import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import androidx.annotation.NonNull;

import com.kelec.ApiHandler.BatteryStatusAttributes;
import com.kelec.ApiHandler.RenaultApiHandler;
import com.kelec.widgets.CarDataRepository;
import com.kelec.ApiHandler.AppPreferences;
import com.kelec.widgets.KelecWidgetViews;
import com.kelec.widgets.WidgetRefreshWorker;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;


/**
 * Implementation of App Widget functionality for Kelec car monitoring.
 * Displays battery status, charging information, and car details in a home screen widget.
 * Persistence in {@link com.kelec.widgets.CarDataRepository}
 *
 */
public class KelecMainWIdget extends AppWidgetProvider {
  public static final String REFRESH_WIDGET_ACTION = "REFRESH_WIDGET_ACTION";
  public static final String ACTION_AUTO_UPDATE = "AUTO_UPDATE";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (action == null) {
            super.onReceive(context, intent);
            return;
        }

        switch (action) {
            case AppWidgetManager.ACTION_APPWIDGET_UPDATE:
            case ACTION_AUTO_UPDATE:
            case REFRESH_WIDGET_ACTION:
                refreshAsync(context);
                break;

            default:
                super.onReceive(context, intent);
        }
    }

    private void refreshAsync(@NonNull Context context) {
        final BroadcastReceiver.PendingResult pending = goAsync();

        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(context, KelecMainWIdget.class));

        CarDataRepository repo = new CarDataRepository(context);
        AppPreferences prefs = repo.loadAppPreferences();

        List<CompletableFuture<?>> tasks = new ArrayList<>();
        for (int id: ids) {
            tasks.add(updateWidget(context, mgr, id, repo, prefs));
        }

        CompletableFuture.allOf(tasks.toArray(new CompletableFuture[0]))
                .whenComplete((result, error) -> pending.finish());
    }

    private CompletableFuture<Void> updateWidget(@NonNull Context context, @NonNull AppWidgetManager mgr,
                                                 int appWidgetId, @NonNull CarDataRepository repo,
                                                 @NonNull AppPreferences prefs) {
        String widgetVin = repo.loadVinForWidget(appWidgetId);
        CarDataRepository.AccountSnapshot account = (widgetVin != null)
                ? repo.loadCarByVin(widgetVin)
                : repo.loadAccount();

        switch (account.getStatus()) {
            case NOT_LOGGED_IN:
                return renderError(mgr, appWidgetId, context, context.getString(R.string.not_yet_logged_in));
            case NO_CARS:
                return renderError(mgr, appWidgetId, context, context.getString(R.string.not_yet_logged_in));
            case OK:
            default:
                break;
        }

        CarDataRepository.SelectedCar car = ((CarDataRepository.AccountSnapshot.Ok) account).getCar();

        if (car.isDemo()) {
            render(mgr, appWidgetId, KelecWidgetViews.INSTANCE.main(
                    context, appWidgetId, CarDataRepository.Companion.demoBatteryStatus(), car.getModel(), car.getMaker(), prefs
            ));
            return done();
        }

        String password = repo.loadPassword(car.getVin());
        if (password == null) {
            return renderError(mgr, appWidgetId, context, "Unable to decrpyt password");
        }

        BatteryStatusAttributes cached = repo.loadCachedBatteryStatus(car.getVin());
        RenaultApiHandler api = new RenaultApiHandler(car.getEmail(), password, car.getKamereonAccountID());

        return api.getBatteryStatus(context, car.getVin())
                .thenAccept(fresh -> {
                    if (fresh != null) {
                        repo.saveBatteryStatus(car.getVin(), fresh);
                        render(mgr, appWidgetId, KelecWidgetViews.INSTANCE.main(context, appWidgetId, fresh, car.getModel(), car.getMaker(), prefs));
                    } else if (cached != null) {
                        render(mgr, appWidgetId, KelecWidgetViews.INSTANCE.main(context, appWidgetId, cached, car.getModel(), car.getMaker(), prefs));
                    } else {
                        render(mgr, appWidgetId, KelecWidgetViews.INSTANCE.error(context, "Unable to collect data"));
                    }
                })
                .exceptionally(err -> {
                    if (cached != null) {
                        render(mgr, appWidgetId, KelecWidgetViews.INSTANCE.main(context, appWidgetId, cached, car.getModel(), car.getMaker(), prefs));
                    } else {
                        Throwable cause = err.getCause() != null ? err.getCause() : err;
                        String msg = cause.getMessage() != null ? cause.getMessage() : "Unknown error";
                        render(mgr, appWidgetId, KelecWidgetViews.INSTANCE.error(context, msg));
                    }
                    return null;
                });
    }

    private static void render(@NonNull AppWidgetManager mgr, int appWidgetId, @NonNull RemoteViews views) {
        mgr.updateAppWidget(appWidgetId, views);
    }

    private static CompletableFuture<Void> renderError(@NonNull AppWidgetManager mgr, int appWidgetId,
                                                       @NonNull Context context, @NonNull String message) {
        render(mgr, appWidgetId, KelecWidgetViews.INSTANCE.error(context, message));
        return done();
    }

    private static CompletableFuture<Void> done() {
        return CompletableFuture.completedFuture(null);
    }

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        CarDataRepository repo = new CarDataRepository(context);
        for (int id : appWidgetIds) {
            repo.clearVinForWidget(id);
        }
    }

    @Override
    public void onEnabled(Context context) {
        WidgetRefreshWorker.schedule(context);
    }

    @Override
    public void onDisabled(Context context) {
        WidgetRefreshWorker.cancel(context);
    }
}

