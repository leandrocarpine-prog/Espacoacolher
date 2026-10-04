-- Administrative fields are never accepted from a new applicant/patient.
create or replace function public.guard_registration_fields() returns trigger
language plpgsql set search_path='' as $$
begin
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
  end if;
 end if;
 return new;
end$$;
drop trigger if exists acolher_registration_fields on public.professional_applications;
create trigger acolher_registration_fields before insert on public.professional_applications for each row execute function public.guard_registration_fields();
drop trigger if exists acolher_registration_fields on public.intake_requests;
create trigger acolher_registration_fields before insert on public.intake_requests for each row execute function public.guard_registration_fields();
