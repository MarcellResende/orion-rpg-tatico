import { useState } from 'react'
import type { OnlineCharacter } from '../onlineTypes'
import { CONDITIONS } from '../data/manual'
import { assassinProtection } from '../rules/assassinsCreed'
import { availableInventory } from '../data/expansions'
import {
  calculateDerivedResources,
  calculateInventoryWeight,
  calculateLoadState,
} from '../rules/calculations'
import {
  addCharacterCondition,
  removeCharacterCondition,
  saveCharacter,
} from '../services/campaignService'
import { requireSupabase } from '../lib/supabase'
import { safeImage } from '../session'
export function SquadOperatorTools({
  character,
  onChanged,
}: {
  character: OnlineCharacter
  onChanged: () => void
}) {
  const [penetration, setPenetration] = useState(0),
    [condition, setCondition] = useState(''),
    [duration, setDuration] = useState(''),
    [round, setRound] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [reason, setReason] = useState(''),
    [adjust, setAdjust] = useState(
      character.sheet.masterAdjustments ?? {
        hp: 0,
        energy: 0,
        defense: 0,
        reason: '',
      },
    )
  const protection = assassinProtection(character.sheet, penetration),
    derived = calculateDerivedResources(character.sheet),
    load = calculateLoadState(character.sheet),
    armor = availableInventory(character.sheet).find(
      (i) => i.active && i.slot === 'armor',
    )
  const act = async (work: () => Promise<unknown>) => {
    setBusy(true)
    setError('')
    try {
      await work()
      onChanged()
    } catch (e) {
      setError(
        e && typeof e === 'object' && 'message' in e
          ? String(e.message)
          : 'Falha ao salvar.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="session-record">
      {safeImage(character.sheet.identity.portrait) && (
        <img
          className="operator-portrait"
          src={character.sheet.identity.portrait}
          alt="Retrato do operador"
          referrerPolicy="no-referrer"
        />
      )}
      <p>
        Defesa {derived.defense} · {armor?.name ?? 'Sem armadura'} · RA{' '}
        {protection.ra} → {protection.effectiveRa} · Fluxo {protection.flow}/
        {protection.flowMaximum}
      </p>
      <p>
        Carga{' '}
        {calculateInventoryWeight(character.sheet).toLocaleString('pt-BR')} /{' '}
        {load.baseLimit} kg · Movimento {derived.movement} m
      </p>
      <label className="field">
        <span>Penetrante recebido</span>
        <select
          value={penetration}
          onChange={(e) => setPenetration(Number(e.target.value))}
        >
          {[0, 1, 2, 3].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <details>
        <summary>Condições e duração</summary>
        <label className="field">
          <span>Aplicar condição</span>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          >
            <option value="">Selecione</option>
            {CONDITIONS.filter(
              (c) => !character.conditions.some((a) => a.conditionId === c.id),
            ).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Duração / gatilho para remover</span>
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Até tratamento, fim da cena…"
          />
        </label>
        <label className="field">
          <span>Expira no início da rodada (opcional)</span>
          <input
            type="number"
            min={1}
            value={round}
            onChange={(e) => setRound(e.target.value)}
          />
        </label>
        <button
          className="secondary-button"
          disabled={busy || !condition}
          onClick={() =>
            void act(async () => {
              const c = await addCharacterCondition(character.id, condition)
              if (duration || round) {
                const { error } = await requireSupabase()
                  .from('character_conditions')
                  .update({
                    duration_note: duration,
                    expires_round: round ? Number(round) : null,
                  })
                  .eq('id', c.id)
                if (error) throw error
              }
              setCondition('')
            })
          }
        >
          Aplicar
        </button>
        {character.conditions.map((c) => (
          <div key={c.id}>
            <p>
              <b>{CONDITIONS.find((d) => d.id === c.conditionId)?.name}</b>:{' '}
              {CONDITIONS.find((d) => d.id === c.conditionId)?.effect}
            </p>
            <small>
              {c.durationNote}{' '}
              {c.expiresRound ? `Até rodada ${c.expiresRound}` : ''}
            </small>
            <button
              className="danger-text-button"
              disabled={busy}
              onClick={() => void act(() => removeCharacterCondition(c.id))}
            >
              Remover condição
            </button>
          </div>
        ))}
      </details>
      <details>
        <summary>Ajustes do Mestre registrados no histórico</summary>
        {(
          [
            ['hp', 'PV máximos'],
            ['energy', 'Energia máxima'],
            ['defense', 'Defesa'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="field">
            <span>Modificador de {label}</span>
            <input
              type="number"
              min={-999}
              max={999}
              value={adjust[key]}
              onChange={(e) =>
                setAdjust({ ...adjust, [key]: Number(e.target.value) })
              }
            />
          </label>
        ))}
        <label className="field">
          <span>Motivo do ajuste</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <button
          className="secondary-button"
          disabled={busy || !reason.trim()}
          onClick={() =>
            void act(() =>
              saveCharacter(character.campaignId, character.ownerId, {
                ...character.sheet,
                masterAdjustments: { ...adjust, reason },
              }),
            )
          }
        >
          Aplicar ajuste
        </button>
      </details>
      <button
        className="danger-text-button"
        disabled={busy}
        onClick={() => {
          if (
            window.confirm(
              `Apagar definitivamente a ficha de ${character.sheet.identity.codename || character.sheet.identity.name}?`,
            )
          )
            void act(async () => {
              const { error } = await requireSupabase()
                .from('characters')
                .delete()
                .eq('id', character.id)
                .select('id')
                .single()
              if (error) throw error
            })
        }}
      >
        Apagar personagem
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
