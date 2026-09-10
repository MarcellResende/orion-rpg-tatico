import { useState } from 'react'
import type { AssassinState, Character } from '../types'
import { AC_ERAS, AC_MODS, AC_SPECIALIZATIONS } from '../data/assassinsCreed'
import { characterFunction, hasAssassinsCreed } from '../data/characterOptions'
import { availableInventory } from '../data/expansions'
import { assassinLevel, assassinProtection, assassinSchoolChoices, bladeProfile, dossierState, graveWoundThreshold } from '../rules/assassinsCreed'
import { calculateDerivedResources } from '../rules/calculations'
import { Stepper } from './Stepper'

export function AssassinsCreedPanel({ character, onChange }: { character: Character; onChange: (character: Character) => void }) {
  const [penetration, setPenetration] = useState(0)
  const [clue, setClue] = useState('')
  const [scene, setScene] = useState('Cena 1')
  const [category, setCategory] = useState('HUMINT')
  if (!hasAssassinsCreed(character)) return null
  const state = character.assassin
  const protection = assassinProtection(character, penetration)
  const derived = calculateDerivedResources(character)
  const dossier = dossierState(character)
  const schools = assassinSchoolChoices(character)
  const activeGuard = schools.find((school) => school.id === state.guard)
  const level = assassinLevel(character)
  const role = characterFunction(character)
  const specializations = AC_SPECIALIZATIONS[state.functionId.split(':')[1]] ?? []
  const commit = (patch: Partial<AssassinState>) => onChange({ ...character, assassin: { ...state, ...patch }, updatedAt: new Date().toISOString() })
  const counter = (key: 'flow' | 'suspicion' | 'credibility' | 'distance' | 'layers', label: string, max: number, hint: string) => {
    const value = key === 'flow' ? protection.flow : state[key]
    return <Stepper label={label} value={value} hint={hint} disableDecrease={value <= 0} disableIncrease={value >= max} onDecrease={() => commit({ [key]: value - 1 })} onIncrease={() => commit({ [key]: value + 1 })} />
  }
  return <section className="panel ac-panel" aria-labelledby="ac-heading">
    <div className="panel-heading"><div><span className="section-index">AC</span><h2 id="ac-heading">Operações da Irmandade</h2></div><span className="panel-code">v1.5.1</span></div>
    <p className="panel-intro">Registros deste operador. Notoriedade, PI, RI, Doutrinas e Fraturas são coletivos: o Mestre mantém esses valores no painel Irmandade do Esquadrão.</p>
    <a className="secondary-button" href="/Assassins_Creed_v1.5.1.pdf" target="_blank" rel="noreferrer">Abrir PDF da expansão</a>
    <div className="form-grid">
      <label className="field"><span>Pacote de Era</span><select value={state.era} onChange={(event) => commit({ era: Number(event.currentTarget.value) })}>{AC_ERAS.map((era, index) => <option key={era} value={index + 1}>{index + 1} · {era}</option>)}</select></label>
      <label className="field"><span>Tecnologia disponível na era</span><select value={state.modernTechnology ? 'modern' : 'historical'} onChange={(event) => commit({ modernTechnology: event.currentTarget.value === 'modern' })}><option value="historical">Engenho, Mecanismos e Ofícios</option><option value="modern">Incluir Mecânica, Eletrônica e Reparo</option></select><small>Ative quando a era e o Mestre permitirem. Os pontos existentes são preservados.</small></label>
      {level >= 5 && <label className="field"><span>Especialização · {role?.name ?? 'Escolha uma função'}</span><select value={state.specialization} onChange={(event) => commit({ specialization: event.currentTarget.value })}><option value="">Selecione</option>{specializations.map((name) => <option key={name}>{name}</option>)}</select><small>Regras completas nas páginas 4–5 da expansão.</small></label>}
    </div>
    <details open><summary>Furtividade, Fluxo e perseguição</summary><div className="reference-content">
      {counter('suspicion', 'Suspeita', 4, '0 Natural · 1 Notado · 2 Observado (-1 Disfarce) · 3 Investigado · 4 Comprometido')}
      {counter('credibility', 'Credibilidade', 3, '0 Comprometida · 1 Frágil · 2 Adequada · 3 Muito convincente')}
      {counter('flow', 'Fluxo', protection.flowMaximum, `Máximo ${protection.flowMaximum}, considerando função e equipamentos.`)}
      <p>Deslocamento normal: <b>{derived.movement} m</b>. Em Parkour/perseguição: <b>{derived.movement + protection.parkourBonus} m</b>.</p>
      <button type="button" className="secondary-button" onClick={() => commit({ flow: 0 })}>Zerar Fluxo</button>
      <button type="button" className="secondary-button" disabled={protection.flow < 3} onClick={() => commit({ flow: 0 })}>Gastar 3 Fluxos após vencer a disputa</button>
      {level >= 5 && state.specialization === 'Acrobata Urbano' && <button type="button" className="secondary-button" disabled={protection.flow < 3} onClick={() => commit({ flow: 1 })}>Acrobata: gastar e manter 1 · 1/perseguição</button>}
      {counter('distance', 'Distância da perseguição', 4, '0 Contato · 1 Próximo · 2 Separado · 3 Distante · 4 Escapou')}
      <p>Após gastar Fluxo, ajuste a Distância conforme a disputa: máximo 2 níveis por rodada somando todas as fontes. Falha de Parkour, parada, dano relevante, Imobilizado ou combate estacionário zeram Fluxo, salvo exceção.</p>
      {state.credibility === 0 && <p role="status">Disfarce comprometido: não concede acesso nem reduz Suspeita; nova interação relevante em Zona Controlada+ sofre -2; falha leva Suspeita a 4.</p>}
    </div></details>
    <details open><summary>Proteção, RA e combate</summary><div className="reference-content">
      <label className="field"><span>Penetrante do ataque recebido</span><select value={penetration} onChange={(event) => setPenetration(Number(event.currentTarget.value))}>{[0, 1, 2, 3].map((value) => <option key={value}>{value}</option>)}</select></label>
      <p>RA: <b>{protection.ra}</b> (teto 8) → RA efetiva: <b>{protection.effectiveRa}</b>. Ferimento Grave com dano ≥ <b>{graveWoundThreshold(derived.maxHp, protection.effectiveRa).toLocaleString('pt-BR')}</b> em um ataque. A RA não reduz o dano nos PV.</p>
      <label className="field"><span>Postura</span><select value={state.stance} onChange={(event) => commit({ stance: event.currentTarget.value as AssassinState['stance'], guard: '' })}><option value="balanced">Equilibrada</option><option value="offensive">Ofensiva · +2 Ataque / -2 Defesa</option><option value="defensive">Defensiva · -2 Ataque / +2 Defesa</option></select></label>
      <p>Ajuste de Ataque da Postura: {protection.stanceAttack > 0 ? '+' : ''}{protection.stanceAttack}. Defesa da Postura já incluída na ficha. Troca custa Meia Ação.</p>
      <p>Escudos concedem Defesa apenas na direção protegida. Bloquear gasta Reação e concede +2 Defesa contra aquele ataque (regra final, pág. 25). Guardas substituem Posturas; seus efeitos condicionais são aplicados conforme a situação descrita.</p>
    </div></details>
    <details><summary>Escolas de combate e Maestria</summary><div className="reference-content">
      <p>Escolha Treinamento e Técnicas nos espaços de Habilidades Gerais. Máximo 2 escolas. Maestria automática no nível 9+ somente na Escola Principal com Treinamento + Técnicas I e II.</p>
      <label className="field"><span>Escola Principal</span><select value={state.primarySchool} onChange={(event) => commit({ primarySchool: event.currentTarget.value })}><option value="">Selecione</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label>
      <label className="field"><span>Guarda ativa</span><select value={activeGuard?.id ?? ''} onChange={(event) => commit({ guard: event.currentTarget.value, stance: 'balanced' })}><option value="">Postura genérica</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label>
      {schools.map((school) => <article className="expansion-card" key={school.id}><div><strong>{school.name}</strong><p>Guarda: {school.guard}</p><p>Fundamental: {school.fundamental}</p>{school.technique1Known && <p>Técnica I: {school.technique1}</p>}{school.technique2Known && <p>Técnica II: {school.technique2}</p>}{school.mastered && <p><b>Maestria desbloqueada:</b> {school.mastery}</p>}</div></article>)}
    </div></details>
    <details><summary>Lâminas Ocultas · customização por braço</summary><div className="reference-content">
      <p>Instale somente exemplares adquiridos pela Célula, entre missões, em Oficina ou com Artífice/ferramentas. Custos abaixo são por aquisição, não por troca. Cada braço precisa da sua Lâmina equipada no inventário. Não há compra ou desconto automático de RI.</p>
      {(['left', 'right'] as const).map((arm) => {
        const selected = AC_MODS.filter((mod) => state.bladeMods[arm].includes(mod.id))
        const spaces = selected.reduce((sum, mod) => sum + mod.slots, 0)
        const equipped = availableInventory(character).some((item) => item.active && item.slot === `${arm}Blade`)
        const profile = bladeProfile(character, arm)
        return <section key={arm}><h3>Braço {arm === 'left' ? 'esquerdo' : 'direito'} · {spaces}/2 espaços · {equipped ? 'equipada' : 'guardada/ausente'}</h3>
          <p><b>{profile.damage}</b> · {profile.weight.toLocaleString('pt-BR')} kg · {profile.assassination ? 'Permite Assassinato quando os critérios forem cumpridos' : 'Sem Assassinato'} · {profile.parry ? 'Pode Aparar, respeitando o estado da Lâmina' : 'Não pode Aparar'}. O peso das modificações equipadas já entra na carga.</p>
          {AC_MODS.map((mod) => {
            const checked = state.bladeMods[arm].includes(mod.id)
            const incompatible = (mod.id === 'light' && selected.some((entry) => ['counterweight', 'silent'].includes(entry.id))) || (['counterweight', 'silent'].includes(mod.id) && selected.some((entry) => entry.id === 'light'))
            return <label className="ac-mod" key={mod.id}><input type="checkbox" checked={checked} disabled={!checked && (spaces + mod.slots > 2 || incompatible || state.era < mod.era)} onChange={() => commit({ bladeMods: { ...state.bladeMods, [arm]: checked ? state.bladeMods[arm].filter((id) => id !== mod.id) : [...state.bladeMods[arm], mod.id] } })} /><span><b>{mod.name}</b> · {mod.slots} espaço(s) · {mod.cost} RI · {AC_ERAS[mod.era - 1]}<small>{mod.effect}</small></span></label>
          })}
        </section>
      })}
      <p>Protótipos antecipados exigem autorização narrativa e +3 RI; consulte o Mestre. A seleção normal respeita a era mínima. Penalidades em revista física: máximo -3 Disfarce.</p>
    </div></details>
    <details><summary>Alvo, Dossiê e oportunidades</summary><div className="reference-content">
      <label className="field"><span>Alvo do Dossiê</span><input maxLength={200} value={state.target} onChange={(event) => commit({ target: event.currentTarget.value })} /></label>
      <p><b>{dossier.label}</b> · {dossier.points} PD · {dossier.categories} categorias. Profundo exige 4 PD/2 categorias; Completo, 6 PD/3 categorias. Máximo 2 PD por cena.</p>
      <div className="form-grid"><label className="field"><span>Cena de investigação</span><input value={scene} maxLength={100} onChange={(event) => setScene(event.currentTarget.value)} /></label><label className="field"><span>Categoria da informação</span><select value={category} onChange={(event) => setCategory(event.currentTarget.value)}>{['HUMINT', 'Observação', 'Documentos', 'Infraestrutura'].map((name) => <option key={name}>{name}</option>)}</select></label></div>
      <label className="field"><span>Nova informação</span><input value={clue} maxLength={1000} onChange={(event) => setClue(event.currentTarget.value)} /></label>
      <button type="button" className="secondary-button" disabled={!clue.trim() || !scene.trim() || state.clues.length >= 100} onClick={() => { commit({ clues: [...state.clues, { id: crypto.randomUUID(), text: clue.trim(), scene: scene.trim(), category, confirmed: false }] }); setClue('') }}>Registrar informação não confirmada</button>
      {state.clues.map((entry) => <article className="expansion-card" key={entry.id}><div><strong>{entry.text}</strong><p>{entry.category} · {entry.scene}</p><label><input type="checkbox" checked={entry.confirmed} onChange={(event) => commit({ clues: state.clues.map((item) => item.id === entry.id ? { ...item, confirmed: event.currentTarget.checked } : item) })} /> Confirmada por prova, outra categoria ou sucesso excelente</label></div><button type="button" className="danger-text-button" onClick={() => commit({ clues: state.clues.filter((item) => item.id !== entry.id) })}>Remover</button></article>)}
      {counter('layers', 'Camadas de Proteção restantes', 99, 'Referência: alvo secundário 1; importante 2; central de arco 3. O Mestre define as camadas reais.')}
      <label className="field"><span>Oportunidades, rotina, segurança e rota de fuga</span><textarea rows={5} maxLength={10000} value={state.opportunities} onChange={(event) => commit({ opportunities: event.currentTarget.value })} /></label>
      <p>Sincronização regional não gera PD nem confirma informações automaticamente. Assassinato garantido depende de acesso, alcance, alvo não identificado e nenhuma Camada impedindo a abordagem.</p>
    </div></details>
  </section>
}
