package app.espacoacolher.admin;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class AcolherMessagingService extends FirebaseMessagingService {
 static final String CHANNEL = "acolher_cadastros";
 static void createChannel(Context context) {
  NotificationChannel channel = new NotificationChannel(CHANNEL,"Novos cadastros",NotificationManager.IMPORTANCE_HIGH);
  channel.setDescription("Avisos administrativos do Espaço Acolher");
  context.getSystemService(NotificationManager.class).createNotificationChannel(channel);
 }
 @Override public void onMessageReceived(RemoteMessage message) {
  if(!getSharedPreferences("push",MODE_PRIVATE).getBoolean("enabled",false))return;
  createChannel(this);
  Intent intent=new Intent(this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
  PendingIntent open=PendingIntent.getActivity(this,0,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  String body=message.getNotification()!=null?message.getNotification().getBody():"Há um novo cadastro para analisar.";
  Notification alert=new Notification.Builder(this,CHANNEL).setSmallIcon(R.drawable.ic_notification)
   .setContentTitle("Espaço Acolher").setContentText(body).setStyle(new Notification.BigTextStyle().bigText(body))
   .setContentIntent(open).setAutoCancel(true).build();
  String tag=message.getData().get("event_id");
  try{getSystemService(NotificationManager.class).notify(tag==null?"cadastro":tag,1,alert);}catch(SecurityException ignored){}
 }
}
