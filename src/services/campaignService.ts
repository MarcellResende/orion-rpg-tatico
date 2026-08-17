import type { RealtimeChannel } from '@supabase/supabase-js'
import { createEmptyCharacter, hydrateCharacter } from '../character'
import { requireSupabase } from '../lib/supabase'
import type {
  ActiveCondition,
  CampaignRole,
  CampaignSummary,
  OnlineCharacter,
} from '../onlineTypes'
import type { Character } from '../types'

interface CampaignJoinRow {
  role: CampaignRole
  campaigns: {
    id: string
    name: string
    description: string | null
    invite_code: string
    created_at: string
  }
}

interface CharacterRow {
  id: string
  campaign_id: string
  owner_id: string
  sheet: unknown
  updated_at: string
}

interface ConditionRow {
  id: string
  character_id: string
  condition_id: string
  added_by: string
  created_at: string
}

const mapCampaign = (row: CampaignJoinRow): CampaignSummary => ({
  id: row.campaigns.id,
  name: row.campaigns.name,
  description: row.campaigns.description ?? '',
  inviteCode: row.campaigns.invite_code,
  role: row.role,
  createdAt: row.campaigns.created_at,
})

export const deduplicateCampaigns = (campaigns: CampaignSummary[]) => {
  const unique = new Map<string, CampaignSummary>()
  for (const campaign of campaigns) {
    const existing = unique.get(campaign.id)
    if (!existing || campaign.role === 'master') unique.set(campaign.id, campaign)
  }
  return [...unique.values()]
}

const mapCondition = (row: ConditionRow): ActiveCondition => ({
  id: row.id,
  characterId: row.character_id,
  conditionId: row.condition_id,
  addedBy: row.added_by,
  createdAt: row.created_at,
})

const mapCharacter = (
  row: CharacterRow,
  conditions: ActiveCondition[] = [],
): OnlineCharacter => ({
  id: row.id,
  campaignId: row.campaign_id,
  ownerId: row.owner_id,
  sheet: hydrateCharacter(row.sheet),
  conditions,
  updatedAt: row.updated_at,
})

const listConditionsForCharacters = async (characterIds: string[]) => {
  const grouped = new Map<string, ActiveCondition[]>()
  if (characterIds.length === 0) return grouped

  const { data, error } = await requireSupabase()
    .from('character_conditions')
    .select('id,character_id,condition_id,added_by,created_at')
    .in('character_id', characterIds)
    .order('created_at', { ascending: true })

  if (error) throw error
  for (const row of (data ?? []) as ConditionRow[]) {
    const condition = mapCondition(row)
    grouped.set(condition.characterId, [
      ...(grouped.get(condition.characterId) ?? []),
      condition,
    ])
  }
  return grouped
}

export async function listCampaigns(): Promise<CampaignSummary[]> {
  const client = requireSupabase()
  const { data: authData, error: authError } = await client.auth.getSession()
  if (authError) throw authError
  const userId = authData.session?.user.id
  if (!userId) return []
  const { data, error } = await client
    .from('campaign_members')
    .select('role, campaigns!campaign_members_campaign_id_fkey(id,name,description,invite_code,created_at)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })

  if (error) throw error
  return deduplicateCampaigns(((data ?? []) as unknown as CampaignJoinRow[]).map(mapCampaign))
}

export async function createCampaign(name: string, description: string) {
  const client = requireSupabase()
  const { data, error } = await client.rpc('create_campaign', {
    campaign_name: name.trim(),
    campaign_description: description.trim(),
  })
  if (error) throw error

  const row = (data as Array<{
    id: string
    name: string
    description: string | null
    invite_code: string
    created_at: string
    role: CampaignRole
  }> | null)?.[0]
  if (!row) throw new Error('A campanha foi criada, mas não pôde ser carregada.')

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    inviteCode: row.invite_code,
    createdAt: row.created_at,
    role: row.role,
  } satisfies CampaignSummary
}

export async function joinCampaign(inviteCode: string) {
  const client = requireSupabase()
  const { data, error } = await client.rpc('join_campaign', {
    supplied_invite_code: inviteCode.trim().toUpperCase(),
  })
  if (error) throw error

  const row = (data as Array<{
    id: string
    name: string
    description: string | null
    invite_code: string
    created_at: string
    role: CampaignRole
  }> | null)?.[0]
  if (!row) throw new Error('Código de convite não encontrado.')

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    inviteCode: row.invite_code,
    createdAt: row.created_at,
    role: row.role,
  } satisfies CampaignSummary
}

export async function getCharacter(campaignId: string, ownerId: string) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('characters')
    .select('id,campaign_id,owner_id,sheet,updated_at')
    .eq('campaign_id', campaignId)
    .eq('owner_id', ownerId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  const row = data as CharacterRow
  const conditions = await listConditionsForCharacters([row.id])
  return mapCharacter(row, conditions.get(row.id) ?? [])
}

export async function saveCharacter(
  campaignId: string,
  ownerId: string,
  character: Character,
) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('characters')
    .upsert(
      {
        campaign_id: campaignId,
        owner_id: ownerId,
        sheet: character,
      },
      { onConflict: 'campaign_id,owner_id' },
    )
    .select('id,campaign_id,owner_id,sheet,updated_at')
    .single()

  if (error) throw error
  const row = data as CharacterRow
  const conditions = await listConditionsForCharacters([row.id])
  return mapCharacter(row, conditions.get(row.id) ?? [])
}

export async function getOrCreateCharacter(campaignId: string, ownerId: string) {
  const existing = await getCharacter(campaignId, ownerId)
  if (existing) return existing
  return saveCharacter(campaignId, ownerId, createEmptyCharacter())
}

export async function listSquadCharacters(campaignId: string) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('characters')
    .select('id,campaign_id,owner_id,sheet,updated_at')
    .eq('campaign_id', campaignId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as CharacterRow[]
  const conditions = await listConditionsForCharacters(rows.map((row) => row.id))
  return rows.map((row) => mapCharacter(row, conditions.get(row.id) ?? []))
}

export async function addCharacterCondition(characterId: string, conditionId: string) {
  const client = requireSupabase()
  const { error } = await client
    .from('character_conditions')
    .upsert(
      { character_id: characterId, condition_id: conditionId },
      { onConflict: 'character_id,condition_id', ignoreDuplicates: true },
    )

  if (error) throw error
  const { data, error: readError } = await client
    .from('character_conditions')
    .select('id,character_id,condition_id,added_by,created_at')
    .eq('character_id', characterId)
    .eq('condition_id', conditionId)
    .single()
  if (readError) throw readError
  return mapCondition(data as ConditionRow)
}

export async function removeCharacterCondition(conditionRecordId: string) {
  const { error } = await requireSupabase()
    .from('character_conditions')
    .delete()
    .eq('id', conditionRecordId)
  if (error) throw error
}

export function subscribeToSquad(
  campaignId: string,
  onChange: () => void,
  onStatus: (connected: boolean) => void,
): RealtimeChannel {
  const client = requireSupabase()
  return client
    .channel(`campaign:${campaignId}:operations`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'characters',
        filter: `campaign_id=eq.${campaignId}`,
      },
      onChange,
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'character_conditions',
      },
      onChange,
    )
    .subscribe((status) => onStatus(status === 'SUBSCRIBED'))
}

export async function removeSubscription(channel: RealtimeChannel) {
  await requireSupabase().removeChannel(channel)
}

