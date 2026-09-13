-- Shared session state, private GM notes and server-owned append-only history.
create table if not exists public.campaign_sessions (
 campaign_id uuid primary key references public.campaigns(id) on delete cascade,
 state jsonb not null default '{}'::jsonb,
 revision integer not null default 0
);
create table if not exists public.campaign_master_notes (
 campaign_id uuid primary key references public.campaigns(id) on delete cascade,
 notes text not null default ''
);
create table if not exists public.campaign_events (
 id bigint generated always as identity primary key,
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 character_id uuid references public.characters(id) on delete set null,
 owner_id uuid,
 actor_id uuid default auth.uid(),
 kind text not null,
 payload jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.campaign_sessions enable row level security;
alter table public.campaign_master_notes enable row level security;
alter table public.campaign_events enable row level security;
drop policy if exists session_members on public.campaign_sessions;
create policy session_members on public.campaign_sessions for select to authenticated using (private.is_campaign_member(campaign_id));
drop policy if exists notes_master on public.campaign_master_notes;
create policy notes_master on public.campaign_master_notes for all to authenticated using (private.is_campaign_master(campaign_id)) with check (private.is_campaign_master(campaign_id));
drop policy if exists events_read on public.campaign_events;
create policy events_read on public.campaign_events for select to authenticated using (private.is_campaign_member(campaign_id) and (owner_id is null or owner_id=auth.uid() or private.is_campaign_master(campaign_id)));
grant select on public.campaign_sessions,public.campaign_events to authenticated;
grant select,insert,update on public.campaign_master_notes to authenticated;
alter table public.character_conditions add column if not exists expires_round integer;
alter table public.character_conditions add column if not exists duration_note text not null default '';

create or replace function public.save_campaign_session(target_id uuid, expected_revision integer, next_state jsonb) returns integer
language plpgsql security definer set search_path=public,pg_temp as $$
declare next_revision integer; previous campaign_sessions; turn_index integer; actor characters; entering boolean;
begin
 if not private.is_campaign_master(target_id) then raise exception 'Apenas o Mestre pode editar a sessão.'; end if;
 if jsonb_typeof(next_state) is distinct from 'object' or expected_revision is null or octet_length(next_state::text)>1000000 then raise exception 'Sessão inválida ou grande demais.'; end if;
 insert into campaign_sessions(campaign_id) values(target_id) on conflict do nothing;
 select * into previous from campaign_sessions where campaign_id=target_id for update;
 if previous.revision<>expected_revision then raise exception 'A sessão mudou em outra tela. Atualize antes de salvar.'; end if;
 delete from character_conditions cc using characters c where cc.character_id=c.id and c.campaign_id=target_id and cc.expires_round is not null and cc.expires_round <= coalesce((next_state->'combat'->>'round')::integer,0);
 turn_index=coalesce((next_state->'combat'->>'turn')::int,0);
 entering=coalesce((next_state->'combat'->>'active')::boolean,false) and (
  not coalesce((previous.state->'combat'->>'active')::boolean,false)
  or next_state->'combat'->>'round' is distinct from previous.state->'combat'->>'round'
  or next_state->'combat'->'entries'->turn_index->>'id' is distinct from previous.state->'combat'->'entries'->coalesce((previous.state->'combat'->>'turn')::int,0)->>'id');
 if entering then
  select * into actor from characters where campaign_id=target_id and id::text=next_state->'combat'->'entries'->turn_index->>'id' for update;
  if actor.id is not null then
   if exists(select 1 from character_conditions where character_id=actor.id and condition_id='bleeding') then
    update characters set sheet=jsonb_set(sheet,'{resources,hp}',to_jsonb(greatest(0,coalesce((sheet->'resources'->>'hp')::int,0)-4))) where id=actor.id;
   end if;
   if exists(select 1 from character_conditions where character_id=actor.id and condition_id='stunned') then
    next_state=jsonb_set(next_state,array['combat','entries',turn_index::text,'actions'],'0');
    delete from character_conditions where character_id=actor.id and condition_id='stunned';
   end if;
   if exists(select 1 from character_conditions where character_id=actor.id and condition_id='tactical-collapse') then
    next_state=jsonb_set(next_state,array['combat','entries',turn_index::text,'reactions'],'0');
   end if;
   if exists(select 1 from character_conditions where character_id=actor.id and condition_id='immobilized') then
    next_state=jsonb_set(next_state,array['combat','entries',turn_index::text,'movement'],'0');
   end if;
  end if;
 end if;
 update campaign_sessions set state=next_state,revision=revision+1 where campaign_id=target_id and revision=expected_revision returning revision into next_revision;
 if next_revision is null then raise exception 'A sessão mudou em outra tela. Atualize antes de salvar.'; end if;
 insert into campaign_events(campaign_id,kind,payload) values(target_id,'session',jsonb_build_object('revision',next_revision,'state',next_state));
 return next_revision;
end $$;

create or replace function public.roll_campaign_dice(target_id uuid, dice_count integer, dice_sides integer, modifier integer, reason text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare rolls integer[]; result jsonb;
begin
 if not private.is_campaign_member(target_id) then raise exception 'Acesso negado.'; end if;
 if dice_count is null or dice_sides is null or modifier is null or dice_count not between 1 and 20 or dice_sides not in (4,6,8,10,12,20,100) or modifier not between -999 and 999 then raise exception 'Fórmula inválida.'; end if;
 select array_agg(1+floor(random()*dice_sides)::integer) into rolls from generate_series(1,dice_count);
 result=jsonb_build_object('formula',dice_count||'d'||dice_sides||case when modifier>=0 then '+' else '' end||modifier,'rolls',rolls,'total',(select sum(x) from unnest(rolls) x)+modifier,'reason',left(reason,300));
 insert into campaign_events(campaign_id,kind,payload) values(target_id,'roll',result);
 return result;
end $$;

create or replace function private.audit_character_sheet() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if tg_op='UPDATE' and old.sheet is distinct from new.sheet then
 insert into campaign_events(campaign_id,character_id,owner_id,kind,payload) values(new.campaign_id,new.id,new.owner_id,'sheet',jsonb_build_object('name',coalesce(new.sheet->'identity'->>'codename',new.sheet->'identity'->>'name'),'before',old.sheet,'after',new.sheet));
 end if;
 return new;
end $$;
drop trigger if exists audit_character_sheet on public.characters;
create trigger audit_character_sheet after update on public.characters for each row execute function private.audit_character_sheet();

create or replace function private.protect_master_adjustments() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not private.is_campaign_master(new.campaign_id) then
  if tg_op='INSERT' then new.sheet=new.sheet-'masterAdjustments';
  else new.sheet=(new.sheet-'masterAdjustments')||case when old.sheet?'masterAdjustments' then jsonb_build_object('masterAdjustments',old.sheet->'masterAdjustments') else '{}'::jsonb end; end if;
 end if;
 return new;
end $$;
drop trigger if exists protect_master_adjustments on public.characters;
create trigger protect_master_adjustments before insert or update on public.characters for each row execute function private.protect_master_adjustments();

create or replace function private.audit_condition_change() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare row_data jsonb; target characters;
begin
 row_data=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 select * into target from characters where id=(row_data->>'character_id')::uuid;
 if target.id is not null then insert into campaign_events(campaign_id,character_id,owner_id,kind,payload) values(target.campaign_id,target.id,target.owner_id,'condition',jsonb_build_object('operation',tg_op,'condition',row_data)); end if;
 return coalesce(new,old);
end $$;
drop trigger if exists audit_condition_change on public.character_conditions;
create trigger audit_condition_change after insert or update or delete on public.character_conditions for each row execute function private.audit_condition_change();

create or replace function public.restore_campaign_backup(target_id uuid, backup jsonb) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare entry jsonb; saved_id uuid;
begin
 if not private.is_campaign_master(target_id) then raise exception 'Apenas o Mestre pode restaurar.'; end if;
 if backup->>'format' is distinct from 'orion-campaign' or (backup->>'version')::int is distinct from 1 or backup->>'campaignId' is distinct from target_id::text or jsonb_typeof(backup->'characters') is distinct from 'array' or octet_length(backup::text)>15000000 then raise exception 'Backup inválido ou de outra campanha.'; end if;
 for entry in select value from jsonb_array_elements(backup->'characters') loop
  if not exists(select 1 from campaign_members where campaign_id=target_id and user_id=(entry->>'ownerId')::uuid) then raise exception 'Participante do backup não pertence mais à campanha.'; end if;
  if jsonb_typeof(entry->'sheet') is distinct from 'object' then raise exception 'Ficha inválida.'; end if;
  insert into characters(campaign_id,owner_id,sheet) values(target_id,(entry->>'ownerId')::uuid,entry->'sheet') on conflict(campaign_id,owner_id) do update set sheet=excluded.sheet returning id into saved_id;
  delete from character_conditions where character_id=saved_id;
  insert into character_conditions(character_id,condition_id,added_by,expires_round,duration_note)
  select saved_id,value->>'conditionId',auth.uid(),(value->>'expiresRound')::integer,coalesce(value->>'durationNote','') from jsonb_array_elements(coalesce(entry->'conditions','[]'::jsonb));
 end loop;
 update campaigns set name=left(backup->'campaign'->>'name',80),description=left(coalesce(backup->'campaign'->>'description',''),400),progression_state=coalesce(backup->'campaign'->'progression','{}'::jsonb) where id=target_id;
 insert into campaign_sessions(campaign_id,state,revision) values(target_id,coalesce(backup->'session','{}'::jsonb),1) on conflict(campaign_id) do update set state=excluded.state,revision=campaign_sessions.revision+1;
 insert into campaign_master_notes(campaign_id,notes) values(target_id,left(coalesce(backup->>'masterNotes',''),50000)) on conflict(campaign_id) do update set notes=excluded.notes;
 insert into campaign_events(campaign_id,kind,payload) values(target_id,'restore',jsonb_build_object('message','Backup restaurado pelo Mestre. Histórico anterior preservado.'));
end $$;
revoke all on function public.save_campaign_session(uuid,integer,jsonb),public.roll_campaign_dice(uuid,integer,integer,integer,text),public.restore_campaign_backup(uuid,jsonb) from public;
grant execute on function public.save_campaign_session(uuid,integer,jsonb),public.roll_campaign_dice(uuid,integer,integer,integer,text),public.restore_campaign_backup(uuid,jsonb) to authenticated;
