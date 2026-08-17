import { useState } from 'react'
import { CONDITIONS } from '../data/manual'
import { calculateDerivedResources } from '../rules/calculations'
import type { CampaignSummary, OnlineCharacter, ResourceQuickAction } from '../onlineTypes'

interface SquadDashboardProps {
  campaign: CampaignSummary
  characters: OnlineCharacter[]
  currentUserId: string
  loading: boolean
  realtimeConnected: boolean
  onOpenCharacter: (character: OnlineCharacter) => void
  onOpenOwnCharacter: () => void
  onQuickAction: (action: ResourceQuickAction) => void
  onShowCampaigns: () => void
  onSignOut: () => void
}

const operatorStatus = (character: OnlineCharacter) => {
  const derived = calculateDerivedResources(character.sheet)
  const labels: string[] = []
  if (character.sheet.resources.hp === 0) labels.push('FORA DE COMBATE')
  else if (character.sheet.resources.hp <= derived.maxHp / 2) labels.push('PV BAIXO')
  if (character.sheet.resources.energy === 0) labels.push('SEM ENERGIA')
  if (character.sheet.resources.stress >= derived.maxStress) labels.push('PÂNICO')
  if (character.sheet.resources.composure === 0) labels.push('RUPTURA')
  return labels.length ? labels : ['OPERACIONAL']
}

export function SquadDashboard({
  campaign,
  characters,
  currentUserId,
  loading,
  realtimeConnected,
  onOpenCharacter,
  onOpenOwnCharacter,
  onQuickAction,
  onShowCampaigns,
  onSignOut,
}: SquadDashboardProps) {
  const [copied, setCopied] = useState(false)
  const masterHasCharacter = characters.some((character) => character.ownerId === currentUserId)

  const copyInvite = async () => {
    await navigator.clipboard.writeText(campaign.inviteCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="lobby-shell squad-shell">
      <header className="lobby-header">
        <div className="brand-lockup"><span className="brand-mark" aria-hidden="true">O</span><div><span className="eyebrow">ORION // ESCUDO DO MESTRE</span><h1>{campaign.name}</h1></div></div>
        <div className="topbar-actions">
          <span className={`save-state ${realtimeConnected ? 'save-state--saved' : 'save-state--saving'}`}><span aria-hidden="true" />{realtimeConnected ? 'Tempo real ativo' : 'Conectando'}</span>
          <button type="button" className="secondary-button" onClick={onOpenOwnCharacter}>{masterHasCharacter ? 'Minha ficha' : 'Criar minha ficha'}</button>
          <button type="button" className="secondary-button" onClick={onShowCampaigns}>Campanhas</button>
          <button type="button" className="text-button" onClick={onSignOut}>Sair</button>
        </div>
      </header>

      <main className="squad-main">
        <section className="squad-command-bar">
          <div><span className="eyebrow">CÓDIGO DE CONVOCAÇÃO</span><strong>{campaign.inviteCode}</strong></div>
          <button type="button" className="secondary-button" onClick={copyInvite}>{copied ? 'Código copiado' : 'Copiar código'}</button>
          <div><span className="eyebrow">OPERADORES</span><strong>{characters.length}</strong></div>
        </section>

        <div className="squad-heading"><div><span className="section-index">01</span><div><span className="eyebrow">SITUAÇÃO DA EQUIPE</span><h2>Ficha de Esquadrão</h2></div></div><p>Use os controles rápidos durante a sessão ou abra a ficha completa de qualquer operador.</p></div>

        {loading ? (
          <div className="loading-state">Sincronizando o esquadrão...</div>
        ) : characters.length === 0 ? (
          <div className="empty-state"><strong>Nenhum operador conectado</strong><p>Envie o código <b>{campaign.inviteCode}</b>. O jogador aparecerá aqui depois de abrir a campanha.</p></div>
        ) : (
          <div className="squad-grid">
            {characters.map((character) => {
              const derived = calculateDerivedResources(character.sheet)
              const statuses = operatorStatus(character)
              const isOwn = character.ownerId === currentUserId
              return (
                <article className="operator-card" key={character.id}>
                  <div className="operator-card__header">
                    <div><span className="eyebrow">{isOwn ? 'MESTRE / OPERADOR' : 'OPERADOR'}</span><h3>{character.sheet.identity.codename || character.sheet.identity.name || 'Não identificado'}</h3><p>{character.sheet.identity.name || 'Ficha em criação'}</p></div>
                    <div className="operator-statuses">{statuses.map((status) => <span key={status} className={status === 'OPERACIONAL' ? 'status-safe' : 'status-danger'}>{status}</span>)}</div>
                  </div>

                  <div className="operator-resources">
                    <div><span>PV</span><strong>{character.sheet.resources.hp}<small>/{derived.maxHp}</small></strong><div className="mini-meter"><span style={{ width: `${(character.sheet.resources.hp / derived.maxHp) * 100}%` }} /></div></div>
                    <div><span>EN</span><strong>{character.sheet.resources.energy}<small>/{derived.maxEnergy}</small></strong><div className="mini-meter mini-meter--cyan"><span style={{ width: `${(character.sheet.resources.energy / derived.maxEnergy) * 100}%` }} /></div></div>
                    <div><span>CP</span><strong>{character.sheet.resources.composure}<small>/{derived.maxComposure}</small></strong><div className="mini-meter mini-meter--violet"><span style={{ width: `${(character.sheet.resources.composure / derived.maxComposure) * 100}%` }} /></div></div>
                    <div><span>STR</span><strong>{character.sheet.resources.stress}<small>/{derived.maxStress}</small></strong><div className="mini-meter mini-meter--amber"><span style={{ width: `${(character.sheet.resources.stress / derived.maxStress) * 100}%` }} /></div></div>
                  </div>

                  <div className="operator-conditions">
                    <span>CONDIÇÕES</span>
                    {character.conditions.length === 0 ? (
                      <b className="status-safe">NENHUMA</b>
                    ) : character.conditions.map((active) => {
                      const definition = CONDITIONS.find((item) => item.id === active.conditionId)
                      return definition ? <b className="status-danger" key={active.id}>{definition.name}</b> : null
                    })}
                  </div>

                  <div className="master-quick-actions">
                    <div><span>PV</span><button type="button" onClick={() => onQuickAction({ character, resource: 'hp', delta: -5 })}>−5</button><button type="button" onClick={() => onQuickAction({ character, resource: 'hp', delta: 5 })}>+5</button></div>
                    <div><span>EN</span><button type="button" onClick={() => onQuickAction({ character, resource: 'energy', delta: -1 })}>−1</button><button type="button" onClick={() => onQuickAction({ character, resource: 'energy', delta: 1 })}>+1</button></div>
                    <div><span>STR</span><button type="button" onClick={() => onQuickAction({ character, resource: 'stress', delta: -1 })}>−1</button><button type="button" onClick={() => onQuickAction({ character, resource: 'stress', delta: 1 })}>+1</button></div>
                  </div>

                  <button type="button" className="operator-open-button" onClick={() => onOpenCharacter(character)}>Abrir ficha completa</button>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

