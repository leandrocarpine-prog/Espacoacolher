# Espaço Acolher

Site e aplicação estática para captação e organização inicial de solicitações de atendimento psicológico social em Rio Claro e região, com opção de atendimento online.

## Páginas

- `index.html`: área pública e pré-triagem obrigatória em seis etapas.
- `admin.html`: painel local com dashboard, solicitações, triagens, contatos e agenda.

## Privacidade e limites técnicos

A pré-triagem não grava respostas no site: ela prepara uma mensagem que o visitante pode revisar e enviar pelo WhatsApp profissional. O painel administrativo usa apenas o armazenamento local do navegador e deixa essa limitação visível.

Esta versão **não possui banco de dados, autenticação ou prontuário eletrônico**. Para tratar dados reais de forma centralizada, é necessário configurar um backend seguro, controle de acesso e requisitos de privacidade adequados.

## Publicação

Aplicação sem etapa de compilação, compatível com GitHub Pages.
