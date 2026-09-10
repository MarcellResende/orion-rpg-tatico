import { activeExpansions, EXPANSIONS, setExpansionEnabled } from '../data/expansions'
import type { Character } from '../types'

export function ExpansionsPanel({ character, onChange }: { character: Character; onChange: (character: Character) => void }) {
  const active = activeExpansions(character)
  return <section className="panel" aria-labelledby="expansions-heading">
    <div className="panel-heading"><div><span className="section-index">EXP</span><h2 id="expansions-heading">Expansões</h2></div><span className="point-counter">{active.length} {active.length === 1 ? 'ATIVA' : 'ATIVAS'}</span></div>
    <p className="panel-intro">Ative conteúdos adicionais para este operador. Atributos aparecem na ficha, equipamentos no arsenal e regras no manual. A seleção é salva com a ficha.</p>
    <article className="expansion-card"><div><strong>Manual do Operador v1.4</strong><p>Livro base · sempre ativo</p></div><span className="panel-code">BASE</span></article>
    {EXPANSIONS.length === 0 && <div className="empty-inline"><strong>Nenhuma expansão cadastrada ainda.</strong><p>Ao enviar um próximo PDF nesta conversa, indique “Este PDF é uma expansão” e informe o nome. Depois de integrado ao site, ele aparecerá aqui para ativação.</p></div>}
    {EXPANSIONS.map((expansion) => {
      const enabled = active.some((entry) => entry.id === expansion.id)
      return <article className={`expansion-card ${enabled ? 'expansion-card--active' : ''}`} key={expansion.id}>
        <div><strong>{expansion.name}</strong><p>{expansion.description}</p><small>v{expansion.version} · {expansion.source}</small>
          <p>{expansion.attributes.length} atributos · {expansion.rules.length} regras · {expansion.equipment.length} equipamentos</p>
          {expansion.attributes.length > 0 && <small>Atributos: {expansion.attributes.map((entry) => entry.name).join(', ')} · {expansion.attributePoints} pontos próprios</small>}
          {expansion.id === 'assassins-creed' && <p>Acrescenta Mobilidade e funções históricas à ficha. Controles em “Condições e inventário”. Proteções do livro base ficam guardadas enquanto esta expansão estiver ativa; equipe as proteções com RA pelo arsenal.</p>}
        </div>
        <label className="equipment-toggle"><input type="checkbox" aria-label={`Ativar ${expansion.name}`} checked={enabled} onChange={(event) => onChange({ ...setExpansionEnabled(character, expansion.id, event.currentTarget.checked), updatedAt: new Date().toISOString() })} /><span>{enabled ? 'Ativada' : 'Ativar'}</span></label>
      </article>
    })}
    <p className="calculation-note">Desativar oculta o conteúdo e remove seus efeitos e peso. Os valores e itens ficam guardados para reativação. Equipamentos precisam ser adicionados pelo arsenal. Se o espaço já estiver ocupado ao reativar, o item retorna guardado.</p>
  </section>
}
