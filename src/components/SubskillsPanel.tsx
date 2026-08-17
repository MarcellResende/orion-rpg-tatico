import { useState, type FormEvent } from 'react'
import { SKILL_LABELS } from '../data/manual'
import { SUBSKILL_RULES, subskillsFor } from '../data/subskills'
import {
  calculateCharacterBonuses,
  calculateSubskillPointsAvailable,
  calculateSubskillPointsSpent,
  changeCustomSpecialization,
  changeSubskill,
} from '../rules/calculations'
import { SKILL_KEYS, type Character, type SkillKey } from '../types'
import { Stepper } from './Stepper'

interface SubskillsPanelProps {
  character: Character
  onChange: (character: Character) => void
}

const makeSpecializationId = () =>
  globalThis.crypto?.randomUUID?.() ?? `specialization-${Date.now()}-${Math.random().toString(36).slice(2)}`

export function SubskillsPanel({ character, onChange }: SubskillsPanelProps) {
  const [skillKey, setSkillKey] = useState<SkillKey>('combat')
  const [name, setName] = useState('')
  const bonuses = calculateCharacterBonuses(character).subskills

  const commit = (next: Character) => onChange({
    ...next,
    updatedAt: new Date().toISOString(),
  })

  const addSpecialization = (event: FormEvent) => {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) return
    commit({
      ...character,
      specializations: [
        ...character.specializations,
        { id: makeSpecializationId(), skillKey, name: cleanName, value: 0 },
      ],
    })
    setName('')
  }

  return (
    <section className="panel subskills-panel" aria-labelledby="subskills-heading">
      <div className="panel-heading">
        <div>
          <span className="section-index">05</span>
          <h2 id="subskills-heading">Subperícias e especializações</h2>
        </div>
        <span className="panel-code">TREINO</span>
      </div>
      <p className="panel-intro">
        Pontos de subperícia vêm apenas dos pontos distribuídos na perícia principal. Bônus de função e equipamento aparecem separados e são gratuitos.
      </p>

      <div className="subskill-groups">
        {SKILL_KEYS.map((currentSkill) => {
          const definitions = subskillsFor(currentSkill)
          const custom = character.specializations.filter((item) => item.skillKey === currentSkill)
          const available = calculateSubskillPointsAvailable(character, currentSkill)
          const spent = calculateSubskillPointsSpent(character, currentSkill)
          return (
            <details className="subskill-group" key={currentSkill} open={currentSkill === 'combat'}>
              <summary>
                <span><strong>{SKILL_LABELS[currentSkill]}</strong><small>{SUBSKILL_RULES[currentSkill]}</small></span>
                <b>{spent} / {available}</b>
              </summary>
              <div className="subskill-group__content">
                {definitions.length === 0 && custom.length === 0 && (
                  <div className="empty-inline">Adicione abaixo uma especialização própria para esta perícia.</div>
                )}
                {definitions.map((definition) => (
                  <Stepper
                    key={definition.key}
                    label={definition.name}
                    value={character.subskills[definition.key]}
                    bonus={bonuses[definition.key]}
                    hint={definition.description}
                    disableDecrease={character.subskills[definition.key] === 0}
                    disableIncrease={spent >= available}
                    onDecrease={() => commit(changeSubskill(character, definition.key, -1))}
                    onIncrease={() => commit(changeSubskill(character, definition.key, 1))}
                  />
                ))}
                {custom.map((specialization) => (
                  <div className="custom-specialization" key={specialization.id}>
                    <Stepper
                      label={specialization.name}
                      value={specialization.value}
                      hint={`Especialização livre de ${SKILL_LABELS[currentSkill]}.`}
                      disableDecrease={specialization.value === 0}
                      disableIncrease={spent >= available}
                      onDecrease={() => commit(changeCustomSpecialization(character, specialization.id, -1))}
                      onIncrease={() => commit(changeCustomSpecialization(character, specialization.id, 1))}
                    />
                    <button
                      type="button"
                      className="danger-text-button"
                      onClick={() => commit({
                        ...character,
                        specializations: character.specializations.filter((item) => item.id !== specialization.id),
                      })}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )
        })}
      </div>

      <form className="specialization-form" onSubmit={addSpecialization}>
        <label className="field">
          <span>Perícia principal</span>
          <select value={skillKey} onChange={(event) => setSkillKey(event.currentTarget.value as SkillKey)}>
            {SKILL_KEYS.map((key) => <option key={key} value={key}>{SKILL_LABELS[key]}</option>)}
          </select>
        </label>
        <label className="field specialization-name">
          <span>Nova especialização</span>
          <input value={name} maxLength={80} onChange={(event) => setName(event.currentTarget.value)} placeholder="Ex.: Demolições submarinas" />
        </label>
        <button type="submit" className="secondary-button" disabled={!name.trim()}>Adicionar especialização</button>
      </form>
    </section>
  )
}

