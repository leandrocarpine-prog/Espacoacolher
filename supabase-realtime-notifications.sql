-- Habilita os avisos do painel administrativo quando novos registros chegam.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='professional_applications') then
    alter publication supabase_realtime add table public.professional_applications;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='intake_requests') then
    alter publication supabase_realtime add table public.intake_requests;
  end if;
end $$;
