import { createEmptyCharacter } from './character'
import { ResourceCard } from './components/ResourceCard'
import { Stepper } from './components/Stepper'
import {
  ATTRIBUTE_EFFECTS,
  ATTRIBUTE_LABELS,
  FUNCTIONS,
  SKILL_LABELS,
  TRAITS,
} from './data/manual'
import {
  ATTRIBUTE_POINT_LIMIT,
  calculateAttributePointsSpent,
  calculateDerivedResources,
  calculateSkillPointsSpent,
  changeAttribute,
  changeResource,
  changeSkill,
  setResource,
  validateIdentity,
} from './rules/calculations'
import {
  ATTRIBUTE_KEYS,
  SKILL_KEYS,
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
  onChange: (character: Character) => void
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

export function CharacterSheet({
  character,
  campaignName,
  isOwnCharacter,
  isMaster,
  saveState,
  onChange,
  onShowCampaigns,
  onShowSquad,
  onSignOut,
}: CharacterSheetProps) {
  const derived = calculateDerivedResources(character)
  const attributePointsSpent = calculateAttributePointsSpent(character.attributes)
  const skillPointsSpent = calculateSkillPointsSpent(character.skills)
  const attributePointsRemaining = ATTRIBUTE_POINT_LIMIT - attributePointsSpent
  const skillPointsRemaining = derived.maxSkillPoints - skillPointsSpent
  const identityErrors = validateIdentity(character)
  const selectedFunction = FUNCTIONS.find((item) => item.id === character.identity.functionId)
  const selectedTrait = TRAITS.find((item) => item.id === character.identity.traitId)
  const stressAtLimit = character.resources.stress >= derived.maxStress

  const commit = (update: (current: Character) => Character) => {
    onChange({
      ...update(character),
      updatedAt: new Date().toISOString(),
    })
  }

  const updateIdentity = <Key extends keyof Identity,>(key: Key, value: Identity[Key]) => {
    commit((current) => ({
      ...current,
      identity: { ...current.identity, [key]: value },
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
            explanation={`20 base + ${character.attributes.constitution} Constituição × 10`}
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
            explanation={`10 base + ${character.attributes.dexterity} Destreza × 5`}
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
            explanation={`5 base + ${character.skills.willpower} Vontade + ${character.attributes.intelligence} Inteligência`}
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
              <p className="panel-intro">Distribua até seis pontos. Bônus de função não são aplicados automaticamente nesta versão.</p>
              <div className="stepper-list">
                {ATTRIBUTE_KEYS.map((key) => {
                  const intelligenceDecreaseBlocked =
                    key === 'intelligence' &&
                    skillPointsSpent > 10 + character.attributes.intelligence - 1
                  return (
                    <Stepper
                      key={key}
                      label={ATTRIBUTE_LABELS[key]}
                      value={character.attributes[key]}
                      hint={ATTRIBUTE_EFFECTS[key]}
                      disableDecrease={character.attributes[key] === 0 || intelligenceDecreaseBlocked}
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
                    <small>Bônus exibido somente para consulta; aplicação manual nesta versão.</small>
                  </div>
                )}
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
                10 pontos base + {character.attributes.intelligence} por Inteligência. Sub-perícias ficam para a próxima etapa.
              </p>
              <div className="stepper-list stepper-list--compact">
                {SKILL_KEYS.map((key) => (
                  <Stepper
                    key={key}
                    label={SKILL_LABELS[key]}
                    value={character.skills[key]}
                    hint={key === 'willpower' ? 'Soma na Compostura máxima.' : undefined}
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

        <aside className="scope-note">
          <span className="scope-note__marker" aria-hidden="true">i</span>
          <div>
            <strong>SINCRONIZAÇÃO ONLINE ATIVA</strong>
            <p>A ficha é salva no Supabase. O mestre pode acompanhar o esquadrão em tempo real; regras ainda não automatizadas continuam sob decisão da mesa.</p>
          </div>
        </aside>
      </main>

      <footer>
        <span>ORION FIELD SYSTEM // ONLINE BUILD 0.2</span>
        <span>FONTE: MANUAL_RPG_TATICO.PDF</span>
      </footer>
    </div>
  )
}
