import { useState } from 'react'
import type { CampaignProgressionState } from '../onlineTypes'
import { calculateSquadDoctrineSlots, calculateSquadLevel } from '../data/campaignProgression'

export const EMPTY_BROTHERHOOD = { prestige: 0, resources: 0, notoriety: 0, fractures: 0, doctrines: [] as string[], elite: '', projects: [] as string[], suspendedDoctrine: '' }
const doctrines = [
  ['Rede de Olhos', '1/missão, confirme uma informação; respeite 2 PD/cena.'],
  ['Rotas Conhecidas', '+1 Fluxo no início da primeira perseguição da missão.'],
  ['Entrada Coordenada', 'Dois Assassinos infiltrando-se juntos: +1 no primeiro teste de Furtividade ou Disfarce.'],
  ['Retirada Preparada', '+1 Distância na primeira perseguição após o objetivo. Com oportunidade Fuga (Distância 2), use +2 no primeiro teste em vez de acumular Distância.'],
  ['Arquivos Cruzados', '1/missão, informações de duas categorias criam uma Conexão; +2 para segui-la. Não confirma informação nem gera PD.'],
]
const projects = [
  ['Refúgio', 15, 'Descanso Longo seguro na região.'], ['Enfermaria', 20, '+2 Medicina em tratamentos na base.'], ['Oficina', 20, '+2 Tecnologia na preparação/manutenção; instala customizações.'], ['Arquivo', 25, 'Investigações locais começam com 1 informação não confirmada de Documentos ou Infraestrutura.'], ['Rede de Informantes', 30, '1/missão, 1 informação não confirmada de HUMINT.'], ['Rede de Refúgios', 35, 'Abrigo, rotas e Retirada Preparada 1/missão nas regiões cobertas, sem acumular.'],
] as const

export function BrotherhoodPanel({ progression, onChange }: { progression: CampaignProgressionState; onChange: (state: CampaignProgressionState) => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const state = progression.brotherhood ?? EMPTY_BROTHERHOOD
  const level = calculateSquadLevel(state.prestige)
  const slots = calculateSquadDoctrineSlots(level)
  const commit = async (changes: Partial<typeof state>) => {
    if (busy) return
    setBusy(true); setError('')
    try { await onChange({ ...progression, brotherhood: { ...state, ...changes } }) } catch { setError('Não foi possível salvar a Irmandade. Tente novamente.') } finally { setBusy(false) }
  }
  return <section className="panel ac-panel" aria-labelledby="brotherhood-heading"><div className="panel-heading"><h2 id="brotherhood-heading">Irmandade · Célula nível {level}</h2><span className="panel-code">CAMPANHA</span></div>
    <p className="panel-intro">Registro compartilhado administrado pelo Mestre. Notoriedade substitui Heat nesta campanha. Os valores do sistema base permanecem guardados.</p>
    <fieldset disabled={busy} style={{ border: 0 }}>
      <div className="form-grid">{([['prestige', 'Prestígio da Irmandade (PI)', 999], ['resources', 'Recursos da Irmandade (RI)', 9999], ['notoriety', 'Notoriedade', 5], ['fractures', 'Fraturas do Credo', 3]] as const).map(([key, label, max]) => <label className="field" key={key}><span>{label}</span><input type="number" min={0} max={max} value={state[key]} onChange={(event) => { const value = event.currentTarget.valueAsNumber; if (Number.isFinite(value)) void commit({ [key]: Math.max(0, Math.min(max, Math.floor(value))) }) }} /></label>)}</div>
      <p>Por missão: PI +1 Primário e +1 operação discreta (máx. 2). RI +2 missão, +2 Primário, +1 Secundário, +1 discreta e +1 por ativo preservado (máx. 2); limite recomendado 8. Notoriedade normalmente sobe no máximo 1.</p>
      {Array.from({ length: slots }, (_, index) => <label className="field" key={index}><span>Doutrina {index + 1}</span><select value={state.doctrines[index] ?? ''} onChange={(event) => { const next = [...state.doctrines]; next[index] = event.currentTarget.value; void commit({ doctrines: next }) }}><option value="">Selecione</option>{doctrines.map(([name]) => <option key={name} disabled={state.doctrines.some((value, slot) => value === name && slot !== index)}>{name}</option>)}</select><small>{doctrines.find(([name]) => name === state.doctrines[index])?.[1]}</small></label>)}
      {level >= 5 && <label className="field"><span>Doutrina de Elite</span><select value={state.elite} onChange={(event) => void commit({ elite: event.currentTarget.value })}><option value="">Selecione</option><option>Fantasmas</option><option>Irmandade Perfeita</option></select><small>Fantasmas: 1/missão, sem identificação clara e sem Alerta Vermelho prolongado, Notoriedade não aumenta. Irmandade Perfeita: 1/operação, aliado gasta Reação para +3 Furtividade, Mobilidade ou Disfarce.</small></label>}
      {state.fractures >= 3 && <label className="field"><span>Doutrina suspensa até resolver o conflito</span><select value={state.suspendedDoctrine} onChange={(event) => void commit({ suspendedDoctrine: event.currentTarget.value })}><option value="">Escolha a doutrina indisponível</option>{[...state.doctrines.slice(0, slots), ...(level >= 5 ? [state.elite] : [])].filter(Boolean).map((name) => <option key={name}>{name}</option>)}</select></label>}
      <h3>Base da Irmandade</h3>{projects.map(([name, cost, effect]) => <article className="expansion-card" key={name}><div><strong>{name} · {cost} RI</strong><p>{effect}</p></div><button type="button" className="secondary-button" disabled={state.projects.includes(name) || state.resources < cost} onClick={() => void commit({ resources: state.resources - cost, projects: [...state.projects, name] })}>{state.projects.includes(name) ? 'Adquirido' : 'Adquirir'}</button></article>)}
    </fieldset>{error && <p role="alert">{error}</p>}
  </section>
}
