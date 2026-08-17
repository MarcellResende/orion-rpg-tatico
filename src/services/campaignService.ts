import type { RealtimeChannel } from '@supabase/supabase-js'
import { createEmptyCharacter, hydrateCharacter } from '../character'
import { requireSupabase } from '../lib/supabase'
import type { CampaignRole, CampaignSummary, OnlineCharacter } from '../onlineTypes'
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

const mapCampaign = (row: CampaignJoinRow): CampaignSummary => ({
  id: row.campaigns.id,
  name: row.campaigns.name,
  description: row.campaigns.description ?? '',
  inviteCode: row.campaigns.invite_code,
  role: row.role,
  createdAt: row.campaigns.created_at,
})

const mapCharacter = (row: CharacterRow): OnlineCharacter => ({
  id: row.id,
  campaignId: row.campaign_id,
  ownerId: row.owner_id,
  sheet: hydrateCharacter(row.sheet),
  updatedAt: row.updated_at,
})

export async function listCampaigns(): Promise<CampaignSummary[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('campaign_members')
    .select('role, campaigns!campaign_members_campaign_id_fkey(id,name,description,invite_code,created_at)')
    .order('joined_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as unknown as CampaignJoinRow[]).map(mapCampaign)
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
  return data ? mapCharacter(data as CharacterRow) : null
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
  return mapCharacter(data as CharacterRow)
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
  return ((data ?? []) as CharacterRow[]).map(mapCharacter)
}

export function subscribeToSquad(
  campaignId: string,
  onChange: () => void,
  onStatus: (connected: boolean) => void,
): RealtimeChannel {
  const client = requireSupabase()
  return client
    .channel(`campaign:${campaignId}:characters`)
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
    .subscribe((status) => onStatus(status === 'SUBSCRIBED'))
}

export async function removeSubscription(channel: RealtimeChannel) {
  await requireSupabase().removeChannel(channel)
}
