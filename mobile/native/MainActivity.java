package com.lekaixin.app;

import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

/**
 * MainActivity — 原生覆盖文件（不要直接改 mobile/android/ 里的生成物）。
 *
 * 背景：Capacitor 7 的核心库不处理 Android 返回键（全库无 onBackPressed 实现），
 * 默认行为是 Activity.finish()，即按返回键 / 全面屏侧滑会直接退出应用，
 * 而不是回到上一页。这里补上「优先回退 WebView 历史，到根页面才退出」的逻辑。
 *
 * 本文件由 tools/apply_native_overrides.js 复制到
 * mobile/android/app/src/main/java/com/lekaixin/app/MainActivity.java
 * （android/ 目录 gitignore，CI 每次 cap add android 重建，所以必须走覆盖流程）。
 */
public class MainActivity extends BridgeActivity {

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
