begin;
create temporary table acolher_guard_fixture on commit drop as select gen_random_uuid() id;
grant select on acolher_guard_fixture to authenticated;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) select id,'guard-'||id||'@example.invalid',now(),'{"full_name":"Teste de seguranca"}'::jsonb from acolher_guard_fixture;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from acolher_guard_fixture),'role','authenticated')::text,true);
set local role authenticated;
do $$begin
 begin
  insert into public.professional_applications(user_id,full_name,crp,phone,city,specialties,presentation,status) select id,'Teste','XX/'||id,'Teste','Teste','Teste','Teste','aprovado' from acolher_guard_fixture;
  raise exception 'FAIL: self approval accepted';
 exception when raise_exception then
  if sqlerrm not like 'Professional approval is managed%' then raise;end if;
 end;
 begin
  insert into public.intake_requests(user_id,for_whom,city,reason,details,modality,preferred_period,preferred_days,interest,desired_start,status,professional_note) select id,'Para mim','Teste','Teste','Historia ficticia para teste de seguranca','Online','Teste','Teste','Teste','Teste','em_atendimento','not allowed' from acolher_guard_fixture;
  raise exception 'FAIL: administrative intake fields accepted';
 exception when raise_exception then
  if sqlerrm not like 'Request status and notes are managed%' then raise;end if;
 end;
end$$;
insert into public.intake_requests(user_id,for_whom,city,reason,details,modality,preferred_period,preferred_days,interest,desired_start) select id,'Para mim','Teste','Teste','Historia ficticia para teste de seguranca','Online','Teste','Teste','Teste','Teste' from acolher_guard_fixture;
reset role;
rollback;
select 'PASS: self-approval blocked; administrative intake fields blocked; normal intake accepted; all synthetic data rolled back' as guards_test;
