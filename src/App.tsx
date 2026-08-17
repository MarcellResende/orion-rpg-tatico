import { useState, type FormEvent } from 'react'
import { createEmptyCharacter } from './character'
import { ResourceCard } from './components/ResourceCard'
import { Stepper } from './components/Stepper'
import {
  ATTRIBUTE_EFFECTS,
  ATTRIBUTE_LABELS,
  CONDITION_GROUP_LABELS,
  CONDITIONS,
  FUNCTIONS,
  SKILL_LABELS,
  TRAITS,
} from './data/manual'
import {
  ATTRIBUTE_POINT_LIMIT,
  applyCharacterLimits,
  calculateAttributePointsSpent,
  calculateCharacterBonuses,
  calculateDerivedResources,
  calculateEffectiveAttributes,
  calculateEffectiveSkills,
  calculateInventoryWeight,
  calculateSkillPointsSpent,
  changeAttribute,
  changeResource,
  changeSkill,
  setResource,
  validateIdentity,
} from './rules/calculations'
import type { ActiveCondition } from './onlineTypes'
import {
  ATTRIBUTE_KEYS,
  SKILL_KEYS,
  type AttributeKey,
  type Character,
  type Identity,
  type InventoryItem,
  type ResourceKey,
} from './types'

export type SaveState = 'saving' | 'saved' | 'error'

interface CharacterSheetProps {
  character: Character
  campaignName: string
  isOwnCharacter: boolean
  isMaster: boolean
  saveState: SaveState
  conditions: ActiveCondition[]
  conditionActionLoading: boolean
  onChange: (character: Character) => void
  onAddCondition: (conditionId: string) => void
  onRemoveCondition: (conditionRecordId: string) => void
  onShowCampaigns: () => void
  onShowSquad: () => void
  onSignOut: () => void
}

const hpStatus = (current: number, maximum: number) => {
  if (current === 0) return 'FORA DE COMBATE'
  if (current <= maximum * 0.25) return 'CRÍTICO'
  if (current <= maximum * 0.5) return 'ATENÇÃO'
  return 'ESTÁVEL'
}

const hpTone = (current: number, maximum: number) => {
  if (current <= maximum * 0.25) return 'red' as const
  if (current <= maximum * 0.5) return 'amber' as const
  return 'green' as const
}

const makeInventoryId = () =>
  globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(36).slice(2)}`

export function CharacterSheet({
  character,
  campaignName,
  isOwnCharacter,
  isMaster,
  saveState,
  conditions,
  conditionActionLoading,
  onChange,
  onAddCondition,
  onRemoveCondition,
  onShowCampaigns,
  onShowSquad,
  onSignOut,
}: CharacterSheetProps) {
  const [conditionToAdd, setConditionToAdd] = useState('')
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemWeight, setItemWeight] = useState(0)
  const [itemNotes, setItemNotes] = useState('')
  const derived = calculateDerivedResources(character)
  const bonuses = calculateCharacterBonuses(character)
  const effectiveAttributes = calculateEffectiveAttributes(character)
  const effectiveSkills = calculateEffectiveSkills(character)
  const attributePointsSpent = calculateAttributePointsSpent(character.attributes)
  const skillPointsSpent = calculateSkillPointsSpent(character.skills)
  const attributePointsRemaining = ATTRIBUTE_POINT_LIMIT - attributePointsSpent
  const skillPointsRemaining = derived.maxSkillPoints - skillPointsSpent
  const identityErrors = validateIdentity(character)
  const selectedFunction = FUNCTIONS.find((item) => item.id === character.identity.functionId)
  const selectedTrait = TRAITS.find((item) => item.id === character.identity.traitId)
  const stressAtLimit = character.resources.stress >= derived.maxStress
  const inventoryWeight = calculateInventoryWeight(character)
  const availableConditions = CONDITIONS.filter(
    (definition) => !conditions.some((active) => active.conditionId === definition.id),
  )

  const commit = (update: (current: Character) => Character) => {
    onChange({
      ...update(character),
      updatedAt: new Date().toISOString(),
    })
  }

  const updateIdentity = <Key extends keyof Identity,>(key: Key, value: Identity[Key]) => {
    commit((current) => applyCharacterLimits({
      ...current,
      identity: { ...current.identity, [key]: value },
      functionChoices: key === 'functionId' ? {} : current.functionChoices,
    }))
  }

  const updateFunctionChoice = (choiceId: string, value: AttributeKey | '') => {
    commit((current) => applyCharacterLimits({
      ...current,
      functionChoices: { ...current.functionChoices, [choiceId]: value },
    }))
  }

  const updateResource = (key: ResourceKey, value: number) => {
    if (Number.isNaN(value)) return
    commit((current) => setResource(current, key, value))
  }

  const resetCharacter = () => {
    const confirmed = window.confirm(
      'Limpar esta ficha? Os dados online atuais serão substituídos.',
    )
    if (!confirmed) return

    onChange(createEmptyCharacter())
  }

  const addInventoryItem = (event: FormEvent) => {
    event.preventDefault()
    const name = itemName.trim()
    if (!name) return
    const item: InventoryItem = {
      id: makeInventoryId(),
      name,
      quantity: Math.max(1, Math.round(itemQuantity || 1)),
      weight: Math.max(0, Math.round((itemWeight || 0) * 100) / 100),
      notes: itemNotes.trim(),
    }
    commit((current) => ({ ...current, inventory: [...current.inventory, item] }))
    setItemName('')
    setItemQuantity(1)
    setItemWeight(0)
    setItemNotes('')
  }

  const removeInventoryItem = (itemId: string) => {
    commit((current) => ({
      ...current,
      inventory: current.inventory.filter((item) => item.id !== itemId),
    }))
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">O</span>
          <div>
            <span className="eyebrow">ORION // TERMINAL DE CAMPO</span>
            <h1>Ficha de Operador</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <span className={`save-state save-state--${saveState}`} role="status">
            <span aria-hidden="true" />
            {saveState === 'saving' && 'Salvando'}
            {saveState === 'saved' && 'Sincronizado'}
            {saveState === 'error' && 'Falha na sincronização'}
          </span>
          {isMaster && (
            <button type="button" className="secondary-button" onClick={onShowSquad}>
              Esquadrão
            </button>
          )}
          <button type="button" className="secondary-button" onClick={onShowCampaigns}>
            Campanhas
          </button>
          {isOwnCharacter && (
            <button type="button" className="secondary-button" onClick={resetCharacter}>
              Limpar ficha
            </button>
          )}
          <button type="button" className="text-button" onClick={onSignOut}>
            Sair
          </button>
        </div>
      </header>

      <main>
        <section className="mission-strip" aria-label="Resumo do operador">
          <div>
            <span className="eyebrow">OPERADOR</span>
            <strong>{character.identity.codename || character.identity.name || 'NÃO IDENTIFICADO'}</strong>
          </div>
          <div>
            <span className="eyebrow">NÍVEL</span>
            <strong>01</strong>
          </div>
          <div>
            <span className="eyebrow">FUNÇÃO</span>
            <strong>{selectedFunction?.name ?? 'NÃO ATRIBUÍDA'}</strong>
          </div>
          <div>
            <span className="eyebrow">CAMPANHA</span>
            <strong>{campaignName}</strong>
          </div>
        </section>

        {stressAtLimit && (
          <div className="critical-alert" role="alert">
            <span className="critical-alert__icon" aria-hidden="true">!</span>
            <div>
              <strong>ESTRESSE NO LIMITE — VISÃO DE TÚNEL / PÂNICO TÁTICO</strong>
              <p>Verifique imunidades e efeitos aplicáveis antes de resolver a condição.</p>
            </div>
          </div>
        )}

        <section className="resource-grid" aria-labelledby="resources-heading">
          <h2 id="resources-heading" className="sr-only">Recursos principais</h2>
          <ResourceCard
            label="Pontos de Vida"
            code="PV"
            current={character.resources.hp}
            maximum={derived.maxHp}
            explanation={`20 base + ${effectiveAttributes.constitution} Constituição total × 10`}
            status={hpStatus(character.resources.hp, derived.maxHp)}
            tone={hpTone(character.resources.hp, derived.maxHp)}
            onDelta={(delta) => commit((current) => changeResource(current, 'hp', delta))}
            onSet={(value) => updateResource('hp', value)}
          />
          <ResourceCard
            label="Energia"
            code="EN"
            current={character.resources.energy}
            maximum={derived.maxEnergy}
            explanation={`10 base + ${effectiveAttributes.dexterity} Destreza total × 5`}
            status={character.resources.energy === 0 ? 'ESGOTADA' : 'OPERACIONAL'}
            tone="cyan"
            onDelta={(delta) => commit((current) => changeResource(current, 'energy', delta))}
            onSet={(value) => updateResource('energy', value)}
          />
          <article className="resource-card resource-card--green defense-card">
            <div className="resource-card__header">
              <div>
                <span className="eyebrow">DEF</span>
                <h3>Defesa</h3>
              </div>
              <span className="status-label">BASE</span>
            </div>
            <div className="defense-value">{derived.defense}</div>
            <div className="resource-meter resource-meter--static" aria-hidden="true"><span /></div>
            <p className="calculation-note">10 base. Cobertura, armadura e postura entrarão em uma fase futura.</p>
          </article>
          <ResourceCard
            label="Compostura"
            code="CP"
            current={character.resources.composure}
            maximum={derived.maxComposure}
            explanation={`5 base + ${effectiveSkills.willpower} Vontade total + ${effectiveAttributes.intelligence} Inteligência total`}
            status={character.resources.composure === 0 ? 'RUPTURA' : 'FOCADO'}
            tone="violet"
            onDelta={(delta) => commit((current) => changeResource(current, 'composure', delta))}
            onSet={(value) => updateResource('composure', value)}
          />
          <ResourceCard
            label="Estresse"
            code="STR"
            current={character.resources.stress}
            maximum={derived.maxStress}
            explanation="Limite padrão do manual: 6."
            status={stressAtLimit ? 'PÂNICO' : 'MONITORADO'}
            tone={stressAtLimit ? 'red' : 'amber'}
            steps={[-1, 1]}
            onDelta={(delta) => commit((current) => changeResource(current, 'stress', delta))}
            onSet={(value) => updateResource('stress', value)}
          />
        </section>

        <div className="content-grid">
          <div className="content-column">
            <section className="panel" aria-labelledby="identity-heading">
              <div className="panel-heading">
                <div>
                  <span className="section-index">01</span>
                  <h2 id="identity-heading">Identificação</h2>
                </div>
                <span className="panel-code">ID/OPR</span>
              </div>

              <div className="form-grid">
                <label className="field field--wide">
                  <span>Nome completo</span>
                  <input
                    type="text"
                    value={character.identity.name}
                    onChange={(event) => updateIdentity('name', event.currentTarget.value)}
                    aria-invalid={Boolean(identityErrors.name)}
                    aria-describedby={identityErrors.name ? 'name-error' : undefined}
                    placeholder="Nome civil do operador"
                  />
                  {identityErrors.name && <small id="name-error" className="field-error">{identityErrors.name}</small>}
                </label>
                <label className="field">
                  <span>Vulgo / codinome</span>
                  <input
                    type="text"
                    value={character.identity.codename}
                    onChange={(event) => updateIdentity('codename', event.currentTarget.value)}
                    placeholder="Atribuído em campanha"
                  />
                </label>
                <label className="field">
                  <span>Idade</span>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={character.identity.age ?? ''}
                    onChange={(event) =>
                      updateIdentity('age', event.currentTarget.value === '' ? null : event.currentTarget.valueAsNumber)
                    }
                    aria-invalid={Boolean(identityErrors.age)}
                    aria-describedby={identityErrors.age ? 'age-error' : undefined}
                    placeholder="23+"
                  />
                  {identityErrors.age && <small id="age-error" className="field-error">{identityErrors.age}</small>}
                </label>
                <label className="field">
                  <span>Nacionalidade</span>
                  <input
                    type="text"
                    value={character.identity.nationality}
                    onChange={(event) => updateIdentity('nationality', event.currentTarget.value)}
                    placeholder="País de origem"
                  />
                </label>
                <label className="field field--wide">
                  <span>Remorso</span>
                  <textarea
                    rows={3}
                    value={character.identity.remorse}
                    onChange={(event) => updateIdentity('remorse', event.currentTarget.value)}
                    placeholder="Registro narrativo do operador"
                  />
                </label>
              </div>
            </section>

            <section className="panel" aria-labelledby="attributes-heading">
              <div className="panel-heading">
                <div>
                  <span className="section-index">02</span>
                  <h2 id="attributes-heading">Atributos</h2>
                </div>
                <span className={`point-counter ${attributePointsRemaining === 0 ? 'point-counter--complete' : ''}`}>
                  {attributePointsSpent} / {ATTRIBUTE_POINT_LIMIT}
                </span>
              </div>
              <p className="panel-intro">Distribua até seis pontos. O total mostrado já soma o bônus da função, sem consumi-lo.</p>
              <div className="stepper-list">
                {ATTRIBUTE_KEYS.map((key) => {
                  return (
                    <Stepper
                      key={key}
                      label={ATTRIBUTE_LABELS[key]}
                      value={character.attributes[key]}
                      bonus={bonuses.attributes[key]}
                      hint={ATTRIBUTE_EFFECTS[key]}
                      disableDecrease={
                        character.attributes[key] === 0 ||
                        changeAttribute(character, key, -1) === character
                      }
                      disableIncrease={attributePointsRemaining === 0}
                      onDecrease={() => commit((current) => changeAttribute(current, key, -1))}
                      onIncrease={() => commit((current) => changeAttribute(current, key, 1))}
                    />
                  )
                })}
              </div>
            </section>
          </div>

          <div className="content-column">
            <section className="panel" aria-labelledby="profile-heading">
              <div className="panel-heading">
                <div>
                  <span className="section-index">03</span>
                  <h2 id="profile-heading">Função e Perfil</h2>
                </div>
                <span className="panel-code">DOSSIÊ</span>
              </div>
              <div className="form-grid">
                <label className="field field--wide">
                  <span>Função</span>
                  <select
                    value={character.identity.functionId}
                    onChange={(event) => updateIdentity('functionId', event.currentTarget.value)}
                  >
                    <option value="">Selecione uma função</option>
                    {FUNCTIONS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                {selectedFunction && (
                  <div className="definition-card field--wide">
                    <span className="definition-card__source">MANUAL // PÁG. {selectedFunction.sourcePage}</span>
                    <strong>{selectedFunction.exclusiveAbility}</strong>
                    <p>{selectedFunction.description}</p>
                    <p><b>Bônus descrito:</b> {selectedFunction.bonus}</p>
                    <small>Bônus de atributos e perícias principais aplicado automaticamente.</small>
                  </div>
                )}
                {selectedFunction?.attributeChoices?.map((choice) => (
                  <label className="field field--wide function-choice" key={choice.id}>
                    <span>{choice.label}</span>
                    <select
                      value={character.functionChoices[choice.id] ?? ''}
                      onChange={(event) => updateFunctionChoice(choice.id, event.currentTarget.value as AttributeKey | '')}
                    >
                      <option value="">Escolha onde aplicar +1</option>
                      {choice.options.map((key) => (
                        <option key={key} value={key}>{ATTRIBUTE_LABELS[key]}</option>
                      ))}
                    </select>
                  </label>
                ))}
                <label className="field field--wide">
                  <span>Traço atribuído</span>
                  <select
                    value={character.identity.traitId}
                    onChange={(event) => updateIdentity('traitId', event.currentTarget.value)}
                  >
                    <option value="">Selecione um traço</option>
                    {TRAITS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                {selectedTrait && (
                  <div className="definition-card definition-card--trait field--wide">
                    <span className="definition-card__source">MANUAL // PÁG. {selectedTrait.sourcePage}</span>
                    <strong>{selectedTrait.name}</strong>
                    <p>{selectedTrait.profile}</p>
                    <p><b>Vantagem:</b> {selectedTrait.advantage}</p>
                    <p><b>Gatilho:</b> {selectedTrait.roleplayTrigger}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="panel" aria-labelledby="skills-heading">
              <div className="panel-heading">
                <div>
                  <span className="section-index">04</span>
                  <h2 id="skills-heading">Perícias</h2>
                </div>
                <span className={`point-counter ${skillPointsRemaining === 0 ? 'point-counter--complete' : ''}`}>
                  {skillPointsSpent} / {derived.maxSkillPoints}
                </span>
              </div>
              <p className="panel-intro">
                {derived.maxSkillPoints} pontos distribuíveis (10 base + Inteligência total). Bônus de função e traço aparecem no total e não gastam pontos.
              </p>
              <div className="stepper-list stepper-list--compact">
                {SKILL_KEYS.map((key) => (
                  <Stepper
                    key={key}
                    label={SKILL_LABELS[key]}
                    value={character.skills[key]}
                    bonus={bonuses.skills[key]}
                    hint={
                      bonuses.skills[key] > 0
                        ? 'Total inclui bônus automático de função ou traço; vantagens de traço são situacionais.'
                        : key === 'willpower'
                          ? 'Soma na Compostura máxima.'
                          : undefined
                    }
                    disableDecrease={character.skills[key] === 0}
                    disableIncrease={skillPointsRemaining === 0}
                    onDecrease={() => commit((current) => changeSkill(current, key, -1))}
                    onIncrease={() => commit((current) => changeSkill(current, key, 1))}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="operations-grid">
          <section className="panel operations-panel" aria-labelledby="conditions-heading">
            <div className="panel-heading">
              <div>
                <span className="section-index">05</span>
                <h2 id="conditions-heading">Condições</h2>
              </div>
              <span className="point-counter">{conditions.length} ATIVA{conditions.length === 1 ? '' : 'S'}</span>
            </div>
            <p className="panel-intro">
              Jogadores podem adicionar condições na própria ficha. Somente o mestre pode removê-las.
            </p>

            {conditions.length === 0 ? (
              <div className="empty-inline">Nenhuma condição ativa.</div>
            ) : (
              <div className="condition-list">
                {conditions.map((active) => {
                  const definition = CONDITIONS.find((item) => item.id === active.conditionId)
                  if (!definition) return null
                  return (
                    <article className="condition-card" key={active.id}>
                      <div className="condition-card__heading">
                        <div>
                          <span>{CONDITION_GROUP_LABELS[definition.group]}</span>
                          <strong>{definition.name}</strong>
                        </div>
                        {isMaster && (
                          <button
                            type="button"
                            className="danger-text-button"
                            disabled={conditionActionLoading}
                            onClick={() => onRemoveCondition(active.id)}
                          >
                            Remover
                          </button>
                        )}
                      </div>
                      <p><b>Causa:</b> {definition.cause}</p>
                      <p><b>Efeito:</b> {definition.effect}</p>
                      <small>Manual // pág. {definition.sourcePage}</small>
                    </article>
                  )
                })}
              </div>
            )}

            <div className="condition-add">
              <label className="field">
                <span>Adicionar condição</span>
                <select
                  value={conditionToAdd}
                  disabled={conditionActionLoading || availableConditions.length === 0}
                  onChange={(event) => setConditionToAdd(event.currentTarget.value)}
                >
                  <option value="">Selecione</option>
                  {availableConditions.map((definition) => (
                    <option key={definition.id} value={definition.id}>{definition.name}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="primary-button"
                disabled={!conditionToAdd || conditionActionLoading}
                onClick={() => {
                  onAddCondition(conditionToAdd)
                  setConditionToAdd('')
                }}
              >
                {conditionActionLoading ? 'Atualizando...' : 'Aplicar condição'}
              </button>
            </div>
          </section>

          <section className="panel operations-panel" aria-labelledby="inventory-heading">
            <div className="panel-heading">
              <div>
                <span className="section-index">06</span>
                <h2 id="inventory-heading">Inventário</h2>
              </div>
              <span className="point-counter">{inventoryWeight.toLocaleString('pt-BR')} KG</span>
            </div>
            <p className="panel-intro">
              O peso total é calculado automaticamente. O limite de carga continua sob decisão do mestre por conflito no manual.
            </p>

            {character.inventory.length === 0 ? (
              <div className="empty-inline">Nenhum equipamento adicionado.</div>
            ) : (
              <div className="inventory-list">
                {character.inventory.map((item) => (
                  <article className="inventory-item" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.quantity} × {item.weight.toLocaleString('pt-BR')} kg</span>
                      {item.notes && <p>{item.notes}</p>}
                    </div>
                    <div>
                      <b>{(item.quantity * item.weight).toLocaleString('pt-BR')} kg</b>
                      <button type="button" className="danger-text-button" onClick={() => removeInventoryItem(item.id)}>
                        Remover
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <form className="inventory-form" onSubmit={addInventoryItem}>
              <label className="field inventory-name">
                <span>Equipamento</span>
                <input
                  value={itemName}
                  maxLength={100}
                  required
                  placeholder="Ex.: Kit Médico de Trauma"
                  onChange={(event) => setItemName(event.currentTarget.value)}
                />
              </label>
              <label className="field">
                <span>Quantidade</span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={itemQuantity}
                  onChange={(event) => setItemQuantity(event.currentTarget.valueAsNumber)}
                />
              </label>
              <label className="field">
                <span>Peso unitário (kg)</span>
                <input
                  type="number"
                  min={0}
                  max={9999}
                  step="0.01"
                  value={itemWeight}
                  onChange={(event) => setItemWeight(event.currentTarget.valueAsNumber)}
                />
              </label>
              <label className="field inventory-notes">
                <span>Observação</span>
                <input
                  value={itemNotes}
                  maxLength={300}
                  placeholder="Usos, munição ou efeito"
                  onChange={(event) => setItemNotes(event.currentTarget.value)}
                />
              </label>
              <button type="submit" className="primary-button">Adicionar equipamento</button>
            </form>
          </section>
        </div>

        <aside className="scope-note">
          <span className="scope-note__marker" aria-hidden="true">i</span>
          <div>
            <strong>SINCRONIZAÇÃO ONLINE ATIVA</strong>
            <p>A ficha, o inventário e as condições são salvos no Supabase. O mestre acompanha o esquadrão em tempo real.</p>
          </div>
        </aside>
      </main>

      <footer>
        <span>ORION FIELD SYSTEM // ONLINE BUILD 0.3</span>
        <span>FONTE: MANUAL_RPG_TATICO.PDF</span>
      </footer>
    </div>
  )
}
