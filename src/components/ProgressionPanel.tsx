import { LEVEL_TABLE } from '../data/progression'
import {
  calculateLevelFromXp,
  calculateProgressionRewards,
  changeExperience,
} from '../rules/calculations'
import type { Character } from '../types'

interface ProgressionPanelProps {
  character: Character
  isMaster: boolean
  onChange: (character: Character) => void
}

export function ProgressionPanel({ character, isMaster, onChange }: ProgressionPanelProps) {
  const level = calculateLevelFromXp(character.progression.xp)
  const rewards = calculateProgressionRewards(level)
  const currentLevel = LEVEL_TABLE[level - 1]
  const nextLevel = LEVEL_TABLE[level]
  const progress = nextLevel
    ? ((character.progression.xp - currentLevel.totalXp) / (nextLevel.totalXp - currentLevel.totalXp)) * 100
    : 100

  const commit = (next: Character) => onChange({
    ...next,
    updatedAt: new Date().toISOString(),
  })

  return (
    <section className="panel progression-panel" aria-labelledby="progression-heading">
      <div className="panel-heading">
        <div>
          <span className="section-index">08</span>
          <h2 id="progression-heading">Experiência do Operador</h2>
        </div>
        <span className="panel-code">PROGRESSÃO</span>
      </div>

      <div className="xp-console">
        <div className="xp-level"><span>NÍVEL</span><strong>{level}</strong></div>
        <div className="xp-progress">
          <div><strong>{character.progression.xp} XP</strong><span>{nextLevel ? `Próximo nível: ${nextLevel.totalXp} XP` : 'Nível máximo alcançado'}</span></div>
          <div className="xp-meter" role="progressbar" aria-label={`Progresso do nível ${level}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }} /></div>
          <small>{currentLevel.reward}</small>
        </div>
        {isMaster && (
          <div className="xp-adjust" aria-label="Ajuste manual de XP">
            <button type="button" disabled={character.progression.xp === 0} onClick={() => commit(changeExperience(character, -1))}>−1 XP</button>
            <button type="button" onClick={() => commit(changeExperience(character, 1))}>+1 XP</button>
          </div>
        )}
      </div>

      <p className="panel-intro">
        O mestre concede XP no painel do esquadrão ao encerrar a missão. Pontos extras de perícia e atributo são liberados automaticamente; escolhas de habilidades ficam na aba “Habilidades”.
      </p>

      <div className="progression-rewards-summary">
        <span><b>+{rewards.bonusSkillPoints}</b> pontos de Perícia por nível</span>
        <span><b>+{rewards.bonusAttributePoints}</b> pontos de Atributo por nível</span>
        <span><b>{rewards.generalAbilitySlots}</b> Habilidades Gerais</span>
      </div>

      <div className="level-table" role="table" aria-label="Tabela de níveis do operador">
        {LEVEL_TABLE.map((definition) => (
          <div className={`level-row ${definition.level === level ? 'level-row--current' : ''} ${definition.level <= level ? 'level-row--unlocked' : ''}`} role="row" key={definition.level}>
            <b role="cell">NÍVEL {definition.level}</b>
            <span role="cell">{definition.totalXp} XP</span>
            <p role="cell">{definition.reward}</p>
          </div>
        ))}
      </div>

      {character.progression.awards.length > 0 && (
        <div className="xp-history">
          <strong>ÚLTIMOS REGISTROS DE XP</strong>
          {character.progression.awards.slice(0, 8).map((award) => (
            <div key={award.id}><b>{award.amount > 0 ? '+' : ''}{award.amount} XP</b><span>{award.reason}</span><small>{new Date(award.createdAt).toLocaleDateString('pt-BR')}</small></div>
          ))}
        </div>
      )}
    </section>
  )
}
