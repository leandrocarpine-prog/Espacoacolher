-- Confirmation state is maintained by Auth, never by a patient/browser.
alter table public.profiles add column if not exists email_verified_at timestamptz;
update public.profiles p set email_verified_at=u.email_confirmed_at from auth.users u where p.id=u.id;
create or replace function public.sync_email_verification() returns trigger language plpgsql security definer set search_path='' as $$
begin update public.profiles set email_verified_at=new.email_confirmed_at where id=new.id;return new;end$$;
revoke all on function public.sync_email_verification() from public,anon,authenticated;
drop trigger if exists zz_acolher_email_status on auth.users;
create trigger zz_acolher_email_status after insert or update of email_confirmed_at on auth.users for each row execute function public.sync_email_verification();
create or replace function public.guard_email_verification() returns trigger language plpgsql set search_path='' as $$
begin
 if current_user in ('anon','authenticated') and new.email_verified_at is distinct from old.email_verified_at then raise exception 'Email verification is managed by Auth';end if;
 return new;
end$$;
drop trigger if exists acolher_guard_email_status on public.profiles;
create trigger acolher_guard_email_status before update on public.profiles for each row execute function public.guard_email_verification();
create or replace function public.has_verified_email() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null)$$;
revoke all on function public.has_verified_email() from public,anon;
grant execute on function public.has_verified_email() to authenticated;
drop policy if exists "usuarios criam a propria solicitacao" on public.intake_requests;
create policy "usuarios criam a propria solicitacao" on public.intake_requests for insert to authenticated with check(user_id=auth.uid() and public.has_verified_email());
-- Existing requests are preserved; minimum detail applies to new inserts only.
create or replace function public.validate_intake_story() returns trigger language plpgsql set search_path='' as $$
begin
 if char_length(trim(coalesce(new.details,''))) not between 20 and 2000 then raise exception 'Explain the reason for seeking therapy in 20 to 2000 characters';end if;
 if new.for_whom not in ('Para mim','Filho(a)','Familiar') then raise exception 'Choose who the care is for';end if;
 return new;
end$$;
drop trigger if exists acolher_validate_intake_story on public.intake_requests;
create trigger acolher_validate_intake_story before insert on public.intake_requests for each row execute function public.validate_intake_story();
