import { useState } from 'react'
import { createEmptyCharacter } from './character'
import { InventoryPanel } from './components/InventoryPanel'
import { ProgressionPanel } from './components/ProgressionPanel'
import { ResourceCard } from './components/ResourceCard'
import { Stepper } from './components/Stepper'
import { SubskillsPanel } from './components/SubskillsPanel'
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
  applyCharacterLimits,
  calculateAttributePointsSpent,
  calculateCharacterBonuses,
  calculateDerivedResources,
  calculateEffectiveAttributes,
  calculateEffectiveSkills,
  calculateLevelFromXp,
  calculateLoadState,
  calculateSkillPointsSpent,
  changeAttribute,
  changeDefenseOther,
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

type SheetTab = 'sheet' | 'operations' | 'progression' | 'notes'

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
  const [activeTab, setActiveTab] = useState<SheetTab>('sheet')
  const derived = calculateDerivedResources(character)
  const bonuses = calculateCharacterBonuses(character)
  const effectiveAttributes = calculateEffectiveAttributes(character)
  const effectiveSkills = calculateEffectiveSkills(character)
  const loadState = calculateLoadState(character)
  const attributePointsSpent = calculateAttributePointsSpent(character.attributes)
  const skillPointsSpent = calculateSkillPointsSpent(character.skills)
  const attributePointsRemaining = derived.maxAttributePoints - attributePointsSpent
  const skillPointsRemaining = derived.maxSkillPoints - skillPointsSpent
  const identityErrors = validateIdentity(character)
  const selectedFunction = FUNCTIONS.find((item) => item.id === character.identity.functionId)
  const selectedTrait = TRAITS.find((item) => item.id === character.identity.traitId)
  const operatorLevel = calculateLevelFromXp(character.progression.xp)
  const stressAtLimit = character.resources.stress >= derived.maxStress
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
          <div className="mission-level-summary">
            <span className="eyebrow">NÍVEL DO OPERADOR</span>
            <strong>Nível {operatorLevel}</strong>
            <small>{character.progression.xp} XP</small>
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
              <span className="status-label">PROTEGIDO</span>
            </div>
            <div className="defense-shield-row">
              <div className="defense-shield" aria-label={`Defesa total ${derived.defense}`}>{derived.defense}</div>
              <div className="defense-breakdown">
                <span><b>{derived.defenseBase}</b><small>Base</small></span>
                <i>+</i>
                <span><b>{derived.defenseEquipment}</b><small>Equip.</small></span>
                <i>+</i>
                <span><b>{derived.defenseOther}</b><small>Outros</small></span>
              </div>
            </div>
            <div className="resource-meter resource-meter--static" aria-hidden="true"><span /></div>
            <div className="defense-other-control">
              <span>Modificador situacional</span>
              <button type="button" onClick={() => commit((current) => changeDefenseOther(current, -1))}>−</button>
              <output>{derived.defenseOther}</output>
              <button type="button" onClick={() => commit((current) => changeDefenseOther(current, 1))}>+</button>
            </div>
            <p className="calculation-note">Proteções são ligadas ou desligadas no Inventário. Apenas uma armadura e um escudo ficam equipados por vez.</p>
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

        <nav className="sheet-tabs" aria-label="Seções da ficha">
          <button type="button" className={activeTab === 'sheet' ? 'active' : ''} aria-pressed={activeTab === 'sheet'} onClick={() => setActiveTab('sheet')}>Ficha e perícias</button>
          <button type="button" className={activeTab === 'operations' ? 'active' : ''} aria-pressed={activeTab === 'operations'} onClick={() => setActiveTab('operations')}>Condições e inventário</button>
          <button type="button" className={activeTab === 'progression' ? 'active' : ''} aria-pressed={activeTab === 'progression'} onClick={() => setActiveTab('progression')}>Progressão · Nível {operatorLevel}</button>
          <button type="button" className={activeTab === 'notes' ? 'active' : ''} aria-pressed={activeTab === 'notes'} onClick={() => setActiveTab('notes')}>Anotações</button>
        </nav>

        <div className="sheet-tab-panel" hidden={activeTab !== 'sheet'}>
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
                  {attributePointsSpent} / {derived.maxAttributePoints}
                </span>
              </div>
              <p className="panel-intro">Distribua até {derived.maxAttributePoints} pontos. O limite aumenta nos níveis 3, 6 e 9; bônus da função não consomem pontos.</p>
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
                {derived.maxSkillPoints} pontos distribuíveis (10 base + Inteligência total). Bônus de função, traço e equipamento aparecem no total e não gastam pontos.
              </p>
              <div className="stepper-list stepper-list--compact">
                {SKILL_KEYS.map((key) => (
                  <Stepper
                    key={key}
                    label={SKILL_LABELS[key]}
                    value={character.skills[key]}
                    bonus={effectiveSkills[key] - character.skills[key]}
                    hint={
                      (loadState.skillPenalties[key] ?? 0) !== 0
                        ? `Total inclui ${loadState.skillPenalties[key]} de ${loadState.label.toLowerCase()}. A desvantagem desaparece ao reduzir a carga.`
                        : bonuses.skills[key] !== 0
                          ? 'Total inclui bônus gratuito de função, traço ou equipamento ativo; ele não consome pontos.'
                        : key === 'willpower'
                          ? 'Soma na Compostura máxima.'
                          : undefined
                    }
                    disableDecrease={character.skills[key] === 0 || changeSkill(character, key, -1) === character}
                    disableIncrease={skillPointsRemaining === 0}
                    onDecrease={() => commit((current) => changeSkill(current, key, -1))}
                    onIncrease={() => commit((current) => changeSkill(current, key, 1))}
                  />
                ))}
              </div>
            </section>
          </div>
          </div>

          <SubskillsPanel character={character} onChange={onChange} />
        </div>

        <div className="sheet-tab-panel" hidden={activeTab !== 'operations'}>
          <div className="operations-grid">
          <section className="panel operations-panel" aria-labelledby="conditions-heading">
            <div className="panel-heading">
              <div>
                <span className="section-index">06</span>
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

            <InventoryPanel character={character} onChange={onChange} />
          </div>
        </div>

        <div className="sheet-tab-panel" hidden={activeTab !== 'progression'}>
          <ProgressionPanel character={character} isMaster={isMaster} onChange={onChange} />
        </div>

        <div className="sheet-tab-panel" hidden={activeTab !== 'notes'}>
          <section className="panel notes-panel" aria-labelledby="notes-heading">
            <div className="panel-heading">
              <div>
                <span className="section-index">09</span>
                <h2 id="notes-heading">Anotações do operador</h2>
              </div>
              <span className="panel-code">PRIVADO</span>
            </div>
            <p className="panel-intro">Use este espaço para pistas, contatos, objetivos e lembretes. O jogador e o mestre podem consultar estas anotações na ficha.</p>
            <label className="field notes-field">
              <span>Registro de campo</span>
              <textarea
                rows={18}
                maxLength={20000}
                value={character.notes}
                placeholder="Escreva livremente. O salvamento aguarda você parar de digitar e não substituirá texto novo por respostas antigas."
                onChange={(event) => commit((current) => ({ ...current, notes: event.currentTarget.value }))}
              />
              <small>{character.notes.length.toLocaleString('pt-BR')} / 20.000 caracteres</small>
            </label>
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
        <span>ORION FIELD SYSTEM // ONLINE BUILD 0.6</span>
        <span>FONTE: MANUAL_RPG_TATICO.PDF</span>
      </footer>
    </div>
  )
}
