import { requireSupabase } from '../lib/supabase'
import { hydrateSession, parseDice, type SessionState } from '../session'
export type SessionEvent = {
  id: number
  actor_id: string
  kind: string
  created_at: string
  payload: Record<string, unknown>
}
export async function loadSession(id: string) {
  const { data, error } = await requireSupabase()
    .from('campaign_sessions')
    .select('state,revision')
    .eq('campaign_id', id)
    .maybeSingle()
  if (error)
    throw new Error(
      'A central de sessão precisa da atualização 005 no Supabase. ' +
        error.message,
    )
  return { state: hydrateSession(data?.state), revision: data?.revision ?? 0 }
}
export async function saveSession(
  id: string,
  revision: number,
  state: SessionState,
) {
  const { data, error } = await requireSupabase().rpc('save_campaign_session', {
    target_id: id,
    expected_revision: revision,
    next_state: state,
  })
  if (error) throw error
  return data as number
}
export async function loadEvents(id: string, before?: number) {
  let query = requireSupabase()
    .from('campaign_events')
    .select('id,actor_id,kind,created_at,payload')
    .eq('campaign_id', id)
    .order('id', { ascending: false })
    .limit(50)
  if (before) query = query.lt('id', before)
  const { data, error } = await query
  if (error) throw error
  return data as SessionEvent[]
}
export async function rollDice(id: string, formula: string, reason: string) {
  const dice = parseDice(formula)
  const { data, error } = await requireSupabase().rpc('roll_campaign_dice', {
    target_id: id,
    dice_count: dice.count,
    dice_sides: dice.sides,
    modifier: dice.modifier,
    reason,
  })
  if (error) throw error
  return data
}
export async function saveMasterNotes(id: string, notes: string) {
  const { error } = await requireSupabase()
    .from('campaign_master_notes')
    .upsert({ campaign_id: id, notes })
  if (error) throw error
}
export async function loadMasterNotes(id: string) {
  const { data, error } = await requireSupabase()
    .from('campaign_master_notes')
    .select('notes')
    .eq('campaign_id', id)
    .maybeSingle()
  if (error) throw error
  return data?.notes ?? ''
}
