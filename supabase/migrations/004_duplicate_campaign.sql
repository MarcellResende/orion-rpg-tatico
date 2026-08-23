begin;

-- O mestre pode criar uma cópia completa sem alterar a campanha de origem.
-- Participantes, fichas, condições e progresso coletivo recebem novos registros.
create or replace function public.duplicate_campaign(
  source_campaign_id uuid,
  new_campaign_name text,
  new_campaign_description text default null
)
returns table (
  id uuid,
  name text,
  description text,
  invite_code text,
  created_at timestamptz,
  role text,
  progression_state jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_campaign public.campaigns%rowtype;
  created_campaign public.campaigns%rowtype;
  source_character record;
  copied_character_id uuid;
  generated_code text;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  select campaign.*
  into source_campaign
  from public.campaigns campaign
  where campaign.id = source_campaign_id;

  if not found then
    raise exception 'campaign_not_found' using errcode = 'P0002';
  end if;

  if not (select private.is_campaign_master(source_campaign_id)) then
    raise exception 'campaign_master_required' using errcode = '42501';
  end if;

  if nullif(trim(new_campaign_name), '') is null then
    raise exception 'campaign_name_required' using errcode = '22023';
  end if;

  loop
    generated_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.campaigns existing where existing.invite_code = generated_code
    );
  end loop;

  insert into public.campaigns (
    name,
    description,
    invite_code,
    created_by,
    progression_state
  )
  values (
    left(trim(new_campaign_name), 80),
    left(coalesce(trim(new_campaign_description), source_campaign.description), 400),
    generated_code,
    (select auth.uid()),
    source_campaign.progression_state
  )
  returning * into created_campaign;

  insert into public.campaign_members (campaign_id, user_id, role, joined_at)
  select created_campaign.id, member.user_id, member.role, now()
  from public.campaign_members member
  where member.campaign_id = source_campaign_id;

  for source_character in
    select character.*
    from public.characters character
    where character.campaign_id = source_campaign_id
    order by character.created_at
  loop
    insert into public.characters (
      campaign_id,
      owner_id,
      sheet,
      created_at,
      updated_at
    )
    values (
      created_campaign.id,
      source_character.owner_id,
      source_character.sheet,
      now(),
      now()
    )
    returning public.characters.id into copied_character_id;

    insert into public.character_conditions (
      character_id,
      condition_id,
      added_by,
      created_at
    )
    select
      copied_character_id,
      condition.condition_id,
      condition.added_by,
      condition.created_at
    from public.character_conditions condition
    where condition.character_id = source_character.id;
  end loop;

  return query
  select
    created_campaign.id,
    created_campaign.name,
    created_campaign.description,
    created_campaign.invite_code,
    created_campaign.created_at,
    'master'::text,
    created_campaign.progression_state;
end;
$$;

revoke all on function public.duplicate_campaign(uuid, text, text) from public;
grant execute on function public.duplicate_campaign(uuid, text, text) to authenticated;

commit;
