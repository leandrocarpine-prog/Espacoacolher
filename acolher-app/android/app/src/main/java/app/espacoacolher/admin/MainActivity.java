package app.espacoacolher.admin;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
 private WebView web;
 private LinearLayout root;
 private View errorView;
 private static final String HOME = "https://leandrocarpine-prog.github.io/Espacoacolher/acolher-app/";
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(Color.rgb(245,249,251));
  root.setOnApplyWindowInsetsListener((v,insets)->{v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets.consumeSystemWindowInsets();});
  web = new WebView(this);
  WebSettings settings = web.getSettings(); settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true); settings.setAllowFileAccess(false); settings.setAllowContentAccess(false); settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW); settings.setTextZoom(100); settings.setSupportMultipleWindows(false);
  web.setBackgroundColor(Color.rgb(245,249,251));
  web.setWebViewClient(new WebViewClient() {
   @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
    Uri url = request.getUrl();
    if ("https".equals(url.getScheme()) && "leandrocarpine-prog.github.io".equals(url.getHost()) && url.getPath()!=null && url.getPath().startsWith("/Espacoacolher/")) return false;
    if ("https".equals(url.getScheme()) || "tel".equals(url.getScheme()) || "mailto".equals(url.getScheme())) {
     try { startActivity(new Intent(Intent.ACTION_VIEW,url)); } catch (android.content.ActivityNotFoundException ignored) { }
    }
    return true;
   }
   @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) { if(request.isForMainFrame()) showError(); }
   @Override public void onPageFinished(WebView view,String url) { if(errorView==null)web.setVisibility(View.VISIBLE); }
  });
  root.addView(web,new LinearLayout.LayoutParams(-1,0,1)); setContentView(root);
  if(state==null || web.restoreState(state)==null)web.loadUrl(HOME);
 }
 private void showError() {
  if(errorView!=null)return;
  LinearLayout box=new LinearLayout(this);box.setOrientation(LinearLayout.VERTICAL);box.setPadding(40,100,40,40);
  TextView text=new TextView(this);text.setText("Espaço Acolher\n\nNão foi possível conectar. Confira sua internet e tente novamente.");text.setTextSize(22);box.addView(text);
  Button retry=new Button(this);retry.setText("Tentar novamente");retry.setOnClickListener(v->{root.removeView(errorView);errorView=null;web.setVisibility(View.VISIBLE);web.loadUrl(HOME);});box.addView(retry);
  errorView=box;web.setVisibility(View.GONE);root.addView(box);
 }
 @Override public void onBackPressed() { if(web.canGoBack())web.goBack();else super.onBackPressed(); }
 @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);web.saveState(state);}
 @Override protected void onPause(){super.onPause();web.onPause();}
 @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
 @Override protected void onDestroy(){web.destroy();super.onDestroy();}
}
