package com.kelec;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.util.Log;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import com.google.gson.Gson;
import com.kelec.ApiHandler.AppPreferences;
import com.kelec.ApiHandler.BatteryStatusAttributes;
import com.kelec.ApiHandler.RenaultApiHandler;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Locale;

/**
 * Implementation of App Widget functionality for Kelec car monitoring.
 * Displays battery status, charging information, and car details in a home screen widget.
 */
public class KelecMainWIdget extends AppWidgetProvider {
    private static final String TAG = KelecMainWIdget.class.getSimpleName();
    private static final String REFRESH_WIDGET_ACTION = "REFRESH_WIDGET_ACTION";
    public static final String ACTION_AUTO_UPDATE = "AUTO_UPDATE";

    // Constants for charging status
    private static final int PLUG_STATUS_UNPLUGGED = 0;
    private static final int PLUG_STATUS_PLUGGED = 1;
    private static final int CHARGING_STATUS_SCHEDULED = 1;
    private static final int CHARGING_STATUS_ENDED = 2;
    private static final int CHARGING_STATUS_SCHEDULED_ALT = 3;
    private static final int CHARGING_STATUS_ACTIVE = 10;
    private static final int V2G_CHARGING_WAITING = -13;
    private static final int V2L_CONNECTED = -14;
    private static final int V2G_DISCHARGING = -15;
    private static final int V2G_CHARGING_NORMAL = -16;
    private static final int CHARGING_STATUS_ZOE_BUG = -11; // First gen Zoe bug

    // Conversion constants
    private static final double KM_TO_MILES_FACTOR = 0.621371;

    // Storage keys
    private static final String PREFS_NAME = "DATA";
    private static final String ACCOUNT_KEY = "account";
    private static final String APP_PREFERENCES_KEY = "appPreferences";
    private static final String CAR_DATA_SUFFIX = "/carData";
    private static final String PASSWORD_SUFFIX = "_password";

    // Car maker constants
    private static final String DEMO_CAR_MAKER = "demo";

    /**
     * Safely retrieves a string value from JSONObject with fallback
     */
    private static String getStringOrDefault(@NonNull JSONObject json, @NonNull String key, @NonNull String defaultValue) {
        try {
            return json.getString(key);
        } catch (JSONException e) {
            Log.w(TAG, "Failed to get string for key: " + key, e);
            return defaultValue;
        }
    }

    /**
     * Safely retrieves an integer value from JSONObject with fallback
     */
    private static int getIntOrDefault(@NonNull JSONObject json, @NonNull String key, int defaultValue) {
        try {
            return json.getInt(key);
        } catch (JSONException e) {
            Log.w(TAG, "Failed to get int for key: " + key, e);
            return defaultValue;
        }
    }

    /**
     * Safely retrieves a double value from JSONObject with fallback
     */
    private static double getDoubleOrDefault(@NonNull JSONObject json, @NonNull String key, double defaultValue) {
        try {
            return json.getDouble(key);
        } catch (JSONException e) {
            Log.w(TAG, "Failed to get double for key: " + key, e);
            return defaultValue;
        }
    }

    /**
     * Converts kilometers to miles
     */
    private static int convertKmToMiles(int km) {
        return (int) (km * KM_TO_MILES_FACTOR);
    }

    /**
     * Gets car range in appropriate units based on user preferences
     */
    private static int getCarRange(int range, @Nullable AppPreferences appPreferences) {
        if (appPreferences != null && Boolean.TRUE.equals(appPreferences.getConvertToMiles())) {
            return convertKmToMiles(range);
        }
        return range;
    }

    /**
     * Gets distance units string based on user preferences
     */
    private static String getDistanceUnits(@Nullable AppPreferences appPreferences) {
        if (appPreferences != null && Boolean.TRUE.equals(appPreferences.getDisplayMiles())) {
            return " mi";
        }
        return " km";
    }

    /**
     * Converts ISO timestamp to ZonedDateTime
     */
    @Nullable
    private static ZonedDateTime convertTimestamp(@NonNull String timestamp) {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
            return ZonedDateTime.parse(timestamp, formatter);
        } catch (DateTimeParseException e) {
            Log.e(TAG, "Failed to parse timestamp: " + timestamp, e);
            return null;
        }
    }

    /**
     * Formats ZonedDateTime to HH:mm in local timezone
     */
    @NonNull
    private static String formatTime(@NonNull ZonedDateTime dateTime) {
        ZonedDateTime localTime = dateTime.withZoneSameInstant(ZoneId.systemDefault());
        return localTime.format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    /**
     * Gets appropriate charging status text based on plug and charging status
     */
    @NonNull
    private static String getChargeText(@NonNull Context context, int plugStatus, double chargingStatus) {
        if (plugStatus == PLUG_STATUS_UNPLUGGED) {
            return "";
        }

        if (plugStatus == PLUG_STATUS_PLUGGED) {
            double actualChargingStatus = Math.round(chargingStatus * 10.0) / 10.0;
            int chargingStatusInt = (int) (actualChargingStatus * 10);

            return switch (chargingStatusInt) {
                case CHARGING_STATUS_SCHEDULED, CHARGING_STATUS_SCHEDULED_ALT ->
                        context.getString(R.string.scheduled_charge_status);
                case CHARGING_STATUS_ENDED -> context.getString(R.string.ended_charge_status);
                case CHARGING_STATUS_ACTIVE -> context.getString(R.string.charging_status);
                case CHARGING_STATUS_ZOE_BUG -> // First gen Zoe bug
                        context.getString(R.string.charging_status);
                case V2G_CHARGING_NORMAL, V2G_CHARGING_WAITING, V2G_DISCHARGING -> "V2G";
                case V2L_CONNECTED -> "V2L";
                default -> context.getString(R.string.not_charging_status);
            };
        }

        return "";
    }

    /**
     * Calculates the end time for charging
     */
    @NonNull
    private static String calculateEndTime(@NonNull ZonedDateTime lastRefreshDate, int minutesToAdd) {
        ZonedDateTime endDateTime = lastRefreshDate.plus(minutesToAdd, ChronoUnit.MINUTES);
        return formatTime(endDateTime);
    }

    /**
     * Creates mock battery data for demo cars
     */
    @NonNull
    private static BatteryStatusAttributes createMockBatteryData() {
        String currentTimeStamp = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault())
                .format(new Date());
        return new BatteryStatusAttributes(currentTimeStamp, 62, 175, 1, 1.0, 120);
    }

    /**
     * Applies the main widget view with battery data
     */
    private static void applyWidgetView(@NonNull Context context, @NonNull AppWidgetManager appWidgetManager,
                                        int appWidgetId, @NonNull BatteryStatusAttributes battery,
                                        @NonNull String carName, @NonNull String carMaker, @Nullable AppPreferences appPreferences) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.kelec_main_w_idget);

        // Set car maker logo
        int logoRes;
        switch (carMaker) {
            case "alpine": logoRes = R.drawable.alpine_logo; break;
            case "dacia": logoRes = R.drawable.dacia_logo; break;
            case "renault": logoRes = R.drawable.renault_logo; break;
            default: logoRes = R.drawable.renault_logo; break;
        }
        views.setImageViewResource(R.id.car_manufacturer_logo, logoRes);

        // Set car name
        views.setTextViewText(R.id.car_name, carName);

        // Set timestamp
        ZonedDateTime lastRefreshDate = convertTimestamp(battery.getTimestamp());
        if (lastRefreshDate != null) {
            String lastRefreshDateToDisplay = formatTime(lastRefreshDate);
            views.setTextViewText(R.id.last_update_button, lastRefreshDateToDisplay);
        }

        // Set charging status text
        views.setTextViewText(R.id.charging_status_text,
                getChargeText(context, battery.getPlugStatus(), battery.getChargingStatus()));

        // Setup main app launch intent
        setupMainAppIntent(context, views);

        // Setup refresh button intent
        setupRefreshIntent(context, views, appWidgetId);

        // Configure progress bars and charging info based on plug status
        configureChargingDisplay(context, views, battery, lastRefreshDate);

        // Set battery level and range
        views.setTextViewText(R.id.battery_level_text, battery.getBatteryLevel().toString());
        views.setTextViewText(R.id.battery_autonomy_text,
                getCarRange(battery.getBatteryAutonomy(), appPreferences) + getDistanceUnits(appPreferences));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    /**
     * Sets up the main app launch intent
     */
    private static void setupMainAppIntent(@NonNull Context context, @NonNull RemoteViews views) {
        Intent mainIntent = new Intent(context, MainActivity.class);
        PendingIntent pendingMainIntent = PendingIntent.getActivity(context, 0, mainIntent,
                PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.main_widget_content, pendingMainIntent);
    }

    /**
     * Sets up the refresh button intent
     */
    private static void setupRefreshIntent(@NonNull Context context, @NonNull RemoteViews views, int appWidgetId) {
        Intent refreshIntent = new Intent(context, KelecMainWIdget.class);
        refreshIntent.setAction(REFRESH_WIDGET_ACTION);
        refreshIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        refreshIntent.setData(Uri.parse(refreshIntent.toUri(Intent.URI_INTENT_SCHEME)));
        PendingIntent refreshPendingIntent = PendingIntent.getBroadcast(context, 0, refreshIntent,
                PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.last_update_button, refreshPendingIntent);
    }

    /**
     * Configures the charging display based on plug status
     */
    private static void configureChargingDisplay(@NonNull Context context, @NonNull RemoteViews views,
                                                 @NonNull BatteryStatusAttributes battery,
                                                 @Nullable ZonedDateTime lastRefreshDate) {
        if (battery.getPlugStatus() == PLUG_STATUS_PLUGGED) {
            // Car is plugged in - show charging progress bar
            views.setViewVisibility(R.id.not_charging_progress_bar, View.GONE);
            views.setViewVisibility(R.id.charging_progress_bar, View.VISIBLE);
            views.setProgressBar(R.id.charging_progress_bar, 100, battery.getBatteryLevel(), false);

            configureChargingTexts(views, battery, lastRefreshDate);
        } else {
            // Car is not plugged in - show standard progress bar
            views.setViewVisibility(R.id.charging_progress_bar, View.GONE);
            views.setViewVisibility(R.id.not_charging_progress_bar, View.VISIBLE);
            views.setProgressBar(R.id.not_charging_progress_bar, 100, battery.getBatteryLevel(), false);
            views.setViewVisibility(R.id.charging_texts, View.GONE);
        }
    }

    /**
     * Configures charging time texts
     */
    private static void configureChargingTexts(@NonNull RemoteViews views, @NonNull BatteryStatusAttributes battery,
                                               @Nullable ZonedDateTime lastRefreshDate) {
        double actualChargingStatus = Math.round(battery.getChargingStatus() * 10.0) / 10.0;
        int chargingStatusInt = (int) (actualChargingStatus * 10);
        Log.w(TAG, "Charging status: " + chargingStatusInt);
        boolean isActivelyCharging = (chargingStatusInt == CHARGING_STATUS_ACTIVE) ||
                (chargingStatusInt == CHARGING_STATUS_ZOE_BUG && battery.getBatteryLevel() < 100);

        if (isActivelyCharging && lastRefreshDate != null) {
            // Car is actively charging - show end time and remaining time
            String endDateToDisplay = calculateEndTime(lastRefreshDate, battery.getChargingRemainingTime());
            views.setTextViewText(R.id.end_time_text, endDateToDisplay);

            int remainingHours = battery.getChargingRemainingTime() / 60;
            int remainingMinutes = battery.getChargingRemainingTime() % 60;
            String remainingTimeText = String.format(Locale.getDefault(), "%dh%02d",
                    remainingHours, remainingMinutes);
            views.setTextViewText(R.id.time_remaining_text, remainingTimeText);
        } else {
            // Car is not actively charging
            views.setViewVisibility(R.id.end_time_image, View.GONE);
            views.setViewVisibility(R.id.end_time_text, View.GONE);
            views.setTextViewText(R.id.time_remaining_text, "--h--");
        }
    }

    /**
     * Loads app preferences from shared preferences
     */
    @NonNull
    private static AppPreferences loadAppPreferences(@NonNull SharedPreferences prefs) {
        AppPreferences appPreferences = new AppPreferences();
        String appPreferencesText = prefs.getString(APP_PREFERENCES_KEY, "");

        if (!appPreferencesText.isEmpty()) {
            try {
                JSONObject appPreferencesJSON = new JSONObject(appPreferencesText);
                try {
                    Boolean displayMiles = appPreferencesJSON.getBoolean("displayMiles");
                    appPreferences.setDisplayMiles(displayMiles);
                } catch (JSONException e) {
                    // Property not set, use default
                }
                try {
                    Boolean convertToMiles = appPreferencesJSON.getBoolean("convertToMiles");
                    appPreferences.setConvertToMiles(convertToMiles);
                } catch (JSONException e) {
                    // Property not set, use default
                }
            } catch (JSONException e) {
                Log.w(TAG, "Failed to parse app preferences", e);
            }
        }

        return appPreferences;
    }

    /**
     * Loads cached car data from local storage
     */
    @Nullable
    private static BatteryStatusAttributes loadCachedCarData(@NonNull Context context, @NonNull String selectedCarVin) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String carData = prefs.getString(selectedCarVin + CAR_DATA_SUFFIX, "");

        if (!carData.isEmpty()) {
            try {
                JSONObject carDataJson = new JSONObject(carData);
                String timestamp = getStringOrDefault(carDataJson, "timestamp", "N/A");
                int batteryLevel = getIntOrDefault(carDataJson, "batteryLevel", 0);
                int batteryAutonomy = getIntOrDefault(carDataJson, "batteryAutonomy", 0);
                int plugStatus = getIntOrDefault(carDataJson, "plugStatus", 0);
                double chargingStatus = getDoubleOrDefault(carDataJson, "chargingStatus", 0.0);
                int chargingRemainingTime = getIntOrDefault(carDataJson, "chargingRemainingTime", 0);

                return new BatteryStatusAttributes(timestamp, batteryLevel, batteryAutonomy,
                        plugStatus, chargingStatus, chargingRemainingTime);
            } catch (JSONException e) {
                Log.e(TAG, "Failed to parse cached car data", e);
            }
        }

        return null;
    }

    /**
     * Saves car data to local storage
     */
    private static void saveCachedCarData(@NonNull Context context, @NonNull String selectedCarVin,
                                          @NonNull BatteryStatusAttributes carData) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        Gson gson = new Gson();
        editor.putString(selectedCarVin + CAR_DATA_SUFFIX, gson.toJson(carData));
        editor.apply();
    }

    /**
     * Loads encrypted password from storage
     */
    @Nullable
    private static String loadEncryptedPassword(@NonNull Context context, @NonNull String selectedCarVin) {
        try {
            MasterKey masterKey = new MasterKey.Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();

            SharedPreferences sharedPreferences = EncryptedSharedPreferences.create(
                    context,
                    PREFS_NAME,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );

            String password = sharedPreferences.getString(selectedCarVin + PASSWORD_SUFFIX, "");
            return password.isEmpty() ? null : password;
        } catch (Exception e) {
            Log.e(TAG, "Failed to load encrypted password", e);
            return null;
        }
    }

    /**
     * Applies widget with car data
     */
    private static void applyWidget(@NonNull Context context, @NonNull AppWidgetManager appWidgetManager,
                                    int appWidgetId, @NonNull JSONObject account,
                                    @NonNull AppPreferences appPreferences) {
        try {
            String selectedCarVin = account.getString("selectedCar");
            JSONArray cars = account.getJSONArray("cars");

            // Find the selected car
            JSONObject userCar = null;
            String carName = "";

            for (int i = 0; i < cars.length(); i++) {
                try {
                    JSONObject car = cars.getJSONObject(i);
                    JSONObject carModel = car.getJSONObject("car");
                    if (carModel.getString("vin").equals(selectedCarVin)) {
                        carName = carModel.getString("model");
                        userCar = car;
                        break;
                    }
                } catch (JSONException e) {
                    Log.e(TAG, "Error parsing car data", e);
                    applyError(context, appWidgetManager, appWidgetId,
                            "Unknown error occurred while processing car data");
                    return;
                }
            }

            if (userCar == null) {
                applyError(context, appWidgetManager, appWidgetId, "Selected car not found");
                return;
            }

            // Load cached data first
            BatteryStatusAttributes cachedData = loadCachedCarData(context, selectedCarVin);
            String carMaker = userCar.getString("carMaker");

            // Handle demo car
            if (DEMO_CAR_MAKER.equals(carMaker)) {
                BatteryStatusAttributes mockData = createMockBatteryData();
                applyWidgetView(context, appWidgetManager, appWidgetId, mockData, carName, carMaker, appPreferences);
                return;
            }

            // Get credentials
            String email = userCar.getString("email");
            String password = loadEncryptedPassword(context, selectedCarVin);

            if (password == null) {
                applyError(context, appWidgetManager, appWidgetId,
                        "Password not found");
                return;
            }

            String kamereonAccountID = userCar.getString("kamereonAccountID");

            // Fetch fresh data
            String finalCarName = carName;

            // Fetch car data
            RenaultApiHandler renaultApiHandler = new RenaultApiHandler(email, password, kamereonAccountID);
            renaultApiHandler.getBatteryStatus(context, selectedCarVin)
                    .thenAccept(carData -> {
                        if (carData != null){
                            saveCachedCarData(context, selectedCarVin, carData);
                            applyWidgetView(context, appWidgetManager, appWidgetId, carData, finalCarName, carMaker, appPreferences);
                        }
                    })
                    .exceptionally(error -> {
                        if (cachedData != null) {
                            Log.d(TAG, "Using cached car data");
                            applyWidgetView(context, appWidgetManager, appWidgetId, cachedData, finalCarName, carMaker, appPreferences);
                        } else {
                            applyError(context, appWidgetManager, appWidgetId, error.getCause() != null ? error.getCause().getMessage() : error.getMessage());
                        }
                        return null;
                    });

        } catch (JSONException e) {
            Log.e(TAG, "Error parsing JSON account data", e);
            applyError(context, appWidgetManager, appWidgetId,
                    "Unknown error occured while processing account data");
        }
    }

    /**
     * Displays error message in widget
     */
    private static void applyError(@NonNull Context context, @NonNull AppWidgetManager appWidgetManager,
                                   int appWidgetId, @NonNull String errorMessage) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.kelec_center_text_widget);
        views.setTextViewText(R.id.center_text, errorMessage);
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    /**
     * Updates a single app widget
     */
    private static void updateAppWidget(@NonNull Context context, @NonNull AppWidgetManager appWidgetManager,
                                        int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String userAccount = prefs.getString(ACCOUNT_KEY, "");

        AppPreferences appPreferences = loadAppPreferences(prefs);

        try {
            JSONObject user = new JSONObject(userAccount);
            JSONArray cars = user.getJSONArray("cars");

            if (cars.length() == 0) {
                applyError(context, appWidgetManager, appWidgetId,
                        context.getString(R.string.no_car_added));
            } else {
                applyWidget(context, appWidgetManager, appWidgetId, user, appPreferences);
            }
        } catch (JSONException e) {
            Log.w(TAG, "User not logged in or invalid account data", e);
            applyError(context, appWidgetManager, appWidgetId,
                    context.getString(R.string.not_yet_logged_in));
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onEnabled(Context context) {
        AppWidgetAlarm appWidgetAlarm = new AppWidgetAlarm(context.getApplicationContext());
        Log.d(TAG, "Starting widget alarm");
        appWidgetAlarm.startAlarm();
    }

    @Override
    public void onDisabled(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName thisAppWidgetComponentName = new ComponentName(context.getPackageName(), getClass().getName());
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisAppWidgetComponentName);

        if (appWidgetIds.length == 0) {
            AppWidgetAlarm appWidgetAlarm = new AppWidgetAlarm(context.getApplicationContext());
            appWidgetAlarm.stopAlarm();
            Log.d(TAG, "Stopping widget alarm");
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Received intent: " + intent.getAction());
        super.onReceive(context, intent);

        String action = intent.getAction();
        if (action == null) return;

        switch (action) {
            case REFRESH_WIDGET_ACTION:
                Log.d(TAG, "Manual refresh triggered");
                handleRefreshAction(context);
                break;

            case ACTION_AUTO_UPDATE:
                Log.d(TAG, "Auto update triggered");
                handleAutoUpdate(context);
                break;

            case Intent.ACTION_BOOT_COMPLETED:
                Log.d(TAG, "Boot completed - restarting alarm");
                AppWidgetAlarm appWidgetAlarm = new AppWidgetAlarm(context.getApplicationContext());
                appWidgetAlarm.startAlarm();
                break;
        }
    }

    /**
     * Handles manual refresh action
     */
    private void handleRefreshAction(@NonNull Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, KelecMainWIdget.class));
        onUpdate(context, appWidgetManager, appWidgetIds);

        Toast.makeText(context, "Kelec widget refreshed", Toast.LENGTH_SHORT).show();
    }

    /**
     * Handles auto update action
     */
    private void handleAutoUpdate(@NonNull Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, KelecMainWIdget.class));
        onUpdate(context, appWidgetManager, appWidgetIds);
    }
}