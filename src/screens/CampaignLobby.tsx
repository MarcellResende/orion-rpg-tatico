import { useState, type FormEvent } from 'react'
import { CampaignEditor } from '../components/CampaignEditor'
import { safeImage } from '../session'
import type { CampaignSummary } from '../onlineTypes'

interface CampaignLobbyProps {
  onEdit?: (campaign: CampaignSummary) => Promise<void>
  campaigns: CampaignSummary[]
  email: string
  loading: boolean
  actionLoading: boolean
  error: string
  onCreate: (name: string, description: string) => Promise<void>
  onDuplicate: (campaign: CampaignSummary, name: string, description: string) => Promise<void>
  onDelete: (campaign: CampaignSummary) => Promise<void>
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
  onDuplicate,
  onDelete,
  onEdit,
  onJoin,
  onOpen,
  onSignOut,
}: CampaignLobbyProps) {
  const [campaignName, setCampaignName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteCode, setInviteCode] = useState(() => typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('invite')?.slice(0,8).toUpperCase()??'' : '')
  const [filter,setFilter]=useState('active')
  const [duplicateSource, setDuplicateSource] = useState<CampaignSummary | null>(null)
  const [duplicateName, setDuplicateName] = useState('')
  const [duplicateDescription, setDuplicateDescription] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('')

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

  const startDuplicate = (campaign: CampaignSummary) => {
    setDuplicateSource(campaign)
    setDuplicateName(`${campaign.name} — cópia`)
    setDuplicateDescription(campaign.description)
  }

  const cancelDuplicate = () => {
    setDuplicateSource(null)
    setDuplicateName('')
    setDuplicateDescription('')
  }

  const submitDuplicate = async (event: FormEvent) => {
    event.preventDefault()
    if (!duplicateSource) return
    try {
      await onDuplicate(duplicateSource, duplicateName, duplicateDescription)
      cancelDuplicate()
    } catch {
      // A mensagem detalhada já é exibida pelo aplicativo; mantém o formulário aberto.
    }
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
            <label className="field"><span>Mostrar campanhas</span><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="active">Ativas / recentes</option><option value="archived">Arquivadas</option><option value="all">Todas</option></select></label>
            {loading ? (
              <div className="loading-state">Carregando operações...</div>
            ) : campaigns.length === 0 ? (
              <div className="empty-state"><strong>Nenhuma campanha ainda</strong><p>Crie a primeira campanha como mestre ou use o código enviado por outro mestre.</p></div>
            ) : (
              <div className="campaign-list">
                {campaigns.filter(c=>filter==='all'||Boolean(c.progression.metadata?.archived)===(filter==='archived')).map((campaign) => (
                  <article key={campaign.id} className="campaign-card">
                    <div className="campaign-card__meta"><span>{campaign.role === 'master' ? 'MESTRE' : 'JOGADOR'}</span><code>{campaign.inviteCode}</code></div>
                    <h3>{campaign.name}</h3>
                    {safeImage(campaign.progression.metadata?.image)&&<img className="campaign-cover" src={campaign.progression.metadata?.image} alt="Imagem da campanha" referrerPolicy="no-referrer"/>}
                    <p>{campaign.progression.metadata?.era} · {campaign.progression.metadata?.rules}{campaign.progression.metadata?.archived?' · Arquivada':''}</p>
                    <p>{campaign.description || 'Operação sem descrição.'}</p>
                    <div className="campaign-card__actions">
                      <button type="button" className="primary-button" onClick={() => onOpen(campaign)}>Abrir campanha</button>
                      {campaign.role === 'master' && (
                        <button type="button" className="secondary-button" onClick={() => startDuplicate(campaign)}>Duplicar campanha</button>
                      )}
                    </div>
                    {campaign.role === 'master' && <div>
                      {onEdit&&<CampaignEditor campaign={campaign} onSave={onEdit} busy={actionLoading}/>}
                      <button type="button" className="danger-text-button" disabled={actionLoading} onClick={() => { setDeleteId(campaign.id); setDeleteName('') }}>Apagar campanha</button>
                      {deleteId === campaign.id && <form className="gateway-form campaign-duplicate-form" onSubmit={async (event) => {
                        event.preventDefault()
                        if (actionLoading || deleteName !== campaign.name) return
                        try { await onDelete(campaign); setDeleteId(null); setDeleteName('') } catch { /* Keep confirmation open and show the application error. */ }
                      }}>
                        <strong>Apagar “{campaign.name}” definitivamente?</strong>
                        <p>As fichas, condições, participantes e progresso desta campanha serão apagados para todos. Esta ação não pode ser desfeita.</p>
                        <label><span>Digite o nome da campanha para confirmar</span><input value={deleteName} onChange={(event) => setDeleteName(event.currentTarget.value)} disabled={actionLoading} autoComplete="off" /></label>
                        <button type="submit" className="danger-text-button" disabled={actionLoading || deleteName !== campaign.name}>{actionLoading ? 'Apagando...' : 'Confirmar exclusão definitiva'}</button>
                        <button type="button" className="text-button" disabled={actionLoading} onClick={() => setDeleteId(null)}>Cancelar</button>
                      </form>}
                    </div>}
                    {duplicateSource?.id === campaign.id && (
                      <form className="gateway-form campaign-duplicate-form" onSubmit={submitDuplicate}>
                        <div className="campaign-duplicate-heading">
                          <strong>Criar cópia completa</strong>
                          <span>Participantes, fichas, condições e progresso serão preservados.</span>
                        </div>
                        <label><span>Novo nome</span><input value={duplicateName} onChange={(event) => setDuplicateName(event.currentTarget.value)} required maxLength={80} autoFocus /></label>
                        <label><span>Descrição</span><textarea value={duplicateDescription} onChange={(event) => setDuplicateDescription(event.currentTarget.value)} rows={3} maxLength={400} /></label>
                        <div className="campaign-duplicate-actions">
                          <button type="button" className="text-button" onClick={cancelDuplicate} disabled={actionLoading}>Cancelar</button>
                          <button type="submit" className="primary-button" disabled={actionLoading}>{actionLoading ? 'Copiando...' : 'Criar cópia'}</button>
                        </div>
                      </form>
                    )}
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
