import { useEffect, useState } from 'react'
import type { Character } from '../types'
import { downloadJson, readBackup, safeImage } from '../session'
import { loadEvents, type SessionEvent } from '../services/sessionService'
export function CharacterExtras({
  character,
  onChange,
  campaignId,
}: {
  character: Character
  onChange: (c: Character) => void
  campaignId?: string
}) {
  const [pending, setPending] = useState<Character | null>(null),
    [error, setError] = useState(''),
    [events, setEvents] = useState<SessionEvent[]>([])
  useEffect(() => {
    if (campaignId)
      void loadEvents(campaignId)
        .then((e) => setEvents(e.filter((x) => x.kind === 'sheet')))
        .catch(() => {})
  }, [campaignId, character.updatedAt])
  return (
    <section className="panel session-section">
      <h2>Retrato, biografia e backup da ficha</h2>
      {safeImage(character.identity.portrait) && (
        <img
          className="operator-portrait"
          src={character.identity.portrait}
          alt="Retrato do personagem"
          referrerPolicy="no-referrer"
        />
      )}
      <label className="field">
        <span>Retrato (link HTTPS da imagem)</span>
        <input
          type="url"
          value={character.identity.portrait ?? ''}
          onChange={(e) =>
            onChange({
              ...character,
              identity: { ...character.identity, portrait: e.target.value },
            })
          }
        />
      </label>
      <label className="field">
        <span>Biografia / antecedentes</span>
        <textarea
          rows={4}
          maxLength={4000}
          value={character.identity.biography ?? ''}
          onChange={(e) =>
            onChange({
              ...character,
              identity: { ...character.identity, biography: e.target.value },
            })
          }
        />
      </label>
      <div className="session-toolbar">
        <button
          className="secondary-button"
          onClick={() =>
            downloadJson('orion-ficha.json', {
              format: 'orion-sheet',
              version: 1,
              sheet: character,
              exportedAt: new Date().toISOString(),
            })
          }
        >
          Exportar ficha em JSON
        </button>
        <label className="field">
          <span>Importar ficha</span>
          <input
            type="file"
            accept="application/json,.json"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const parsed = await readBackup(file, 'orion-sheet')
                setPending(parsed.sheet as Character)
                setError('')
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Backup inválido.')
              }
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {pending && (
        <div role="alert">
          <p>
            Substituir esta ficha pelo backup de{' '}
            {pending.identity.codename ||
              pending.identity.name ||
              'personagem sem nome'}
            ? Condições controladas pelo Mestre não são alteradas por este
            backup individual.
          </p>
          <button
            className="danger-text-button"
            onClick={() => {
              onChange(pending)
              setPending(null)
            }}
          >
            Confirmar substituição da ficha
          </button>
          <button className="secondary-button" onClick={() => setPending(null)}>
            Cancelar
          </button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {events.length > 0 && (
        <details>
          <summary>
            Histórico de alterações da campanha permitido para você
          </summary>
          {events.map((e) => (
            <details key={e.id}>
              <summary>
                {new Date(e.created_at).toLocaleString('pt-BR')} ·{' '}
                {String(e.payload.name || 'Ficha')} · {e.actor_id?.slice(0, 8)}
              </summary>
              <pre className="history-json">
                {JSON.stringify(e.payload, null, 2)}
              </pre>
            </details>
          ))}
        </details>
      )}
    </section>
  )
}
