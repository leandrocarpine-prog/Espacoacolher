-- Administrative fields are never accepted from a new applicant/patient.
alter table public.intake_requests add column if not exists consent_accepted boolean;
alter table public.intake_requests add column if not exists consent_at timestamptz;
alter table public.intake_requests add column if not exists privacy_version text;
alter table public.professional_applications add column if not exists consent_at timestamptz;
alter table public.professional_applications add column if not exists privacy_version text;
alter table public.professional_applications add column if not exists crp_checked_at timestamptz;
alter table public.professional_applications add column if not exists crp_checked_by uuid references auth.users(id) on delete set null;
alter table public.professional_applications alter column consent_at set default now();
alter table public.professional_applications alter column privacy_version set default '2026-10-04';
create or replace function public.guard_registration_fields() returns trigger
language plpgsql set search_path='' as $$
begin
 if tg_table_name='professional_applications' then
  if char_length(trim(new.full_name)) not between 5 and 120 or new.crp !~ '^[0-9]{2}/[0-9]{4,6}$' or char_length(regexp_replace(new.phone,'[^0-9]','','g')) not between 10 and 13 or char_length(trim(new.city)) not between 2 and 100 or char_length(trim(new.specialties)) not between 3 and 300 or char_length(trim(new.presentation)) not between 20 and 600 then
   raise exception 'Invalid professional registration data';
  end if;
 elsif tg_table_name='intake_requests' then
  if char_length(trim(new.city)) not between 2 and 100 or new.modality not in ('Presencial em Rio Claro','Online','Sem preferência') or new.preferred_period not in ('Manhã','Tarde','Noite','Flexível') or new.interest not in ('Atendimento com valor social','Atendimento particular','Quero conhecer todas as possibilidades') or new.desired_start not in ('O quanto antes','Nas próximas semanas','Ainda estou pesquisando') then
   raise exception 'Invalid intake data';
  end if;
 end if;
 if current_user in ('anon','authenticated') then
  if not public.has_verified_email() then raise exception 'Confirm your email first'; end if;
  if tg_table_name='professional_applications' then
   if new.status <> 'pendente' or new.reviewed_at is not null or new.reviewed_by is not null then
    raise exception 'Professional approval is managed by the administrator';
   end if;
  elsif tg_table_name='intake_requests' then
   if new.status <> 'nova' or new.professional_note is not null then
    raise exception 'Request status and notes are managed by the administrator';
   end if;
   if new.consent_accepted is not true then raise exception 'Privacy consent is required';end if;
   new.consent_at=now();new.privacy_version='2026-10-04';
  end if;
 end if;
 return new;
end$$;
drop trigger if exists acolher_registration_fields on public.professional_applications;
create trigger acolher_registration_fields before insert on public.professional_applications for each row execute function public.guard_registration_fields();
drop trigger if exists acolher_registration_fields on public.intake_requests;
create trigger acolher_registration_fields before insert on public.intake_requests for each row execute function public.guard_registration_fields();
create or replace function public.record_professional_review() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.status is distinct from old.status then
  if not public.is_admin() then raise exception 'Only an administrator can review professionals';end if;
  new.reviewed_at=now();new.reviewed_by=auth.uid();
  if new.status='aprovado' then new.crp_checked_at=now();new.crp_checked_by=auth.uid();
  else new.crp_checked_at=null;new.crp_checked_by=null;end if;
 end if;
 return new;
end$$;
drop trigger if exists acolher_record_professional_review on public.professional_applications;
create trigger acolher_record_professional_review before update on public.professional_applications for each row execute function public.record_professional_review();
