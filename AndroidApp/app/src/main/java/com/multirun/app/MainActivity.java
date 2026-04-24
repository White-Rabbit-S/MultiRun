package com.multirun.app;

import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private OrderReceiver orderReceiver;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Set up the WebView as the entire UI
        webView = new WebView(this);
        setContentView(webView);

        // Configure WebView settings to run our beautiful JS/HTML app
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Load the local HTML file we created earlier
        webView.loadUrl("file:///android_asset/www/index.html");

        // Register receiver to get messages from Accessibility Service
        orderReceiver = new OrderReceiver();
        IntentFilter filter = new IntentFilter("com.multirun.ORDER_INTERCEPTED");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(orderReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(orderReceiver, filter);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (orderReceiver != null) {
            unregisterReceiver(orderReceiver);
        }
    }

    // Broadcast receiver that listens for the Accessibility Service
    private class OrderReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            String rawText = intent.getStringExtra("rawText");
            if (rawText != null) {
                // Pass the data directly into our JavaScript app!
                // This calls a function in our web app's js/orders.js
                String jsCommand = "javascript:if(window.orderManager) { window.orderManager.handleNativeIntercept('" + rawText + "'); }";
                webView.post(() -> webView.evaluateJavascript(jsCommand, null));
            }
        }
    }
}
