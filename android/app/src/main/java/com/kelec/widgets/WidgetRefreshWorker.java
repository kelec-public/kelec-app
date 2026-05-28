package com.kelec.widgets;

import android.content.Context;
import android.content.Intent;

import androidx.annotation.NonNull;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.kelec.KelecMainWIdget;

import java.util.concurrent.TimeUnit;

public class WidgetRefreshWorker extends Worker {
    private static final String WORK_NAME = "kelec_widget_refresh";

    public WidgetRefreshWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();
        context.sendBroadcast(new Intent(context, KelecMainWIdget.class)
                .setAction(KelecMainWIdget.ACTION_AUTO_UPDATE));
        return Result.success();
    }

    public static void schedule(@NonNull Context context) {
        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(
                WidgetRefreshWorker.class, 15, TimeUnit.MINUTES
        ).build();

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request
        );
    }

    public static void cancel(@NonNull Context context) {
        WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME);
    }
}
