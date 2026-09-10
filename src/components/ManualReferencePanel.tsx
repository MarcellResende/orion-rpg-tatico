import { useState } from 'react'
import pages from '../data/manualV14.json'
import { activeExpansions } from '../data/expansions'
import type { Character } from '../types'

export function ManualReferencePanel({ character }: { character: Character }) {
  const [query, setQuery] = useState('')
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const search = normalize(query.trim())
  const visiblePages = pages.filter((page) => normalize(page.text).includes(search))
  const rules = activeExpansions(character).flatMap((expansion) => expansion.rules.map((rule) => ({ ...rule, expansion: expansion.name, expansionId: expansion.id })))
    .filter((rule) => normalize(`${rule.name} ${rule.text} ${rule.expansion}`).includes(search))
  return <section className="panel manual-reference" aria-labelledby="manual-reference-heading">
    <div className="panel-heading"><div><span className="section-index">REF</span><h2 id="manual-reference-heading">Manual do Operador v1.4</h2></div><span className="panel-code">42 PÁGINAS</span></div>
    <p className="panel-intro">Consulte o texto do livro base e as regras das expansões ativas. Para ver tabelas com a diagramação original, abra o PDF.</p>
    <a className="secondary-button" href="/Manual_Operador_v1.4.pdf" target="_blank" rel="noreferrer">Abrir manual completo</a>
    <label className="field"><span>Buscar regra</span><input type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Atributos, disparos, equipamentos…" /></label>
    <div className="reference-grid">
      {rules.map((rule) => <details key={`${search}:${rule.expansion}:${rule.id}`} open={Boolean(search)}><summary>{rule.expansion} · pág. {rule.sourcePage} · {rule.name}</summary><div className="reference-content"><p style={{ whiteSpace: 'pre-line' }}>{rule.text}</p><small>Pág. {rule.sourcePage}</small>{rule.expansionId === 'assassins-creed' && <><p>Armaduras e Bloquear: use a regra final das páginas 24–26, que substitui os resumos anteriores.</p><a href={`/Assassins_Creed_v1.5.1.pdf#page=${rule.sourcePage}`} target="_blank" rel="noreferrer">Ver página original da expansão</a></>}</div></details>)}
      {visiblePages.map((page) => <details key={`${search}:${page.page}`} open={Boolean(search)}><summary>Pág. {page.page} · {page.title}</summary><div className="reference-content"><p style={{ whiteSpace: 'pre-line' }}>{page.text}</p><a href={`/Manual_Operador_v1.4.pdf#page=${page.page}`} target="_blank" rel="noreferrer">Ver página no PDF</a></div></details>)}
    </div>
    {visiblePages.length === 0 && rules.length === 0 && <p role="status">Nenhuma regra encontrada.</p>}
  </section>
}
