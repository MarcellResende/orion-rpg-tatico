import { useState } from 'react'
import type { CampaignSummary } from '../onlineTypes'
import { safeImage } from '../session'
export function CampaignEditor({
  campaign,
  onSave,
  busy,
}: {
  campaign: CampaignSummary
  onSave: (c: CampaignSummary) => Promise<void>
  busy: boolean
}) {
  const [draft, setDraft] = useState(campaign),
    [error, setError] = useState('')
  const metadata = draft.progression.metadata ?? {
    era: '',
    image: '',
    rules: 'Manual v1.4',
    archived: false,
  }
  return (
    <details className="session-record">
      <summary>Editar campanha</summary>
      <form
        className="gateway-form"
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            await onSave(draft)
            setError('Campanha salva.')
          } catch {
            setError('Não foi possível salvar a campanha.')
          }
        }}
      >
        <label>
          Nome
          <input
            value={draft.name}
            required
            maxLength={80}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label>
          Descrição
          <textarea
            rows={3}
            maxLength={400}
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
          />
        </label>
        {(
          [
            ['era', 'Período histórico'],
            ['rules', 'Sistema e versão das regras'],
            ['image', 'Imagem da campanha (link HTTPS)'],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              value={metadata[key]}
              maxLength={key === 'image' ? 2000 : 100}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  progression: {
                    ...draft.progression,
                    metadata: { ...metadata, [key]: e.target.value },
                  },
                })
              }
            />
          </label>
        ))}
        {safeImage(metadata.image) && (
          <img
            className="campaign-cover"
            src={metadata.image}
            alt="Imagem da campanha"
            referrerPolicy="no-referrer"
          />
        )}
        <label>
          <input
            type="checkbox"
            checked={metadata.archived}
            onChange={(e) =>
              setDraft({
                ...draft,
                progression: {
                  ...draft.progression,
                  metadata: { ...metadata, archived: e.target.checked },
                },
              })
            }
          />{' '}
          Arquivada (continua acessível aos participantes)
        </label>
        <button className="primary-button" disabled={busy}>
          Salvar campanha
        </button>
        {error && <p role="status">{error}</p>}
      </form>
    </details>
  )
}
