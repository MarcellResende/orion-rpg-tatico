begin;

-- Estado coletivo da campanha: PO do Esquadrão, PQG, Doutrinas, Projetos, Alerta e Heat.
alter table public.campaigns
  add column if not exists progression_state jsonb not null default '{
    "operationalPrestige": 0,
    "headquartersPoints": 0,
    "squadDoctrines": [],
    "eliteDoctrine": "",
    "headquartersProjects": [],
    "missionSupports": [],
    "heat": 0,
    "alert": "green"
  }'::jsonb;

alter table public.campaigns
  drop constraint if exists campaigns_progression_state_check;
alter table public.campaigns
  add constraint campaigns_progression_state_check
  check (jsonb_typeof(progression_state) = 'object');

-- Amplia a lista conforme Estresse, Fadiga, Fome/Sede, Doenças, Infecção e Traumas da v1.1.
alter table public.character_conditions
  drop constraint if exists character_conditions_condition_id_check;
alter table public.character_conditions
  add constraint character_conditions_condition_id_check
  check (
    condition_id in (
      'stunned',
      'blinded',
      'suppressed',
      'bleeding',
      'disoriented',
      'immobilized',
      'stabilized',
      'tunnel-vision',
      'tactical-collapse',
      'fatigue-light',
      'fatigue-medium',
      'exhausted',
      'hunger-light',
      'thirst-light',
      'hunger-severe',
      'thirst-severe',
      'hunger-thirst',
      'extreme-deprivation',
      'dysentery-light',
      'dysentery-medium',
      'dysentery-extreme',
      'flu-light',
      'flu-medium',
      'flu-extreme',
      'tropical-light',
      'tropical-medium',
      'tropical-extreme',
      'infection-light',
      'infection-medium',
      'infection-extreme',
      'arm-trauma',
      'leg-trauma',
      'concussion',
      'inspired'
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'campaigns'
  ) then
    alter publication supabase_realtime add table public.campaigns;
  end if;
end;
$$;

commit;
