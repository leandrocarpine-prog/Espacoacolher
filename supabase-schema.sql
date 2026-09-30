-- Espaço Acolher: estrutura inicial de autenticação e acompanhamento.
-- Execute no SQL Editor do projeto Supabase.

create type public.user_role as enum ('usuario', 'admin');
create type public.request_status as enum (
  'nova', 'em_analise', 'contato_realizado', 'agendada',
  'em_atendimento', 'lista_espera', 'encaminhada', 'encerrada'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  rg text,
  address text,
  city text,
  phone text,
  social text,
  role public.user_role not null default 'usuario',
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.intake_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  for_whom text not null,
  age integer check (age between 0 and 120),
  city text not null,
  reason text not null,
  details text,
  modality text not null,
  preferred_period text not null,
  preferred_days text not null,
  interest text not null,
  desired_start text not null,
  status public.request_status not null default 'nova',
  professional_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  intake_request_id uuid references public.intake_requests(id) on delete set null,
  starts_at timestamptz not null,
  modality text not null,
  status text not null default 'agendado',
  public_note text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, rg, address, city, phone, social, privacy_accepted_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'rg',
    new.raw_user_meta_data ->> 'address',
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'social',
    case when new.raw_user_meta_data ->> 'privacy_accepted' = 'true' then now() else null end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.intake_requests enable row level security;
alter table public.appointments enable row level security;

create policy "usuarios leem o proprio perfil"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "usuarios atualizam o proprio perfil"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'usuario');

create policy "usuarios criam a propria solicitacao"
  on public.intake_requests for insert
  with check (user_id = auth.uid());

create policy "usuarios leem as proprias solicitacoes"
  on public.intake_requests for select
  using (user_id = auth.uid() or public.is_admin());

create policy "administrador atualiza solicitacoes"
  on public.intake_requests for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "usuarios leem os proprios agendamentos"
  on public.appointments for select
  using (user_id = auth.uid() or public.is_admin());

create policy "administrador gerencia agendamentos"
  on public.appointments for all
  using (public.is_admin())
  with check (public.is_admin());

create index intake_requests_user_id_idx on public.intake_requests(user_id);
create index intake_requests_status_idx on public.intake_requests(status);
create index appointments_user_id_idx on public.appointments(user_id);
create index appointments_starts_at_idx on public.appointments(starts_at);
