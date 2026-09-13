import { useEffect, useRef, useState } from 'react'
import type { CampaignSummary, OnlineCharacter } from '../onlineTypes'
import {
  advanceTurn,
  downloadJson,
  emptySession,
  readBackup,
  type Combatant,
  type SessionState,
} from '../session'
import {
  loadEvents,
  loadMasterNotes,
  loadSession,
  rollDice,
  saveMasterNotes,
  saveSession,
  type SessionEvent,
} from '../services/sessionService'
import { requireSupabase } from '../lib/supabase'
import { listSquadCharacters } from '../services/campaignService'

const message = (e: unknown) =>
  e && typeof e === 'object' && 'message' in e
    ? String(e.message)
    : 'Não foi possível concluir. Tente novamente.'
const field = (
  label: string,
  value: string,
  onChange: (v: string) => void,
  multiline = false,
) => (
  <label className="field">
    <span>{label}</span>
    {multiline ? (
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    )}
  </label>
)
export function SessionPanel({
  campaign,
  characters,
  userId,
  onBack,
  onRestored,
}: {
  campaign: CampaignSummary
  characters: OnlineCharacter[]
  userId: string
  onBack: () => void
  onRestored: () => void
}) {
  const master = campaign.role === 'master'
  const [state, setState] = useState<SessionState>(emptySession),
    [revision, setRevision] = useState(0),
    [events, setEvents] = useState<SessionEvent[]>([]),
    [notes, setNotes] = useState(''),
    [error, setError] = useState(''),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [formula, setFormula] = useState('1d20'),
    [reason, setReason] = useState(''),
    [result, setResult] = useState(''),
    [npc, setNpc] = useState(''),
    [restore, setRestore] = useState<Record<string, unknown> | null>(null),
    [confirmation, setConfirmation] = useState(''),
    [older, setOlder] = useState(false)
  const dirtyRef = useRef(false),
    editVersion = useRef(0),
    savingRef = useRef(false)
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])
  const reload = async () => {
    try {
      const [session, log] = await Promise.all([
        loadSession(campaign.id),
        loadEvents(campaign.id),
      ])
      if (!dirtyRef.current) {
        setState(session.state)
        setRevision(session.revision)
      }
      setEvents(log)
      setReady(true)
      setError('')
    } catch (e) {
      setError(message(e))
    }
  }
  useEffect(() => {
    void reload()
    if (master)
      void loadMasterNotes(campaign.id)
        .then(setNotes)
        .catch((e) => setError(message(e)))
    const timer = window.setInterval(() => {
      if (!dirtyRef.current) void reload()
    }, 8000)
    return () => clearInterval(timer)
  }, [campaign.id])
  const edit = (next: SessionState) => {
    editVersion.current++
    dirtyRef.current = true
    setDirty(true)
    setState(next)
  }
  const persist = async () => {
    if (savingRef.current) return
    savingRef.current = true
    const version = editVersion.current
    setBusy(true)
    try {
      const r = await saveSession(campaign.id, revision, state)
      setRevision(r)
      await saveMasterNotes(campaign.id, notes)
      const saved = await loadSession(campaign.id)
      if (version === editVersion.current) {
        setState(saved.state)
        setRevision(saved.revision)
        dirtyRef.current = false
        setDirty(false)
      }
      setError('')
      setEvents(await loadEvents(campaign.id))
    } catch (e) {
      setError(message(e))
    } finally {
      savingRef.current = false
      setBusy(false)
    }
  }
  useEffect(() => {
    if (!ready || !dirty || busy || error || !master) return
    const timer = setTimeout(() => void persist(), 1500)
    return () => clearTimeout(timer)
  }, [state, notes, ready, dirty, busy, error])
  const patchCombatant = (id: string, update: Partial<Combatant>) =>
    edit({
      ...state,
      combat: {
        ...state.combat,
        entries: state.combat.entries.map((e) =>
          e.id === id ? { ...e, ...update } : e,
        ),
      },
    })
  const addCombatant = (id: string, name: string) => {
    if (state.combat.entries.some((e) => e.id === id)) return
    edit({
      ...state,
      combat: {
        ...state.combat,
        entries: [
          ...state.combat.entries,
          {
            id,
            name,
            initiative: 0,
            actions: 1,
            secondary: 1,
            half: 2,
            reactions: 1,
            movement: 9,
          },
        ],
      },
    })
  }
  const exportCampaign = async () => {
    setBusy(true)
    try {
      const all = await listSquadCharacters(campaign.id)
      let logs: SessionEvent[] = []
      let page = await loadEvents(campaign.id)
      while (page.length) {
        logs.push(...page)
        if (page.length < 50) break
        page = await loadEvents(campaign.id, page[page.length - 1].id)
      }
      downloadJson('orion-campanha.json', {
        format: 'orion-campaign',
        version: 1,
        campaignId: campaign.id,
        campaign,
        characters: all,
        session: state,
        masterNotes: notes,
        events: logs,
        exportedAt: new Date().toISOString(),
      })
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="lobby-shell">
      <header className="lobby-header">
        <div>
          <span className="eyebrow">ORION // CENTRAL DA SESSÃO</span>
          <h1>{campaign.name}</h1>
        </div>
        <button className="secondary-button" disabled={busy} onClick={()=>{if(!dirtyRef.current)onBack();else setError('Aguarde o salvamento ou use Salvar sessão antes de voltar.')}}>
          Voltar
        </button>
      </header>
      <main className="squad-main session-layout">
        {error && (
          <p role="alert" className="form-message form-message--error">
            {error}
          </p>
        )}
        {!ready && (
          <p>
            Carregando a sessão. Se a atualização do banco estiver pendente,
            fichas e inventário continuam disponíveis em Voltar.
          </p>
        )}
        {ready && (
          <fieldset className="session-content" disabled={busy}>
            {master && (
              <div className="session-toolbar">
                <strong role="status">
                  {busy
                    ? 'Salvando…'
                    : dirty
                      ? 'Alterações da sessão não salvas'
                      : 'Sessão salva'}
                </strong>
                <button
                  className="primary-button"
                  disabled={busy || !dirty}
                  onClick={() => void persist()}
                >
                  Salvar sessão
                </button>
                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => {
                    if (
                      !dirty ||
                      window.confirm(
                        'Descartar alterações locais e carregar a sessão salva?',
                      )
                    ) {
                      dirtyRef.current = false
                      setDirty(false)
                      void reload()
                    }
                  }}
                >
                  Atualizar
                </button>
              </div>
            )}
            <section className="panel session-section">
              <h2>Combate · Rodada {state.combat.round}</h2>
              <p>
                {state.combat.active
                  ? `Turno: ${state.combat.entries[state.combat.turn]?.name ?? 'sem combatente'}`
                  : 'Combate não iniciado'}
                . A iniciativa é definida pela rolagem e pelos modificadores da
                mesa.
              </p>
              {master && (
                <>
                  <div className="form-grid">
                    <label className="field">
                      <span>Adicionar jogador</span>
                      <select
                        value=""
                        onChange={(e) => {
                          const c = characters.find(
                            (c) => c.id === e.target.value,
                          )
                          if (c)
                            addCombatant(
                              c.id,
                              c.sheet.identity.codename ||
                                c.sheet.identity.name ||
                                'Operador',
                            )
                        }}
                      >
                        <option value="">Selecione</option>
                        {characters.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.sheet.identity.codename ||
                              c.sheet.identity.name ||
                              'Operador'}
                          </option>
                        ))}
                      </select>
                    </label>
                    {field('NPC / inimigo', npc, setNpc)}
                    <button
                      className="secondary-button"
                      disabled={!npc.trim()}
                      onClick={() => {
                        addCombatant(crypto.randomUUID(), npc.trim())
                        setNpc('')
                      }}
                    >
                      Adicionar NPC
                    </button>
                  </div>
                  <div className="session-toolbar">
                    <button
                      className="secondary-button"
                      disabled={!state.combat.entries.length}
                      onClick={() =>
                        edit({
                          ...state,
                          combat: {
                            ...state.combat,
                            active: true,
                            round: Math.max(1, state.combat.round),
                            turn: 0,
                            entries: [...state.combat.entries].sort(
                              (a, b) => b.initiative - a.initiative,
                            ),
                          },
                        })
                      }
                    >
                      Ordenar e iniciar
                    </button>
                    <button
                      className="primary-button"
                disabled={!state.combat.active || busy || dirty}
                onClick={() => {if(!dirtyRef.current)edit(advanceTurn(state))}}
                    >
                      Próximo turno
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() =>
                        edit({
                          ...state,
                          combat: { ...state.combat, active: false },
                        })
                      }
                    >
                      Encerrar combate
                    </button>
                  </div>
                </>
              )}
              <div className="combat-list">
                {state.combat.entries.map((e, index) => (
                  <article
                    className={`combat-card ${state.combat.active && index === state.combat.turn ? 'combat-card--current' : ''}`}
                    key={e.id}
                  >
                    <h3>
                      {index + 1}. {e.name}
                    </h3>
                    <label className="field">
                      <span>Iniciativa</span>
                      <input
                        type="number"
                        value={e.initiative}
                        disabled={!master}
                        onChange={(ev) =>
                          patchCombatant(e.id, {
                            initiative: Number(ev.target.value),
                          })
                        }
                      />
                    </label>
                    <div className="combat-actions">
                      {(
                        [
                          ['actions', 'Ação padrão'],
                          ['secondary', 'Secundária'],
                          ['half', 'Meia ação'],
                          ['reactions', 'Reação'],
                        ] as const
                      ).map(([key, label]) => (
                        <button
                          disabled={!master || e[key] === 0}
                          key={key}
                          onClick={() =>
                            patchCombatant(e.id, {
                              [key]: e[key] - 1,
                              ...(key === 'half'
                                ? { movement: Math.max(0, e.movement - 3) }
                                : {}),
                            })
                          }
                        >
                          {label}: {e[key]}
                        </button>
                      ))}
                      <label>
                        Movimento (m)
                        <input
                          type="number"
                          min={0}
                          max={99}
                          disabled={!master}
                          value={e.movement}
                          onChange={(ev) =>
                            patchCombatant(e.id, {
                              movement: Math.max(0, Number(ev.target.value)),
                            })
                          }
                        />
                      </label>
                    </div>
                    {master && (
                      <button
                        className="danger-text-button"
                        onClick={() => {
                          if (
                            window.confirm(`Retirar ${e.name} deste combate?`)
                          )
                            edit({
                              ...state,
                              combat: {
                                ...state.combat,
                                turn: 0,
                                entries: state.combat.entries.filter(
                                  (x) => x.id !== e.id,
                                ),
                              },
                            })
                        }}
                      >
                        Retirar do combate
                      </button>
                    )}
                  </article>
                ))}
              </div>
              {!state.combat.entries.length && (
                <p>Adicione os participantes para organizar a iniciativa.</p>
              )}
              <p>
                Meia Ação consome 3 m. Ao chegar ao turno, ações e reação são
                renovadas; ajuste Movimento às penalidades da ficha. Exceções de
                habilidades precisam ser arbitradas pelo Mestre.
              </p>
            </section>
            <section className="panel session-section">
              <h2>Dados da sessão</h2>
              <form
                className="form-grid"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setBusy(true)
                  try {
                    const r = await rollDice(campaign.id, formula, reason)
                    setResult(
                      `${r.formula}: [${r.rolls.join(', ')}] = ${r.total}`,
                    )
                    setEvents(await loadEvents(campaign.id))
                    setError('')
                  } catch (e) {
                    setError(message(e))
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                {field('Fórmula (ex.: 1d20+5)', formula, setFormula)}
                {field('Motivo do teste', reason, setReason)}
                <button className="primary-button" disabled={busy}>
                  Rolar e registrar
                </button>
              </form>
              <strong role="status">{result}</strong>
              <p>
                Dados gerados no servidor. Registros conservam autor, horário,
                fórmula e resultado; correções devem ser registradas como novas
                ações.
              </p>
            </section>
            <section className="panel session-section">
              <h2>Missões</h2>
              {state.missions.map((m) => (
                <article className="session-record" key={m.id}>
                  {master ? (
                    <>
                      {field('Nome da missão', m.name, (v) =>
                        edit({
                          ...state,
                          missions: state.missions.map((x) =>
                            x.id === m.id ? { ...x, name: v } : x,
                          ),
                        }),
                      )}
                      {(['primary', 'secondary', 'rewards'] as const).map(
                        (key, i) => (
                          <div key={key}>
                            {field(
                              [
                                'Objetivo primário',
                                'Objetivos secundários',
                                'Recompensas previstas',
                              ][i],
                              m[key],
                              (v) =>
                                edit({
                                  ...state,
                                  missions: state.missions.map((x) =>
                                    x.id === m.id ? { ...x, [key]: v } : x,
                                  ),
                                }),
                              true,
                            )}
                          </div>
                        ),
                      )}
                      <label className="field">
                        <span>Estado</span>
                        <select
                          value={m.status}
                          onChange={(e) =>
                            edit({
                              ...state,
                              missions: state.missions.map((x) =>
                                x.id === m.id
                                  ? {
                                      ...x,
                                      status: e.target.value as typeof m.status,
                                    }
                                  : x,
                              ),
                            })
                          }
                        >
                          {Object.entries({
                            planned: 'Planejada',
                            active: 'Em andamento',
                            completed: 'Concluída',
                            failed: 'Falhou',
                          }).map(([id, name]) => (
                            <option key={id} value={id}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  ) : (
                    <>
                      <h3>{m.name}</h3>
                      <p>{m.primary}</p>
                      <p>{m.secondary}</p>
                      <p>Recompensas: {m.rewards}</p>
                      <p>{m.status}</p>
                    </>
                  )}
                </article>
              ))}
              {!state.missions.length && <p>Nenhuma missão cadastrada.</p>}
              {master && (
                <button
                  className="secondary-button"
                  onClick={() =>
                    edit({
                      ...state,
                      missions: [
                        ...state.missions,
                        {
                          id: crypto.randomUUID(),
                          name: 'Nova missão',
                          primary: '',
                          secondary: '',
                          rewards: '',
                          status: 'planned',
                        },
                      ],
                    })
                  }
                >
                  Nova missão
                </button>
              )}
              <p>
                Conceda XP e recursos no Escudo do Mestre após conferir os
                feitos; concluir uma missão aqui não duplica recompensas.
              </p>
            </section>
            <section className="panel session-section">
              <h2>Sincronização regional</h2>
              <p>
                Pontos de observação revelam três informações regionais e dão +2
                no primeiro teste de rota. Não são uma reserva de pontos
                gastáveis e não geram PD.
              </p>
              {state.sync.map((s) => (
                <article className="session-record" key={s.id}>
                  {master ? (
                    <>
                      {field('Região / ponto de sincronização', s.region, (v) =>
                        edit({
                          ...state,
                          sync: state.sync.map((x) =>
                            x.id === s.id ? { ...x, region: v } : x,
                          ),
                        }),
                      )}
                      {field(
                        'Três informações reveladas',
                        s.discoveries,
                        (v) =>
                          edit({
                            ...state,
                            sync: state.sync.map((x) =>
                              x.id === s.id ? { ...x, discoveries: v } : x,
                            ),
                          }),
                        true,
                      )}
                    </>
                  ) : (
                    <>
                      <h3>{s.region}</h3>
                      <p>{s.discoveries}</p>
                    </>
                  )}
                  <label>
                    <input
                      type="checkbox"
                      disabled={!master}
                      checked={s.used}
                      onChange={(e) =>
                        edit({
                          ...state,
                          sync: state.sync.map((x) =>
                            x.id === s.id
                              ? { ...x, used: e.target.checked }
                              : x,
                          ),
                        })
                      }
                    />{' '}
                    Bônus do primeiro teste de rota utilizado
                  </label>
                </article>
              ))}
              {master && (
                <button
                  className="secondary-button"
                  onClick={() =>
                    edit({
                      ...state,
                      sync: [
                        ...state.sync,
                        {
                          id: crypto.randomUUID(),
                          region: '',
                          discoveries: '',
                          used: false,
                        },
                      ],
                    })
                  }
                >
                  Registrar ponto
                </button>
              )}
            </section>
            <section className="panel session-section">
              <h2>Notas e documentos compartilhados</h2>
              {master ? (
                field(
                  'Notas da campanha',
                  state.notes,
                  (v) => edit({ ...state, notes: v }),
                  true,
                )
              ) : (
                <p className="preserve-lines">
                  {state.notes || 'O Mestre ainda não compartilhou notas.'}
                </p>
              )}
              {state.documents.map((d) => (
                <article key={d.id} className="session-record">
                  {master ? (
                    <>
                      {field('Título do documento', d.name, (v) =>
                        edit({
                          ...state,
                          documents: state.documents.map((x) =>
                            x.id === d.id ? { ...x, name: v } : x,
                          ),
                        }),
                      )}
                      {field('Link HTTPS', d.url, (v) =>
                        edit({
                          ...state,
                          documents: state.documents.map((x) =>
                            x.id === d.id ? { ...x, url: v } : x,
                          ),
                        }),
                      )}
                    </>
                  ) : (
                    <a
                      href={/^https:\/\//.test(d.url) ? d.url : undefined}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {d.name}
                    </a>
                  )}
                </article>
              ))}
              {master && (
                <button
                  className="secondary-button"
                  onClick={() =>
                    edit({
                      ...state,
                      documents: [
                        ...state.documents,
                        { id: crypto.randomUUID(), name: '', url: '' },
                      ],
                    })
                  }
                >
                  Adicionar documento
                </button>
              )}
            </section>
            {master && (
              <section className="panel session-section">
                <h2>Notas privadas do Mestre</h2>
                {field(
                  'NPCs, inimigos, encontros e preparação',
                  notes,
                  (v) => {
                    editVersion.current++
                    setNotes(v)
                    dirtyRef.current = true
                    setDirty(true)
                  },
                  true,
                )}
                <p>
                  Este conteúdo tem permissão própria no banco e não é enviado
                  aos jogadores. Para Assassinato Garantido: confira acesso,
                  alcance, anonimato e Camadas de Proteção. Use o Dossiê na
                  ficha para registrar as camadas reais; armadura não cria
                  camada automaticamente.
                </p>
              </section>
            )}
            <section className="panel session-section">
              <h2>Avisos à mesa</h2>
              {state.notices
                .filter((n) => !n.recipient || n.recipient === userId || master)
                .map((n) => (
                  <p key={n.id} role="status">
                    {n.message}
                  </p>
                ))}
              {master && (
                <>
                  <p>
                    Os avisos são públicos para a campanha; o destinatário é
                    apenas um destaque.
                  </p>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      const note = window.prompt('Aviso aos participantes:')
                      if (note)
                        edit({
                          ...state,
                          notices: [
                            ...state.notices,
                            {
                              id: crypto.randomUUID(),
                              message: note,
                              recipient: '',
                            },
                          ].slice(-30),
                        })
                    }}
                  >
                    Novo aviso
                  </button>
                </>
              )}
            </section>
            <section className="panel session-section">
              <h2>Histórico protegido</h2>
              {events.map((e) => (
                <details key={e.id}>
                  <summary>
                    {new Date(e.created_at).toLocaleString('pt-BR')} ·{' '}
                    {e.kind === 'roll'
                      ? `${e.payload.formula} = ${e.payload.total}`
                      : e.kind === 'sheet'
                        ? 'Alteração de ficha'
                        : e.kind === 'restore'
                          ? 'Backup restaurado'
                          : 'Atualização da sessão'}{' '}
                    · autor {e.actor_id?.slice(0, 8) || 'sistema'}
                  </summary>
                  <pre className="history-json">
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                </details>
              ))}
              {!events.length && <p>Nenhum evento registrado ainda.</p>}
              <button
                className="secondary-button"
                disabled={older || !events.length}
                onClick={async () => {
                  setOlder(true)
                  try {
                    const next = await loadEvents(
                      campaign.id,
                      events[events.length - 1].id,
                    )
                    setEvents([...events, ...next])
                  } catch (e) {
                    setError(message(e))
                  } finally {
                    setOlder(false)
                  }
                }}
              >
                Carregar anteriores
              </button>
            </section>
            {master && (
              <section className="panel session-section">
                <h2>Backup da campanha</h2>
                <button
                  className="secondary-button"
                  disabled={busy || dirty}
                  onClick={() => void exportCampaign()}
                >
                  Exportar campanha em JSON
                </button>
                <label className="field">
                  <span>Importar backup desta campanha</span>
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const parsed = await readBackup(file, 'orion-campaign')
                        if (parsed.campaignId !== campaign.id)
                          throw new Error('Escolha um backup desta campanha.')
                        setRestore(parsed)
                        setConfirmation('')
                      } catch (e) {
                        setError(message(e))
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
                {restore && (
                  <>
                    <p>
                      Restaurar substitui as fichas dos participantes incluídos,
                      condições, notas, missões e recursos. O histórico
                      protegido anterior é preservado. Digite {campaign.name}{' '}
                      para confirmar.
                    </p>
                    {field(
                      'Nome da campanha para restaurar',
                      confirmation,
                      setConfirmation,
                    )}
                    <button
                      className="danger-text-button"
                      disabled={busy || confirmation !== campaign.name}
                      onClick={async () => {
                        setBusy(true)
                        try {
                          const { error } = await requireSupabase().rpc(
                            'restore_campaign_backup',
                            { target_id: campaign.id, backup: restore },
                          )
                          if (error) throw error
                          setRestore(null)
                          dirtyRef.current = false
                          await reload()
                          onRestored()
                        } catch (e) {
                          setError(message(e))
                        } finally {
                          setBusy(false)
                        }
                      }}
                    >
                      Restaurar backup
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => setRestore(null)}
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </section>
            )}
          </fieldset>
        )}
      </main>
    </div>
  )
}
