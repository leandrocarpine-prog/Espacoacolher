-- Synthetic, transactional test only. No CPF, password, real patient or outgoing email.
-- ROLLBACK removes Auth/profile/intake/outbox rows and pending pg_net requests.
begin;
create temporary table acolher_flow_fixture on commit drop as select gen_random_uuid() as id;
grant select on acolher_flow_fixture to authenticated;
insert into auth.users(id,email,raw_user_meta_data) select id,'fixture-'||id||'@example.invalid','{"full_name":"Teste transacional"}'::jsonb from acolher_flow_fixture;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from acolher_flow_fixture),'role','authenticated')::text,true);
set local role authenticated;
do $$begin
 if public.has_verified_email() then raise exception 'FAIL: unconfirmed account marked confirmed';end if;
 begin
  update public.profiles set email_verified_at=now() where id=(select id from acolher_flow_fixture);
  raise exception 'FAIL: patient can self-confirm';
 exception when raise_exception then
  if sqlerrm not like 'Email verification is managed%' then raise;end if;
 end;
 begin
  insert into public.intake_requests(user_id,for_whom,age,city,reason,details,modality,preferred_period,preferred_days,interest,desired_start)
  select id,'Para mim',30,'Cidade fictícia','Teste de fluxo','Relato fictício exclusivamente para verificar o fluxo.','Online','Flexível','Teste','Teste','Teste' from acolher_flow_fixture;
  raise exception 'FAIL: unconfirmed account submitted an intake';
 exception when insufficient_privilege then null;
 end;
end$$;
reset role;
update auth.users set email_confirmed_at=now() where id=(select id from acolher_flow_fixture);
set local role authenticated;
do $$begin
 if not public.has_verified_email() then raise exception 'FAIL: verified account blocked';end if;
 if not exists(select 1 from public.profiles where id=(select id from acolher_flow_fixture) and email_verified_at is not null) then raise exception 'FAIL: profile verification not synchronized';end if;
 begin
  insert into public.intake_requests(user_id,for_whom,age,city,reason,details,modality,preferred_period,preferred_days,interest,desired_start)
  select id,'Para mim',30,'Cidade fictícia','Teste de fluxo','','Online','Flexível','Teste','Teste','Teste' from acolher_flow_fixture;
  raise exception 'FAIL: empty story accepted';
 exception when raise_exception then
  if sqlerrm not like 'Explain the reason%' then raise;end if;
 end;
end$$;
insert into public.intake_requests(user_id,for_whom,age,city,reason,details,modality,preferred_period,preferred_days,interest,desired_start)
select id,'Para mim',30,'Cidade fictícia','Teste de fluxo','Relato fictício exclusivamente para verificar o fluxo.','Online','Flexível','Teste','Teste','Teste' from acolher_flow_fixture;
reset role;
do $$begin
 if not exists(select 1 from public.push_outbox where kind='patient' and source_id=(select id from acolher_flow_fixture)) then raise exception 'FAIL: registration notification missing';end if;
 if not exists(select 1 from public.push_outbox p join public.intake_requests i on i.id=p.source_id where p.kind='intake' and i.user_id=(select id from acolher_flow_fixture)) then raise exception 'FAIL: intake notification missing';end if;
end$$;
rollback;
select 'PASS: unconfirmed access denied; cannot self-confirm; verified intake accepted; empty story denied; registration and intake queued; all test data rolled back.' as flow_test;
