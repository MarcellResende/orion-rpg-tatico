import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { CharacterSheet, type SaveState } from './App'
import { isSupabaseConfigured, requireSupabase } from './lib/supabase'
import type { CampaignSummary, OnlineCharacter, ResourceQuickAction } from './onlineTypes'
import { changeResource } from './rules/calculations'
import { AuthScreen } from './screens/AuthScreen'
import { CampaignLobby } from './screens/CampaignLobby'
import { SetupRequired } from './screens/SetupRequired'
import { SquadDashboard } from './screens/SquadDashboard'
import {
  createCampaign,
  getOrCreateCharacter,
  joinCampaign,
  listCampaigns,
  listSquadCharacters,
  removeSubscription,
  saveCharacter,
  subscribeToSquad,
} from './services/campaignService'
import type { Character } from './types'

type AppView = 'lobby' | 'sheet' | 'squad'

const readableError = (caught: unknown) => {
  const message = caught instanceof Error ? caught.message : 'Ocorreu um erro inesperado.'
  if (message.toLowerCase().includes('campaign_not_found')) return 'Código de campanha não encontrado.'
  if (message.toLowerCase().includes('duplicate')) return 'Você já participa desta campanha.'
  return message
}

export function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [view, setView] = useState<AppView>('lobby')
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignSummary | null>(null)
  const [activeCharacter, setActiveCharacter] = useState<OnlineCharacter | null>(null)
  const [squad, setSquad] = useState<OnlineCharacter[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [error, setError] = useState('')
  const saveTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true)
      return
    }

    const client = requireSupabase()
    void client.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthReady(true)
      if (!nextSession) {
        setView('lobby')
        setSelectedCampaign(null)
        setActiveCharacter(null)
        setCampaigns([])
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const refreshCampaigns = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      setCampaigns(await listCampaigns())
    } catch (caught) {
      setError(readableError(caught))
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (session) void refreshCampaigns()
  }, [session, refreshCampaigns])

  const refreshSquad = useCallback(async () => {
    if (!selectedCampaign) return
    try {
      setSquad(await listSquadCharacters(selectedCampaign.id))
    } catch (caught) {
      setError(readableError(caught))
    }
  }, [selectedCampaign])

  useEffect(() => {
    if (!selectedCampaign || view !== 'squad') {
      setRealtimeConnected(false)
      return
    }

    void refreshSquad()
    const channel = subscribeToSquad(
      selectedCampaign.id,
      () => void refreshSquad(),
      setRealtimeConnected,
    )
    return () => {
      setRealtimeConnected(false)
      void removeSubscription(channel)
    }
  }, [refreshSquad, selectedCampaign, view])

  useEffect(() => () => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
  }, [])

  const openCampaign = async (campaign: CampaignSummary) => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const ownCharacter = await getOrCreateCharacter(campaign.id, session.user.id)
      setSelectedCampaign(campaign)
      setActiveCharacter(ownCharacter)
      if (campaign.role === 'master') {
        setView('squad')
      } else {
        setView('sheet')
      }
    } catch (caught) {
      setError(readableError(caught))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async (name: string, description: string) => {
    setActionLoading(true)
    setError('')
    try {
      const campaign = await createCampaign(name, description)
      await refreshCampaigns()
      await openCampaign(campaign)
    } catch (caught) {
      setError(readableError(caught))
    } finally {
      setActionLoading(false)
    }
  }

  const handleJoinCampaign = async (code: string) => {
    setActionLoading(true)
    setError('')
    try {
      const campaign = await joinCampaign(code)
      await refreshCampaigns()
      await openCampaign(campaign)
    } catch (caught) {
      setError(readableError(caught))
    } finally {
      setActionLoading(false)
    }
  }

  const scheduleSave = (nextCharacter: Character) => {
    if (!selectedCampaign || !activeCharacter) return
    const campaignId = selectedCampaign.id
    const ownerId = activeCharacter.ownerId
    setActiveCharacter({ ...activeCharacter, sheet: nextCharacter })
    setSaveState('saving')
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(async () => {
      try {
        const saved = await saveCharacter(campaignId, ownerId, nextCharacter)
        setActiveCharacter(saved)
        setSaveState('saved')
      } catch (caught) {
        setSaveState('error')
        setError(readableError(caught))
      }
    }, 500)
  }

  const handleQuickAction = async ({ character, resource, delta }: ResourceQuickAction) => {
    const nextSheet = changeResource(character.sheet, resource, delta)
    setSquad((current) => current.map((item) => item.id === character.id ? { ...item, sheet: nextSheet } : item))
    try {
      await saveCharacter(character.campaignId, character.ownerId, nextSheet)
    } catch (caught) {
      setError(readableError(caught))
      await refreshSquad()
    }
  }

  const showCampaigns = () => {
    setView('lobby')
    setSelectedCampaign(null)
    setActiveCharacter(null)
    void refreshCampaigns()
  }

  const showOwnCharacter = async () => {
    if (!session || !selectedCampaign) return
    setLoading(true)
    try {
      setActiveCharacter(await getOrCreateCharacter(selectedCampaign.id, session.user.id))
      setView('sheet')
    } catch (caught) {
      setError(readableError(caught))
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await requireSupabase().auth.signOut()
  }

  if (!authReady) {
    return <div className="fullscreen-loading"><span />Inicializando central de operações...</div>
  }
  if (!isSupabaseConfigured) return <SetupRequired />
  if (!session) return <AuthScreen />

  if (view === 'lobby' || !selectedCampaign) {
    return (
      <CampaignLobby
        campaigns={campaigns}
        email={session.user.email ?? 'Usuário autenticado'}
        loading={loading}
        actionLoading={actionLoading}
        error={error}
        onCreate={handleCreateCampaign}
        onJoin={handleJoinCampaign}
        onOpen={openCampaign}
        onSignOut={() => void signOut()}
      />
    )
  }

  if (view === 'squad' && selectedCampaign.role === 'master') {
    return (
      <SquadDashboard
        campaign={selectedCampaign}
        characters={squad}
        currentUserId={session.user.id}
        loading={loading}
        realtimeConnected={realtimeConnected}
        onOpenCharacter={(character) => { setActiveCharacter(character); setView('sheet') }}
        onOpenOwnCharacter={() => void showOwnCharacter()}
        onQuickAction={(action) => void handleQuickAction(action)}
        onShowCampaigns={showCampaigns}
        onSignOut={() => void signOut()}
      />
    )
  }

  if (!activeCharacter) {
    return <div className="fullscreen-loading"><span />Carregando ficha...</div>
  }

  return (
    <CharacterSheet
      character={activeCharacter.sheet}
      campaignName={selectedCampaign.name}
      isOwnCharacter={activeCharacter.ownerId === session.user.id}
      isMaster={selectedCampaign.role === 'master'}
      saveState={saveState}
      onChange={scheduleSave}
      onShowCampaigns={showCampaigns}
      onShowSquad={() => setView('squad')}
      onSignOut={() => void signOut()}
    />
  )
}
