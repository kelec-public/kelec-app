package com.kelec;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import android.appwidget.AppWidgetManager;
import android.util.Log;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import com.google.gson.Gson;
import com.kelec.oidc.OIDC;
import com.kelec.oidc.OidcTokens;

public class SharedStorage extends ReactContextBaseJavaModule {
    ReactApplicationContext context;

    public SharedStorage(ReactApplicationContext reactContext){
        super(reactContext);
        context = reactContext;
    }

    @Override
    public String getName(){
        return "SharedStorage";
    }

    @ReactMethod
    public void set(String key, String message){
        SharedPreferences.Editor editor = context.getSharedPreferences("DATA", context.MODE_PRIVATE).edit();
        editor.putString(key, message);
        editor.commit();
        Intent intent = new Intent(getCurrentActivity().getApplicationContext(), KelecMainWIdget.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        int[] ids = AppWidgetManager.getInstance(getCurrentActivity().getApplicationContext()).getAppWidgetIds(new ComponentName(getCurrentActivity().getApplicationContext(), KelecMainWIdget.class));
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        getCurrentActivity().getApplicationContext().sendBroadcast(intent);
    }

    @ReactMethod
    public void setEncrypted(String key, String message){
        try {
            Log.d("setEncrypted", "Setting key: " + key + " with message: " + message);
            MasterKey masterKey = new MasterKey.Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();

            SharedPreferences sharedPreferences = EncryptedSharedPreferences.create(
                    context,
                    "DATA",
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );

            SharedPreferences.Editor editor = sharedPreferences.edit();
            editor.putString(key, message);
            editor.commit(); // Use apply() instead of commit() for asynchronous writing
            Log.d("setEncrypted", "Successfully set key: " + key);
        } catch (Exception e) {
            Log.e("setEncrypted", "Error in set method: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getEncrypted(String key, Callback callback){
        try {
            Log.d("getEncrypted", "Getting value for key: " + key);
            MasterKey masterKey = new MasterKey.Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();

            SharedPreferences sharedPreferences = EncryptedSharedPreferences.create(
                    context,
                    "DATA",
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );

            String message = sharedPreferences.getString(key, "");
            Log.d("getEncrypted", "Retrieved value for key " + key + ": " + message);
            callback.invoke(message);
        } catch (Exception e) {
            Log.e("getEncrypted", "Error in get method: " + e.getMessage(), e);
            callback.invoke(""); // Invoke callback with empty string in case of error
        }
    }

    @ReactMethod
    public void getValidToken(String email, Promise promise) {
        new Thread(() -> {
            try {
                OIDC oidc = new OIDC(context);
                OidcTokens tokens = oidc.getTokenBlocking(email);
                if (tokens != null) {
                    promise.resolve(new Gson().toJson(tokens));
                } else {
                    promise.reject("no_token", "No valid token found for " + email);
                }
            } catch (Exception e) {
                promise.reject("token_error", e.getMessage());
            }
        }).start();
    }

    @ReactMethod
    public void get(String key, Callback callback){
        SharedPreferences prefs = context.getSharedPreferences("DATA", context.MODE_PRIVATE);
        String message = prefs.getString(key, "");
        callback.invoke(message);

    }


    @ReactMethod
    public void async_get(String key, Promise promise) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("DATA", Context.MODE_PRIVATE);
            String message = prefs.getString(key, null);

            if (message != null){
                promise.resolve(message);
            } else {
                promise.reject("data_not_found", "No data found for key : " + key);
            }
        } catch (Exception e) {
            promise.reject("storage_error", "Error reading from Sharedpreferences");
        }
    }



}
