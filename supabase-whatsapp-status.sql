-- Fila protegida para avisos de status pelo WhatsApp Business Cloud API.
-- Nenhum relato clínico é copiado para esta fila.

alter table public.profiles add column if not exists whatsapp_opt_in_at timestamptz;
alter table public.profiles add column if not exists whatsapp_opt_out_at timestamptz;

create table if not exists public.whatsapp_status_outbox(
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.intake_requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.request_status not null,
  state text not null default 'pending' check(state in('pending','sending','sent','failed')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  unique(request_id,status)
);
alter table public.whatsapp_status_outbox enable row level security;
revoke all on public.whatsapp_status_outbox from public,anon,authenticated;
grant all on public.whatsapp_status_outbox to service_role;
create index if not exists whatsapp_status_claim_idx on public.whatsapp_status_outbox(state,updated_at,created_at);

create or replace function public.enqueue_whatsapp_status() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' and new.status is not distinct from old.status then return new; end if;
  if exists(select 1 from public.profiles p where p.id=new.user_id and p.whatsapp_opt_in_at is not null and p.whatsapp_opt_out_at is null and p.phone is not null) then
    insert into public.whatsapp_status_outbox(request_id,user_id,status) values(new.id,new.user_id,new.status) on conflict do nothing;
  end if;
  return new;
end $$;
revoke all on function public.enqueue_whatsapp_status() from public,anon,authenticated;
drop trigger if exists acolher_whatsapp_status on public.intake_requests;
create trigger acolher_whatsapp_status after insert or update of status on public.intake_requests for each row execute function public.enqueue_whatsapp_status();

create or replace function public.claim_whatsapp_status_events() returns setof public.whatsapp_status_outbox language sql security definer set search_path='' as $$
  update public.whatsapp_status_outbox
  set state='sending',attempts=attempts+1,updated_at=now()
  where id in(
    select id from public.whatsapp_status_outbox
    where state='pending' or (state='sending' and updated_at<now()-interval '5 minutes') or (state='failed' and attempts<5 and updated_at<now()-interval '10 minutes')
    order by created_at limit 20 for update skip locked
  ) returning *;
$$;
revoke all on function public.claim_whatsapp_status_events() from public,anon,authenticated;
grant execute on function public.claim_whatsapp_status_events() to service_role;

-- Atualiza o registro de novos pacientes com o consentimento dado no formulário.
create or replace function public.apply_patient_whatsapp_opt_in() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.raw_user_meta_data->>'account_type' is distinct from 'profissional' and new.raw_user_meta_data->>'whatsapp_updates'='true' then
    update public.profiles set whatsapp_opt_in_at=coalesce(whatsapp_opt_in_at,now()) where id=new.id;
  end if;
  return new;
end $$;
drop trigger if exists zz_acolher_whatsapp_opt_in on auth.users;
create trigger zz_acolher_whatsapp_opt_in after insert on auth.users for each row execute function public.apply_patient_whatsapp_opt_in();

