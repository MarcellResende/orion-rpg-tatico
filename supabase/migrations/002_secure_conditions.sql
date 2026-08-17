begin;

-- Jogadores veem apenas a própria ficha. O mestre vê todas as fichas da campanha.
drop policy if exists "characters_select_campaign" on public.characters;
drop policy if exists "characters_select_owner_or_master" on public.characters;
create policy "characters_select_owner_or_master"
on public.characters for select
to authenticated
using (
  owner_id = (select auth.uid())
  or (select private.is_campaign_master(campaign_id))
);

-- Impede que um jogador apague a própria ficha para remover condições em cascata.
drop policy if exists "characters_delete_owner_or_master" on public.characters;
drop policy if exists "characters_delete_master" on public.characters;
create policy "characters_delete_master"
on public.characters for delete
to authenticated
using ((select private.is_campaign_master(campaign_id)));

create table if not exists public.character_conditions (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  condition_id text not null check (
    condition_id in (
      'stunned',
      'blinded',
      'suppressed',
      'bleeding',
      'disoriented',
      'tunnel-vision',
      'immobilized',
      'exhausted'
    )
  ),
  added_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (character_id, condition_id)
);

create index if not exists character_conditions_character_idx
  on public.character_conditions(character_id, created_at);

create or replace function private.can_view_character(target_character uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.characters character
    where character.id = target_character
      and (
        character.owner_id = (select auth.uid())
        or (select private.is_campaign_master(character.campaign_id))
      )
  );
$$;

create or replace function private.can_master_character(target_character uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.characters character
    where character.id = target_character
      and (select private.is_campaign_master(character.campaign_id))
  );
$$;

revoke all on function private.can_view_character(uuid) from public;
revoke all on function private.can_master_character(uuid) from public;
grant execute on function private.can_view_character(uuid) to authenticated;
grant execute on function private.can_master_character(uuid) to authenticated;

alter table public.character_conditions enable row level security;

drop policy if exists "conditions_select_owner_or_master" on public.character_conditions;
create policy "conditions_select_owner_or_master"
on public.character_conditions for select
to authenticated
using ((select private.can_view_character(character_id)));

drop policy if exists "conditions_insert_owner_or_master" on public.character_conditions;
create policy "conditions_insert_owner_or_master"
on public.character_conditions for insert
to authenticated
with check (
  added_by = (select auth.uid())
  and (select private.can_view_character(character_id))
);

drop policy if exists "conditions_update_master" on public.character_conditions;
create policy "conditions_update_master"
on public.character_conditions for update
to authenticated
using ((select private.can_master_character(character_id)))
with check ((select private.can_master_character(character_id)));

drop policy if exists "conditions_delete_master" on public.character_conditions;
create policy "conditions_delete_master"
on public.character_conditions for delete
to authenticated
using ((select private.can_master_character(character_id)));

grant select, insert, update, delete on public.character_conditions to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'character_conditions'
  ) then
    alter publication supabase_realtime add table public.character_conditions;
  end if;
end;
$$;

commit;
