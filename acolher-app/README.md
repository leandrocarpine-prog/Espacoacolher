# Espaço Acolher — aplicativo administrativo

Interface móvel própria conectada ao mesmo Supabase do site. Usa login administrativo existente e valida o papel admin no banco. Não contém senhas administrativas nem chave de serviço. Inclui resumo, pacientes, busca e filtros, pré-triagens completas, alteração de status, notas administrativas, análise e decisão de profissionais, contatos e agenda; atualização em tempo real enquanto aberto.

O projeto Android está em `android/`. A compilação e verificação de lint são executadas no GitHub Actions, sem instalar o SDK no computador local. O workflow publica APKs de avaliação em releases marcadas como pré-lançamento. A assinatura de desenvolvimento não é estável entre compilações: atualizações poderão exigir reinstalar. Uma chave de assinatura definitiva deve ser configurada antes de distribuir uma versão de produção.

O app usa a interface publicada em `/Espacoacolher/acolher-app/` por HTTPS em WebView. A interface é própria, não uma cópia do layout do painel. Depende de internet. Links externos abrem em outro aplicativo, não têm acesso à sessão administrativa. O Android não possui interface JavaScript nativa exposta à página.

Limitações: notificações push com o app fechado e consulta automática ao CRP ainda não integradas. A aprovação exige consultar o registro oficial. A agenda exibe os compromissos existentes, assim como no painel atual. Acesso ao painel original também disponível em Mais.
