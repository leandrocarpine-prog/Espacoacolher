-- Server-only queue: no clinical data, no public access, no FCM keys.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
create table if not exists public.admin_push_devices(token text primary key,user_id uuid not null references public.profiles(id) on delete cascade,updated_at timestamptz not null default now());
create table if not exists public.push_outbox(id uuid primary key default gen_random_uuid(),kind text not null,source_id uuid not null,state text not null default 'pending',last_error text,updated_at timestamptz not null default now(),created_at timestamptz not null default now(),unique(kind,source_id));
alter table public.admin_push_devices enable row level security;
alter table public.push_outbox enable row level security;
revoke all on public.admin_push_devices,public.push_outbox from anon,authenticated;
grant all on public.admin_push_devices,public.push_outbox to service_role;
create or replace function public.claim_push_events() returns setof public.push_outbox language sql security definer set search_path='' as $$
 update public.push_outbox set state='sending',updated_at=now() where id in(select id from public.push_outbox where state='pending' or (state='sending' and updated_at<now()-interval '5 minutes') order by created_at limit 20 for update skip locked) returning *;
$$;
revoke all on function public.claim_push_events() from public,anon,authenticated;
grant execute on function public.claim_push_events() to service_role;
create or replace function public.dispatch_push_queue() returns void language plpgsql security definer set search_path='' as $$
declare secret text;
begin
 select decrypted_secret into secret from vault.decrypted_secrets where name='acolher_push_webhook' limit 1;
 if secret is not null then perform net.http_post(url:='https://lunnyaxxkineezrsclbx.supabase.co/functions/v1/acolher-push',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1bm55YXh4a2luZWV6cnNjbGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTk3NzcsImV4cCI6MjEwNjI5NTc3N30.lrw6PNr2wnejJttIKGef5__v-pyKPNJI0gRXgLUyfxA','x-webhook-secret',secret),body:='{}'::jsonb,timeout_milliseconds:=10000);end if;
end $$;
revoke all on function public.dispatch_push_queue() from public,anon,authenticated;
create or replace function public.enqueue_registration_push() returns trigger language plpgsql security definer set search_path='' as $$
declare kind text;
begin
 if tg_table_name='profiles' then
  if new.role='admin' or exists(select 1 from auth.users where id=new.id and raw_user_meta_data->>'account_type'='profissional') then return new;end if;
  kind:='patient';
 elsif tg_table_name='professional_applications' then kind:='professional';else kind:='intake';end if;
 insert into public.push_outbox(kind,source_id) values(kind,new.id) on conflict do nothing;
 -- A notification outage must never roll back a registration.
 begin perform public.dispatch_push_queue();exception when others then null;end;
 return new;
end $$;
revoke all on function public.enqueue_registration_push() from public,anon,authenticated;
drop trigger if exists acolher_patient_push on public.profiles;
create trigger acolher_patient_push after insert on public.profiles for each row execute function public.enqueue_registration_push();
drop trigger if exists acolher_professional_push on public.professional_applications;
create trigger acolher_professional_push after insert on public.professional_applications for each row execute function public.enqueue_registration_push();
drop trigger if exists acolher_intake_push on public.intake_requests;
create trigger acolher_intake_push after insert on public.intake_requests for each row execute function public.enqueue_registration_push();
do $$begin if not exists(select 1 from cron.job where jobname='acolher-push-retry') then perform cron.schedule('acolher-push-retry','* * * * *','select public.dispatch_push_queue()');end if;end$$;
