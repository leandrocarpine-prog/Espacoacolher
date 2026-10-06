-- Espaço Acolher: motivo inicial obrigatório, relato original e aviso imediato.
-- Execute depois da estrutura principal e das rotinas de e-mail/push.

alter table public.profiles add column if not exists registration_for_whom text;
alter table public.profiles add column if not exists registration_reason text;
alter table public.profiles add column if not exists registration_details text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='profiles_registration_for_whom_valid') then
    alter table public.profiles add constraint profiles_registration_for_whom_valid
      check (registration_for_whom is null or registration_for_whom in ('Para mim','Filho(a)','Familiar'));
  end if;
  if not exists (select 1 from pg_constraint where conname='profiles_registration_details_length') then
    alter table public.profiles add constraint profiles_registration_details_length
      check (registration_details is null or char_length(trim(registration_details)) between 30 and 1200);
  end if;
end $$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path='' as $$
declare account_type text:=coalesce(new.raw_user_meta_data->>'account_type','paciente');
begin
  if new.raw_user_meta_data->>'privacy_accepted' is distinct from 'true' then
    raise exception 'Privacy acceptance is required';
  end if;
  if char_length(trim(coalesce(new.raw_user_meta_data->>'full_name',''))) not between 5 and 120 then
    raise exception 'Invalid full name';
  end if;

  if account_type='profissional' then
    if coalesce(new.raw_user_meta_data->>'crp','') !~ '^[0-9]{2}/[0-9]{4,6}$'
      or char_length(regexp_replace(coalesce(new.raw_user_meta_data->>'phone',''),'[^0-9]','','g')) not between 10 and 13
      or char_length(trim(coalesce(new.raw_user_meta_data->>'city',''))) not between 2 and 100
      or char_length(trim(coalesce(new.raw_user_meta_data->>'specialties',''))) not between 3 and 300
      or char_length(trim(coalesce(new.raw_user_meta_data->>'presentation',''))) not between 20 and 600 then
      raise exception 'Invalid professional registration data';
    end if;
  elsif account_type='paciente' then
    if coalesce(new.raw_user_meta_data->>'username','') !~ '^[a-z0-9._-]{3,24}$'
      or char_length(regexp_replace(coalesce(new.raw_user_meta_data->>'rg',''),'[^0-9]','','g'))<>11
      or char_length(regexp_replace(coalesce(new.raw_user_meta_data->>'phone',''),'[^0-9]','','g')) not between 10 and 11
      or char_length(trim(coalesce(new.raw_user_meta_data->>'city',''))) not between 2 and 100
      or char_length(trim(coalesce(new.raw_user_meta_data->>'address',''))) not between 5 and 300
      or coalesce(new.raw_user_meta_data->>'registration_for_whom','') not in ('Para mim','Filho(a)','Familiar')
      or char_length(trim(coalesce(new.raw_user_meta_data->>'registration_reason',''))) not between 3 and 120
      or char_length(trim(coalesce(new.raw_user_meta_data->>'registration_details',''))) not between 30 and 1200 then
      raise exception 'Invalid patient registration data';
    end if;
  else
    raise exception 'Invalid account type';
  end if;

  insert into public.profiles(
    id,full_name,username,rg,address,city,phone,social,privacy_accepted_at,email_verified_at,
    registration_for_whom,registration_reason,registration_details
  ) values(
    new.id,trim(new.raw_user_meta_data->>'full_name'),new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'rg',new.raw_user_meta_data->>'address',new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'phone',new.raw_user_meta_data->>'social',now(),new.email_confirmed_at,
    case when account_type='paciente' then new.raw_user_meta_data->>'registration_for_whom' end,
    case when account_type='paciente' then new.raw_user_meta_data->>'registration_reason' end,
    case when account_type='paciente' then trim(new.raw_user_meta_data->>'registration_details') end
  );
  return new;
end $$;

-- O administrador é avisado no cadastro, antes da confirmação do e-mail.
-- A notificação externa permanece genérica; o relato só aparece após login administrativo.
create or replace function public.enqueue_registration_push() returns trigger
language plpgsql security definer set search_path='' as $$
declare kind text;
begin
  if tg_table_name='profiles' then
    if new.role='admin'
      or exists(select 1 from auth.users where id=new.id and raw_user_meta_data->>'account_type'='profissional') then
      return new;
    end if;
    kind:='patient';
  elsif tg_table_name='professional_applications' then
    kind:='professional';
  else
    kind:='intake';
  end if;
  insert into public.push_outbox(kind,source_id) values(kind,new.id) on conflict do nothing;
  begin perform public.dispatch_push_queue(); exception when others then null; end;
  return new;
end $$;
revoke all on function public.enqueue_registration_push() from public,anon,authenticated;

drop trigger if exists acolher_patient_push on public.profiles;
create trigger acolher_patient_push after insert on public.profiles
for each row execute function public.enqueue_registration_push();

create index if not exists profiles_registration_reason_idx on public.profiles(registration_reason);

