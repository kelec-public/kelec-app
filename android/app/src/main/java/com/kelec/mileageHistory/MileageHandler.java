package com.kelec.mileageHistory;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;

public class MileageHandler {
    private static final String TAG = "MileageHandler";
    private static boolean debugMode = false;

    private static void logDebug(String message) {
        if (debugMode) {
            Log.d(TAG, message);
        }
    }

    private static final String PREFS_NAME = "DATA";
    private static final String MILEAGE_HISTORY_KEY = "_mileageHistory";
    private static final Object mileageHistoryLock = new Object();
    static public void saveMileageHistory(Context context, String vin, Double mileage){
        if (context == null || vin == null || mileage == null){
            logDebug("Context, VIN, or mileage is null. Aborting save.");
            return;
        }

        synchronized (mileageHistoryLock) {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String key = vin + MILEAGE_HISTORY_KEY;
            Gson gson = new Gson();

            // Load existing mileage history
            List<MileageLog> mileageHistory;
            try {
                String existingData = prefs.getString(key, null);
                if (existingData != null) {
                    Type listType = new TypeToken<List<MileageLog>>() {
                    }.getType();
                    mileageHistory = gson.fromJson(existingData, listType);
                    logDebug("Loaded existing mileage history with " + mileageHistory.size() + " entries.");
                } else {
                    // No existing data, initialize new list
                    mileageHistory = new ArrayList<>();
                }
            } catch (Exception e) {
                logDebug("Failed to load existing mileage history: " + e.getMessage());
                mileageHistory = new ArrayList<>();
            }

            // Add new entry
            mileageHistory.add(new MileageLog(mileage, convertDateToIsoString(new Date())));
            logDebug("Found new mileage: " + mileage + ", total entries now: " + mileageHistory.size());

            // remove entries older than 30 days
            Calendar calendar = Calendar.getInstance();
            calendar.add(Calendar.DAY_OF_YEAR, -30);
            Date cutoffDate = calendar.getTime();

            List<MileageLog> filteredMileage = new ArrayList<>();
            for (MileageLog log : mileageHistory) {
                Date logDate = convertIsoStringToDate(log.getTimestamp());
                if (logDate != null && logDate.after(cutoffDate)) {
                    filteredMileage.add(log);
                }
            }

            // save back to shared preferences
            try {
                prefs.edit()
                        .putString(key, gson.toJson(filteredMileage))
                        .apply();
                logDebug("Mileage logs written successfully with " + filteredMileage.size() + " entries.");
            } catch (Exception e) {
                logDebug("Unable to save mileage history");
            }
        }
    }

    /**
     * Convert Date to ISO string format
     */
    static private String convertDateToIsoString(Date date) {
        return date.toInstant().toString();
    }

    static private Date convertIsoStringToDate(String isoString) {
        try {
            return Date.from(Instant.parse(isoString));
        } catch (Exception e) {
            logDebug("Failed to parse ISO date string: " + isoString + ", error: " + e.getMessage());
            return null;
        }
    }
}

