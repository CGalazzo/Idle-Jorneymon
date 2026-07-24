package com.caiogalazzo.idlejorneymon;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.browser.customtabs.CustomTabsIntent;

import org.json.JSONObject;

public class MainActivity extends Activity {
    // Marcador sem efeito funcional para validar a compilação do APK no pull request.
    private static final String APP_URL = "https://idle-jorneymon.vercel.app/";
    private static final String APP_HOST = Uri.parse(APP_URL).getHost();
    private static final String AUTH_SCHEME = "idlejorneymon";
    private static final String AUTH_HOST = "auth-callback";

    private WebView webView;
    private Uri pendingAuthCallback;
    private boolean gamePageReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.rgb(11, 24, 48));
        getWindow().setNavigationBarColor(Color.rgb(11, 24, 48));

        Uri launchUri = getIntent() != null ? getIntent().getData() : null;
        if (isAuthCallback(launchUri)) {
            pendingAuthCallback = launchUri;
            getIntent().setData(null);
        }

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(11, 24, 48));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setUserAgentString(settings.getUserAgentString() + " IdleJorneymonApp/2.1 Android");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return openExternalWhenNeeded(request.getUrl());
            }

            @Override
            @SuppressWarnings("deprecation")
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return openExternalWhenNeeded(Uri.parse(url));
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Uri loadedUri = Uri.parse(url);
                gamePageReady = APP_HOST != null && APP_HOST.equalsIgnoreCase(loadedUri.getHost());
                if (gamePageReady) deliverPendingAuthCallback();
            }
        });

        setContentView(webView);
        webView.loadUrl(APP_URL);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);

        Uri uri = intent != null ? intent.getData() : null;
        if (!isAuthCallback(uri)) return;

        pendingAuthCallback = uri;
        intent.setData(null);
        deliverPendingAuthCallback();
    }

    private boolean isAuthCallback(Uri uri) {
        return uri != null
            && AUTH_SCHEME.equalsIgnoreCase(uri.getScheme())
            && AUTH_HOST.equalsIgnoreCase(uri.getHost());
    }

    private boolean openExternalWhenNeeded(Uri url) {
        if (url == null) return true;

        if (isAuthCallback(url)) {
            pendingAuthCallback = url;
            deliverPendingAuthCallback();
            return true;
        }

        String scheme = url.getScheme();
        String host = url.getHost();

        if ("https".equalsIgnoreCase(scheme)
            && APP_HOST != null
            && APP_HOST.equalsIgnoreCase(host)) {
            return false;
        }

        if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)) {
            openSecureTab(url);
            return true;
        }

        try {
            startActivity(new Intent(Intent.ACTION_VIEW, url));
        } catch (Exception ignored) {
            // Mantém o jogo aberto quando não houver aplicativo para o link externo.
        }
        return true;
    }

    private void openSecureTab(Uri url) {
        try {
            CustomTabsIntent customTab = new CustomTabsIntent.Builder()
                .setShowTitle(false)
                .setToolbarColor(Color.rgb(11, 24, 48))
                .setNavigationBarColor(Color.rgb(11, 24, 48))
                .build();
            customTab.intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);
            customTab.launchUrl(this, url);
        } catch (Exception customTabError) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, url));
            } catch (Exception ignored) {
                // O jogo permanece aberto se nenhum navegador estiver disponível.
            }
        }
    }

    private void deliverPendingAuthCallback() {
        if (webView == null || !gamePageReady || pendingAuthCallback == null) return;

        Uri callback = pendingAuthCallback;
        pendingAuthCallback = null;

        String accessToken = callback.getQueryParameter("access_token");
        String refreshToken = callback.getQueryParameter("refresh_token");
        String error = callback.getQueryParameter("error");

        if (accessToken == null || accessToken.isEmpty() || refreshToken == null || refreshToken.isEmpty()) {
            String safeError = JSONObject.quote(
                error == null || error.isEmpty()
                    ? "O Google não devolveu uma sessão válida."
                    : error
            );
            evaluateWhenReady("window.failIdleNativeGoogleLogin && window.failIdleNativeGoogleLogin(" + safeError + ");");
            return;
        }

        String script = "window.completeIdleNativeGoogleLogin && window.completeIdleNativeGoogleLogin("
            + JSONObject.quote(accessToken)
            + ","
            + JSONObject.quote(refreshToken)
            + ");";
        evaluateWhenReady(script);
    }

    private void evaluateWhenReady(String action) {
        String script = "(function retryIdleNativeAuth(attempt){"
            + "if((window.completeIdleNativeGoogleLogin||window.failIdleNativeGoogleLogin)){"
            + action
            + "return;}"
            + "if(attempt<50)setTimeout(function(){retryIdleNativeAuth(attempt+1);},100);"
            + "})(0);";

        webView.post(() -> webView.evaluateJavascript(script, null));
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
