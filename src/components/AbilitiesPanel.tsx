import { GENERAL_ABILITIES, findGeneralAbility } from '../data/abilities'
import { FUNCTIONS, SKILL_LABELS } from '../data/manual'
import { SUBSKILLS } from '../data/subskills'
import {
  calculateActiveGeneralAbilities,
  calculateLevelFromXp,
  calculateProgressionRewards,
} from '../rules/calculations'
import type { Character, ProgressionState } from '../types'

interface AbilitiesPanelProps {
  character: Character
  onChange: (character: Character) => void
}

const bonusLabels = (abilityId: string) => {
  const ability = findGeneralAbility(abilityId)
  if (!ability) return []
  const labels: string[] = []
  for (const [key, amount] of Object.entries(ability.skillBonuses ?? {})) {
    if (amount) labels.push(`${amount > 0 ? '+' : ''}${amount} ${SKILL_LABELS[key as keyof typeof SKILL_LABELS]}`)
  }
  for (const [key, amount] of Object.entries(ability.subskillBonuses ?? {})) {
    const subskill = SUBSKILLS.find((item) => item.key === key)
    if (amount && subskill) labels.push(`${amount > 0 ? '+' : ''}${amount} ${subskill.name}`)
  }
  if (ability.maxHpBonus) labels.push(`+${ability.maxHpBonus} PV máximos`)
  if (ability.loadLimitBonus) labels.push(`+${ability.loadLimitBonus} kg de carga`)
  return labels
}

export function AbilitiesPanel({ character, onChange }: AbilitiesPanelProps) {
  const level = calculateLevelFromXp(character.progression.xp)
  const rewards = calculateProgressionRewards(level)
  const selectedFunction = FUNCTIONS.find((item) => item.id === character.identity.functionId)
  const activeAbilities = calculateActiveGeneralAbilities(character)

  const commitProgression = <Key extends keyof ProgressionState>(key: Key, value: ProgressionState[Key]) => {
    onChange({
      ...character,
      progression: { ...character.progression, [key]: value },
      updatedAt: new Date().toISOString(),
    })
  }

  const updateAbility = (index: number, abilityId: string) => {
    const selections = Array.from(
      { length: rewards.generalAbilitySlots },
      (_, slot) => character.progression.generalAbilities[slot] ?? '',
    )
    selections[index] = abilityId
    commitProgression('generalAbilities', selections)
  }

  return (
    <section className="panel abilities-panel" aria-labelledby="abilities-heading">
      <div className="panel-heading">
        <div>
          <span className="section-index">08</span>
          <h2 id="abilities-heading">Habilidades</h2>
        </div>
        <span className="panel-code">MANUAL 1.1</span>
      </div>

      <p className="panel-intro">
        Habilidades Gerais são liberadas nos níveis 2, 4, 7 e 9. Bônus numéricos da habilidade escolhida entram automaticamente nos totais da ficha e não consomem pontos.
      </p>

      <div className="exclusive-ability-card">
        <span>HABILIDADE EXCLUSIVA DA FUNÇÃO · NÍVEL 1</span>
        {selectedFunction ? (
          <>
            <strong>{selectedFunction.exclusiveAbility}</strong>
            <p>{selectedFunction.exclusiveAbilityEffect}</p>
            <small>{selectedFunction.name} · Manual pág. {selectedFunction.sourcePage}</small>
          </>
        ) : (
          <p>Escolha uma Função na aba “Ficha e perícias” para liberar a habilidade exclusiva.</p>
        )}
      </div>

      <div className="ability-slot-summary">
        <span><b>Nível {level}</b><small>{character.progression.xp} XP</small></span>
        <span><b>{activeAbilities.length} / {rewards.generalAbilitySlots}</b><small>Habilidades escolhidas</small></span>
        <span><b>{4 - rewards.generalAbilitySlots}</b><small>Espaços ainda bloqueados</small></span>
      </div>

      {rewards.generalAbilitySlots === 0 ? (
        <div className="empty-inline">A primeira Habilidade Geral é liberada no nível 2, com 4 XP.</div>
      ) : (
        <div className="ability-slots">
          {Array.from({ length: rewards.generalAbilitySlots }, (_, index) => {
            const selectedId = character.progression.generalAbilities[index] ?? ''
            const selected = findGeneralAbility(selectedId)
            const usedElsewhere = new Set(character.progression.generalAbilities.filter((_, slot) => slot !== index))
            return (
              <article className="ability-slot" key={index}>
                <label className="field">
                  <span>Habilidade Geral {index + 1}</span>
                  <select value={selected ? selectedId : ''} onChange={(event) => updateAbility(index, event.currentTarget.value)}>
                    <option value="">Escolha uma habilidade</option>
                    {GENERAL_ABILITIES.map((ability) => (
                      <option key={ability.id} value={ability.id} disabled={usedElsewhere.has(ability.id)}>
                        {ability.name}
                      </option>
                    ))}
                  </select>
                </label>
                {selected && (
                  <div className="ability-description">
                    <strong>{selected.name}</strong>
                    <p>{selected.effect}</p>
                    {bonusLabels(selected.id).length > 0 && (
                      <div className="ability-bonuses" aria-label="Bônus aplicados automaticamente">
                        {bonusLabels(selected.id).map((label) => <span key={label}>{label} automático</span>)}
                      </div>
                    )}
                    {selected.situational && <small>O valor é exibido na ficha; aplique-o somente na situação descrita pela habilidade.</small>}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      <div className="progression-fields ability-milestones">
        {rewards.functionSpecializationUnlocked && (
          <label className="field">
            <span>Especialização da Função · Nível 5</span>
            <input
              maxLength={160}
              value={character.progression.functionSpecialization}
              onChange={(event) => commitProgression('functionSpecialization', event.currentTarget.value)}
              placeholder="Registre a especialização definida com o Mestre"
            />
          </label>
        )}
        {rewards.veteranTrainingUnlocked && (
          <label className="field">
            <span>Especialidade Veterana · Nível 8</span>
            <select value={character.progression.veteranTraining} onChange={(event) => commitProgression('veteranTraining', event.currentTarget.value)}>
              <option value="">Escolha a Subperícia da rerrolagem</option>
              {SUBSKILLS.map((subskill) => <option key={subskill.key} value={subskill.key}>{subskill.name}</option>)}
            </select>
            <small>Uma vez por cena, após falhar nessa Subperícia, rerrole o d20 e aceite o segundo resultado.</small>
          </label>
        )}
        {rewards.maximumFunctionAbilityUnlocked && (
          <label className="field">
            <span>Habilidade Máxima da Função · Nível 10</span>
            <input
              maxLength={160}
              value={character.progression.maximumFunctionAbility}
              onChange={(event) => commitProgression('maximumFunctionAbility', event.currentTarget.value)}
              placeholder="Registre a habilidade máxima definida com o Mestre"
            />
          </label>
        )}
      </div>

      <details className="ability-catalog">
        <summary>Consultar as 30 Habilidades Gerais do manual</summary>
        <div className="ability-catalog-grid">
          {GENERAL_ABILITIES.map((ability, index) => (
            <article key={ability.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{ability.name}</strong>
              <p>{ability.effect}</p>
              {ability.automaticSummary && <small>AUTOMÁTICO · {ability.automaticSummary}</small>}
            </article>
          ))}
        </div>
      </details>
    </section>
  )
}
