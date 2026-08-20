import {
  BRIEFING_SUPPORTS,
  ELITE_DOCTRINES,
  HEADQUARTERS_PROJECTS,
  SQUAD_DOCTRINES,
  SQUAD_LEVELS,
  calculateSquadDoctrineSlots,
  calculateSquadLevel,
} from '../data/campaignProgression'
import type { CampaignProgressionState } from '../onlineTypes'

interface CampaignProgressionPanelProps {
  progression: CampaignProgressionState
  onChange: (progression: CampaignProgressionState) => Promise<void>
}

export function CampaignProgressionPanel({ progression, onChange }: CampaignProgressionPanelProps) {
  const level = calculateSquadLevel(progression.operationalPrestige)
  const definition = SQUAD_LEVELS[level - 1]
  const next = SQUAD_LEVELS[level]
  const doctrineSlots = calculateSquadDoctrineSlots(level)

  const commit = (changes: Partial<CampaignProgressionState>) => onChange({ ...progression, ...changes })
  const adjust = (key: 'operationalPrestige' | 'headquartersPoints' | 'heat', delta: number, maximum: number) =>
    commit({ [key]: Math.min(maximum, Math.max(0, progression[key] + delta)) })

  const updateDoctrine = (index: number, doctrineId: string) => {
    const doctrines = Array.from({ length: doctrineSlots }, (_, slot) => progression.squadDoctrines[slot] ?? '')
    doctrines[index] = doctrineId
    return commit({ squadDoctrines: doctrines })
  }

  const buyProject = (projectId: string, cost: number) => {
    if (progression.headquartersProjects.includes(projectId) || progression.headquartersPoints < cost) return
    return commit({
      headquartersPoints: progression.headquartersPoints - cost,
      headquartersProjects: [...progression.headquartersProjects, projectId],
    })
  }

  const buySupport = (supportId: string, cost: number) => {
    if (progression.headquartersPoints < cost) return
    return commit({
      headquartersPoints: progression.headquartersPoints - cost,
      missionSupports: [...progression.missionSupports, supportId],
    })
  }

  return (
    <section className="campaign-progression-panel" aria-labelledby="campaign-progression-heading">
      <div className="mission-xp-heading">
        <div><span className="section-index">QG</span><div><span className="eyebrow">TRÊS PROGRESSÕES</span><h2 id="campaign-progression-heading">Esquadrão e Quartel-General</h2></div></div>
        <strong>Nível {level} · {definition.classification}</strong>
      </div>
      <p>PO evolui o Esquadrão; PQG compra suportes e infraestrutura permanente. São recursos separados do XP individual.</p>

      <div className="campaign-progression-summary">
        <article>
          <span>PRESTÍGIO OPERACIONAL</span>
          <strong>{progression.operationalPrestige} PO</strong>
          <small>{next ? `Próximo nível: ${next.prestige} PO` : 'Nível máximo do Esquadrão'}</small>
          <div><button type="button" onClick={() => void adjust('operationalPrestige', -1, 999)}>−1</button><button type="button" onClick={() => void adjust('operationalPrestige', 1, 999)}>+1</button><button type="button" onClick={() => void adjust('operationalPrestige', 2, 999)}>+2 missão</button></div>
        </article>
        <article>
          <span>PONTOS DE QG</span>
          <strong>{progression.headquartersPoints} PQG</strong>
          <small>3 por sessão; +10 Primário; +5 Secundário; +1 por Inteligência; +5 Fantasma.</small>
          <div><button type="button" onClick={() => void adjust('headquartersPoints', -1, 9999)}>−1</button><button type="button" onClick={() => void adjust('headquartersPoints', 1, 9999)}>+1</button><button type="button" onClick={() => void adjust('headquartersPoints', 5, 9999)}>+5</button><button type="button" onClick={() => void adjust('headquartersPoints', 10, 9999)}>+10</button></div>
        </article>
        <article>
          <span>ESTADO DA MISSÃO</span>
          <label><small>Alerta</small><select value={progression.alert} onChange={(event) => void commit({ alert: event.currentTarget.value as CampaignProgressionState['alert'] })}><option value="green">Verde · Desprevenido</option><option value="yellow">Amarelo · Suspeito</option><option value="red">Vermelho · Combate/Caçada</option></select></label>
          <div className="heat-control"><small>Heat</small><button type="button" onClick={() => void adjust('heat', -1, 5)}>−</button><b>{progression.heat} / 5</b><button type="button" onClick={() => void adjust('heat', 1, 5)}>+</button></div>
        </article>
      </div>

      <div className="campaign-progression-grid">
        <section>
          <h3>Doutrinas do Esquadrão</h3>
          <p>{definition.reward}</p>
          {doctrineSlots === 0 ? <div className="empty-inline">A primeira Doutrina é liberada no Nível 2 do Esquadrão, com 5 PO.</div> : Array.from({ length: doctrineSlots }, (_, index) => {
            const used = new Set(progression.squadDoctrines.filter((_, slot) => slot !== index))
            const selected = SQUAD_DOCTRINES.find((item) => item.id === progression.squadDoctrines[index])
            return <label className="field doctrine-field" key={index}><span>Doutrina {index + 1}</span><select value={selected?.id ?? ''} onChange={(event) => void updateDoctrine(index, event.currentTarget.value)}><option value="">Escolha</option>{SQUAD_DOCTRINES.map((item) => <option key={item.id} value={item.id} disabled={used.has(item.id)}>{item.name}</option>)}</select>{selected && <small>{selected.effect}</small>}</label>
          })}
          {level >= 5 && <label className="field doctrine-field"><span>Doutrina de Elite</span><select value={progression.eliteDoctrine} onChange={(event) => void commit({ eliteDoctrine: event.currentTarget.value })}><option value="">Escolha</option>{ELITE_DOCTRINES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><small>{ELITE_DOCTRINES.find((item) => item.id === progression.eliteDoctrine)?.effect}</small></label>}
        </section>

        <section>
          <h3>Projetos permanentes do QG</h3>
          <div className="campaign-shop-list">
            {HEADQUARTERS_PROJECTS.map((project) => {
              const owned = progression.headquartersProjects.includes(project.id)
              return <article key={project.id}><div><strong>{project.name}</strong><p>{project.effect}</p></div><button type="button" disabled={owned || progression.headquartersPoints < (project.cost ?? 0)} onClick={() => void buyProject(project.id, project.cost ?? 0)}>{owned ? 'ADQUIRIDO' : `${project.cost} PQG`}</button></article>
            })}
          </div>
        </section>

        <section className="briefing-supports-section">
          <div className="section-title-with-action"><div><h3>Suportes do próximo briefing</h3><p>Suportes são consumidos na missão; projetos e armas permanecem.</p></div>{progression.missionSupports.length > 0 && <button type="button" className="secondary-button" onClick={() => void commit({ missionSupports: [] })}>Encerrar missão / limpar</button>}</div>
          <div className="campaign-shop-list campaign-shop-list--supports">
            {BRIEFING_SUPPORTS.map((support) => <article key={support.id}><div><strong>{support.name}</strong><p>{support.effect}</p></div><button type="button" disabled={progression.headquartersPoints < (support.cost ?? 0)} onClick={() => void buySupport(support.id, support.cost ?? 0)}>{support.cost} PQG</button></article>)}
          </div>
          {progression.missionSupports.length > 0 && <div className="active-supports"><strong>SUPORTES ATIVOS</strong>{progression.missionSupports.map((id, index) => <span key={`${id}-${index}`}>{BRIEFING_SUPPORTS.find((item) => item.id === id)?.name ?? id}</span>)}</div>}
        </section>
      </div>
    </section>
  )
}
