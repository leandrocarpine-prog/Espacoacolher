alter table public.profiles
  add column if not exists rg text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists social text;

alter table public.intake_requests drop constraint if exists intake_requests_age_check;
alter table public.intake_requests add constraint intake_requests_age_check check (age between 0 and 120);

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
