begin;

create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 400),
  invite_code text not null unique check (invite_code ~ '^[A-F0-9]{8}$'),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('master', 'player')),
  joined_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  sheet jsonb not null default '{}'::jsonb check (jsonb_typeof(sheet) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, owner_id)
);

create index if not exists campaign_members_user_idx
  on public.campaign_members(user_id, campaign_id);
create index if not exists characters_campaign_idx
  on public.characters(campaign_id, updated_at desc);
create index if not exists characters_owner_idx
  on public.characters(owner_id, campaign_id);

create or replace function private.is_campaign_member(target_campaign uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaign_members member
    where member.campaign_id = target_campaign
      and member.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_campaign_master(target_campaign uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaign_members member
    where member.campaign_id = target_campaign
      and member.user_id = (select auth.uid())
      and member.role = 'master'
  );
$$;

revoke all on function private.is_campaign_member(uuid) from public;
revoke all on function private.is_campaign_master(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_campaign_member(uuid) to authenticated;
grant execute on function private.is_campaign_master(uuid) to authenticated;

alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.characters enable row level security;

drop policy if exists "campaigns_select_members" on public.campaigns;
create policy "campaigns_select_members"
on public.campaigns for select
to authenticated
using (
  created_by = (select auth.uid())
  or (select private.is_campaign_member(id))
);

drop policy if exists "campaigns_update_master" on public.campaigns;
create policy "campaigns_update_master"
on public.campaigns for update
to authenticated
using ((select private.is_campaign_master(id)))
with check ((select private.is_campaign_master(id)));

drop policy if exists "campaigns_delete_master" on public.campaigns;
create policy "campaigns_delete_master"
on public.campaigns for delete
to authenticated
using ((select private.is_campaign_master(id)));

drop policy if exists "members_select_campaign" on public.campaign_members;
create policy "members_select_campaign"
on public.campaign_members for select
to authenticated
using ((select private.is_campaign_member(campaign_id)));

drop policy if exists "characters_select_campaign" on public.characters;
create policy "characters_select_campaign"
on public.characters for select
to authenticated
using ((select private.is_campaign_member(campaign_id)));

drop policy if exists "characters_insert_owner_or_master" on public.characters;
create policy "characters_insert_owner_or_master"
on public.characters for insert
to authenticated
with check (
  (select private.is_campaign_member(campaign_id))
  and (
    owner_id = (select auth.uid())
    or (select private.is_campaign_master(campaign_id))
  )
);

drop policy if exists "characters_update_owner_or_master" on public.characters;
create policy "characters_update_owner_or_master"
on public.characters for update
to authenticated
using (
  owner_id = (select auth.uid())
  or (select private.is_campaign_master(campaign_id))
)
with check (
  (select private.is_campaign_member(campaign_id))
  and (
    owner_id = (select auth.uid())
    or (select private.is_campaign_master(campaign_id))
  )
);

drop policy if exists "characters_delete_owner_or_master" on public.characters;
create policy "characters_delete_owner_or_master"
on public.characters for delete
to authenticated
using (
  owner_id = (select auth.uid())
  or (select private.is_campaign_master(campaign_id))
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

drop trigger if exists characters_set_updated_at on public.characters;
create trigger characters_set_updated_at
before update on public.characters
for each row execute function public.set_updated_at();

create or replace function public.create_campaign(
  campaign_name text,
  campaign_description text default ''
)
returns table (
  id uuid,
  name text,
  description text,
  invite_code text,
  created_at timestamptz,
  role text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_campaign public.campaigns%rowtype;
  generated_code text;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;
  if nullif(trim(campaign_name), '') is null then
    raise exception 'campaign_name_required' using errcode = '22023';
  end if;

  loop
    generated_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.campaigns existing where existing.invite_code = generated_code
    );
  end loop;

  insert into public.campaigns (name, description, invite_code, created_by)
  values (
    left(trim(campaign_name), 80),
    left(coalesce(trim(campaign_description), ''), 400),
    generated_code,
    (select auth.uid())
  )
  returning * into created_campaign;

  insert into public.campaign_members (campaign_id, user_id, role)
  values (created_campaign.id, (select auth.uid()), 'master');

  return query
  select
    created_campaign.id,
    created_campaign.name,
    created_campaign.description,
    created_campaign.invite_code,
    created_campaign.created_at,
    'master'::text;
end;
$$;

create or replace function public.join_campaign(supplied_invite_code text)
returns table (
  id uuid,
  name text,
  description text,
  invite_code text,
  created_at timestamptz,
  role text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_campaign public.campaigns%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  select campaign.*
  into found_campaign
  from public.campaigns campaign
  where campaign.invite_code = upper(trim(supplied_invite_code));

  if not found then
    raise exception 'campaign_not_found' using errcode = 'P0002';
  end if;

  insert into public.campaign_members (campaign_id, user_id, role)
  values (found_campaign.id, (select auth.uid()), 'player')
  on conflict (campaign_id, user_id) do nothing;

  return query
  select
    found_campaign.id,
    found_campaign.name,
    found_campaign.description,
    found_campaign.invite_code,
    found_campaign.created_at,
    member.role
  from public.campaign_members member
  where member.campaign_id = found_campaign.id
    and member.user_id = (select auth.uid());
end;
$$;

revoke all on function public.create_campaign(text, text) from public;
revoke all on function public.join_campaign(text) from public;
grant execute on function public.create_campaign(text, text) to authenticated;
grant execute on function public.join_campaign(text) to authenticated;

grant select, update, delete on public.campaigns to authenticated;
grant select on public.campaign_members to authenticated;
grant select, insert, update, delete on public.characters to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'characters'
  ) then
    alter publication supabase_realtime add table public.characters;
  end if;
end;
$$;

commit;
