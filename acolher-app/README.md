# Espaço Acolher — aplicativo administrativo

Interface móvel conectada ao Supabase do site. Administrador vê gestão e sua área profissional; outros profissionais acessam somente seu próprio cadastro. Sem agenda. Não inclui credenciais administrativas nem chave privada de servidor.

Android 0.2.0: aplicativo híbrido com Firebase Messaging nativo. Em Gestão, toque em Ativar notificações neste celular e permita no Android. Notificações genéricas de novos pacientes, profissionais e solicitações; nenhuma informação clínica no aviso. Aberto: o serviço nativo mostra o aviso. Em segundo plano: Android/FCM apresenta a notificação. Forçar parada no Android impede entrega até reabrir. Não é possível conceder a permissão remotamente.

Servidor: `supabase-push.sql` configura fila privada, gatilhos e tentativa a cada minuto. `supabase/functions/acolher-push/index.ts` valida administrador para registrar dispositivos e segredo exclusivo para processar a fila. `FCM_SERVICE_ACCOUNT` e `PUSH_WEBHOOK_SECRET` ficam somente nos secrets do servidor; Vault usa `acolher_push_webhook`. Recibos evitam repetir envios já aceitos por dispositivo. Entrega FCM aceita não comprova leitura nem exibição física; confirmar com teste no aparelho.

O APK é compilado e verificado no GitHub, sem SDK local. A assinatura de desenvolvimento não é estável: atualização pode exigir reinstalação. Configurar assinatura definitiva antes de distribuição de produção. O JSON Google Services contém configuração pública, não chave privada.

A ponte WebView usa origem HTTPS exata, aceita apenas quadro principal na área do app e não persiste o token de sessão no Android. Sair da conta desativa o token de notificações. CRP automático e vínculo de pacientes a profissionais ainda não estão implementados.
