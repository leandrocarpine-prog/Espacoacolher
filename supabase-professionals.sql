-- Espaço Acolher: cadastro e análise de profissionais.
-- Execute uma vez no SQL Editor do projeto Supabase já configurado.

create table if not exists public.professional_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  crp text not null unique,
  phone text not null,
  city text not null,
  specialties text not null,
  presentation text not null,
  status text not null default 'pendente' check (status in ('pendente','aprovado','recusado')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.professional_applications enable row level security;

drop policy if exists "profissional le o proprio cadastro" on public.professional_applications;
create policy "profissional le o proprio cadastro"
  on public.professional_applications for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "profissional cria o proprio cadastro" on public.professional_applications;
create policy "profissional cria o proprio cadastro"
  on public.professional_applications for insert
  with check (user_id = auth.uid());

drop policy if exists "administrador analisa profissionais" on public.professional_applications;
create policy "administrador analisa profissionais"
  on public.professional_applications for update
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists professional_applications_status_idx on public.professional_applications(status);
create index if not exists professional_applications_created_at_idx on public.professional_applications(created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, username, rg, address, city, phone, social, privacy_accepted_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'rg',
    new.raw_user_meta_data ->> 'address',
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'social',
    case when new.raw_user_meta_data ->> 'privacy_accepted' = 'true' then now() else null end
  );

  if new.raw_user_meta_data ->> 'account_type' = 'profissional' then
    insert into public.professional_applications (user_id, full_name, crp, phone, city, specialties, presentation)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      coalesce(new.raw_user_meta_data ->> 'crp', ''),
      coalesce(new.raw_user_meta_data ->> 'phone', ''),
      coalesce(new.raw_user_meta_data ->> 'city', ''),
      coalesce(new.raw_user_meta_data ->> 'specialties', ''),
      coalesce(new.raw_user_meta_data ->> 'presentation', '')
    );
  end if;
  return new;
end;
$$;
