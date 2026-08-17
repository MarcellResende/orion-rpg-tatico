import { useState, type FormEvent } from 'react'
import type { CampaignSummary } from '../onlineTypes'

interface CampaignLobbyProps {
  campaigns: CampaignSummary[]
  email: string
  loading: boolean
  actionLoading: boolean
  error: string
  onCreate: (name: string, description: string) => Promise<void>
  onJoin: (code: string) => Promise<void>
  onOpen: (campaign: CampaignSummary) => void
  onSignOut: () => void
}

export function CampaignLobby({
  campaigns,
  email,
  loading,
  actionLoading,
  error,
  onCreate,
  onJoin,
  onOpen,
  onSignOut,
}: CampaignLobbyProps) {
  const [campaignName, setCampaignName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault()
    await onCreate(campaignName, description)
    setCampaignName('')
    setDescription('')
  }

  const submitJoin = async (event: FormEvent) => {
    event.preventDefault()
    await onJoin(inviteCode)
    setInviteCode('')
  }

  return (
    <div className="lobby-shell">
      <header className="lobby-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">O</span>
          <div><span className="eyebrow">ORION // CENTRAL DE OPERAÇÕES</span><h1>Suas campanhas</h1></div>
        </div>
        <div className="account-block"><span>{email}</span><button type="button" className="text-button" onClick={onSignOut}>Sair</button></div>
      </header>

      <main className="lobby-main">
        <section className="lobby-hero">
          <span className="eyebrow">SELECIONE A MISSÃO</span>
          <h2>Organize sua mesa em poucos passos</h2>
          <p>O mestre cria a campanha e envia o código. Os jogadores entram, preenchem a ficha e ficam sincronizados.</p>
        </section>

        {error && <div className="form-message form-message--error" role="alert">{error}</div>}

        <div className="lobby-grid">
          <section className="lobby-section campaign-list-section" aria-labelledby="campaign-list-heading">
            <div className="lobby-section-heading"><div><span className="section-index">01</span><h2 id="campaign-list-heading">Campanhas disponíveis</h2></div><span>{campaigns.length}</span></div>
            {loading ? (
              <div className="loading-state">Carregando operações...</div>
            ) : campaigns.length === 0 ? (
              <div className="empty-state"><strong>Nenhuma campanha ainda</strong><p>Crie a primeira campanha como mestre ou use o código enviado por outro mestre.</p></div>
            ) : (
              <div className="campaign-list">
                {campaigns.map((campaign) => (
                  <article key={campaign.id} className="campaign-card">
                    <div className="campaign-card__meta"><span>{campaign.role === 'master' ? 'MESTRE' : 'JOGADOR'}</span><code>{campaign.inviteCode}</code></div>
                    <h3>{campaign.name}</h3>
                    <p>{campaign.description || 'Operação sem descrição.'}</p>
                    <button type="button" className="primary-button" onClick={() => onOpen(campaign)}>Abrir campanha</button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="lobby-actions-column">
            <section className="lobby-section compact-section">
              <div className="lobby-section-heading"><div><span className="section-index">02</span><h2>Criar como mestre</h2></div></div>
              <form className="gateway-form" onSubmit={submitCreate}>
                <label><span>Nome da campanha</span><input value={campaignName} onChange={(event) => setCampaignName(event.currentTarget.value)} required maxLength={80} placeholder="Operação Horizonte" /></label>
                <label><span>Descrição</span><textarea value={description} onChange={(event) => setDescription(event.currentTarget.value)} rows={3} maxLength={400} placeholder="Objetivo e tom da campanha" /></label>
                <button type="submit" className="primary-button" disabled={actionLoading}>{actionLoading ? 'Criando...' : 'Criar campanha'}</button>
              </form>
            </section>

            <section className="lobby-section compact-section">
              <div className="lobby-section-heading"><div><span className="section-index">03</span><h2>Entrar como jogador</h2></div></div>
              <form className="gateway-form" onSubmit={submitJoin}>
                <label><span>Código do mestre</span><input className="invite-input" value={inviteCode} onChange={(event) => setInviteCode(event.currentTarget.value.toUpperCase())} required minLength={8} maxLength={8} placeholder="A1B2C3D4" /></label>
                <button type="submit" className="primary-button primary-button--cyan" disabled={actionLoading}>{actionLoading ? 'Entrando...' : 'Entrar na campanha'}</button>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
