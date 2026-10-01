# Espaço Acolher

Site e aplicação estática para captação e organização inicial de solicitações de atendimento psicológico social em Rio Claro e região, com opção de atendimento online.

## Páginas

- `index.html`: área pública e pré-triagem obrigatória em seis etapas.
- `admin-login.html`: acesso administrativo protegido.
- `admin.html`: dashboard conectado ao Supabase para solicitações, triagens, profissionais, contatos e agenda.
- `profissionais.html`: entrada para profissionais cadastrados ou novos candidatos.
- `profissional.html`: login e cadastro profissional.
- `profissional-area.html`: acompanhamento do status do cadastro profissional.

## Privacidade e limites técnicos

A autenticação, os perfis, a pré-triagem e a área administrativa usam o projeto Supabase configurado. A senha nunca é armazenada no repositório. Este sistema organiza solicitações iniciais; não deve ser usado como prontuário eletrônico.

Depois do esquema principal, execute também `supabase-professionals.sql` no SQL Editor para ativar o cadastro profissional e as regras de acesso.

## Publicação

Aplicação sem etapa de compilação, compatível com GitHub Pages.
