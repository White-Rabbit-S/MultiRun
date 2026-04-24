package com.multirun.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

public class OrderAccessibilityService extends AccessibilityService {

    private static final String TAG = "MultiRunAccessibility";

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) return;

        // Simple DFS to find text nodes containing keywords
        findAddressInNodes(rootNode);
    }

    private void findAddressInNodes(AccessibilityNodeInfo node) {
        if (node == null) return;

        if (node.getText() != null) {
            String text = node.getText().toString();
            
            // Very simplified heuristic for finding addresses on DoorDash/Uber Eats
            // In a production app, you would use regex or specific View IDs
            if (text.contains("New Order") || text.contains("Delivery to")) {
                Log.d(TAG, "Found order keyword: " + text);
                
                // Broadcast the finding back to the MainActivity's WebView
                Intent intent = new Intent("com.multirun.ORDER_INTERCEPTED");
                intent.putExtra("rawText", text);
                sendBroadcast(intent);
            }
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            findAddressInNodes(node.getChild(i));
        }
    }

    @Override
    public void onInterrupt() {
        Log.e(TAG, "Accessibility Service Interrupted");
    }
}
