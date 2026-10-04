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
import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import androidx.webkit.JavaScriptReplyProxy;
import com.google.firebase.messaging.FirebaseMessaging;
import java.util.Collections;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

public class MainActivity extends Activity {
 private WebView web;
 private LinearLayout root;
 private View errorView;
 private JavaScriptReplyProxy pushReply;
 private String pendingAccess;
 private final java.util.concurrent.ExecutorService pushWorker=java.util.concurrent.Executors.newSingleThreadExecutor();
 private static final String HOME = "https://leandrocarpine-prog.github.io/Espacoacolher/acolher-app/";
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(Color.rgb(245,249,251));
  root.setOnApplyWindowInsetsListener((v,insets)->{v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets.consumeSystemWindowInsets();});
  web = new WebView(this);
  WebSettings settings = web.getSettings(); settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true); settings.setAllowFileAccess(false); settings.setAllowContentAccess(false); settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW); settings.setTextZoom(100); settings.setSupportMultipleWindows(false);
  web.setBackgroundColor(Color.rgb(245,249,251));
  AcolherMessagingService.createChannel(this);
  if(WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
   WebViewCompat.addWebMessageListener(web,"AcolherPush",Collections.singleton("https://leandrocarpine-prog.github.io"),(view,message,origin,mainFrame,reply)->{
    if(!mainFrame||view.getUrl()==null||!view.getUrl().startsWith(HOME))return;
    try {
     JSONObject request=new JSONObject(message.getData());String access=request.optString("access_token");
     if(access.length()<20||access.length()>8192)return;
     String action=request.optString("action");
     if("unregister".equals(action)) {
      getSharedPreferences("push",MODE_PRIVATE).edit().putBoolean("enabled",false).apply();
      FirebaseMessaging.getInstance().setAutoInitEnabled(false);
      FirebaseMessaging.getInstance().getToken().addOnCompleteListener(token->{
       if(token.isSuccessful())sendRegistration("unregister",access,token.getResult(),reply);
       FirebaseMessaging.getInstance().deleteToken();
      });
      return;
     }
     if(!"register".equals(action))return;
     pushReply=reply;pendingAccess=access;
     if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED) {
      requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},101);return;
     }
     registerPush();
    }catch(Exception ignored){reply.postMessage("{\"registered\":false,\"error\":\"request\"}");}
   });
  }
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
 private void registerPush() {
  final String access=pendingAccess;final JavaScriptReplyProxy reply=pushReply;pendingAccess=null;pushReply=null;
  if(access==null||reply==null)return;
  if(!getSystemService(android.app.NotificationManager.class).areNotificationsEnabled()) {reply.postMessage("{\"registered\":false,\"error\":\"permission\"}");return;}
  FirebaseMessaging.getInstance().setAutoInitEnabled(true);
  FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task->{
   if(task.isSuccessful())sendRegistration("register",access,task.getResult(),reply);
   else reply.postMessage("{\"registered\":false,\"error\":\"token\"}");
  });
 }
 private void sendRegistration(String action,String access,String token,JavaScriptReplyProxy reply) {
  pushWorker.execute(()->{
   boolean success=false;HttpURLConnection connection=null;
   try {
    connection=(HttpURLConnection)new URL("https://lunnyaxxkineezrsclbx.supabase.co/functions/v1/acolher-push").openConnection();
    connection.setRequestMethod("POST");connection.setConnectTimeout(10000);connection.setReadTimeout(10000);connection.setDoOutput(true);
    connection.setRequestProperty("Authorization","Bearer "+access);connection.setRequestProperty("Content-Type","application/json");
    byte[] body=new JSONObject().put("action",action).put("token",token).toString().getBytes(StandardCharsets.UTF_8);
    try(java.io.OutputStream stream=connection.getOutputStream()){stream.write(body);}
    success=connection.getResponseCode()==200;
   }catch(Exception ignored){}finally{if(connection!=null)connection.disconnect();}
   if("register".equals(action))getSharedPreferences("push",MODE_PRIVATE).edit().putBoolean("enabled",success).apply();
   final boolean done=success;
   runOnUiThread(()->{if(!isFinishing()&&!isDestroyed())reply.postMessage(done&&"register".equals(action)?"{\"registered\":true}":"{\"registered\":false,\"error\":\"server\"}");});
  });
 }
 @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] results) {
  super.onRequestPermissionsResult(code,permissions,results);
  if(code==101)registerPush();
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
 @Override protected void onDestroy(){pendingAccess=null;pushReply=null;pushWorker.shutdown();web.destroy();super.onDestroy();}
}
