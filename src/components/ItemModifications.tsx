import { useState } from 'react'
import type { Character, InventoryItem } from '../types'
import { AC_ERAS, AC_MODS } from '../data/assassinsCreed'
import { hasAssassinsCreed } from '../data/characterOptions'
import { bladeModifiable, firearmModifiable, firearmOptions, installedFirearmMods, itemBladeMods, modificationGroup } from '../data/itemModifications'
import { calculateInventoryWeight, calculateLoadState } from '../rules/calculations'

export function ItemModifications({ character, item, onChange }: { character: Character; item: InventoryItem; onChange: (character: Character) => void }) {
  const [error, setError] = useState('')
  const blade = hasAssassinsCreed(character) && bladeModifiable(item)
  if (!blade && !firearmModifiable(item)) return null
  const selected = blade ? itemBladeMods(character, item) : installedFirearmMods(item)
  const ids = selected.map((mod) => mod.id)
  const spaces = blade ? itemBladeMods(character, item).reduce((sum, mod) => sum + mod.slots, 0) : ids.filter((id) => modificationGroup(id) !== 'magazine').length
  const maximum = blade ? 2 : item.slot === 'secondary' ? 1 : 3
  const toggle = (id: string) => {
    const checked = ids.includes(id)
    const stored = (blade ? item.bladeMods : item.modifications) ?? ids
    const value = checked ? stored.filter((entry) => entry !== id) : [...stored, id]
    const next = { ...character, inventory: character.inventory.map((entry) => entry.id === item.id ? { ...entry, ...(blade ? { bladeMods: value } : { modifications: value }), weapon: !blade && id === 'mag-pulls' && entry.weapon ? { ...entry.weapon, magazineCapacity: Math.max(1, entry.weapon.magazineCapacity + (checked ? 1 : -1)), ammo: Math.min(entry.weapon.ammo, Math.max(1, entry.weapon.magazineCapacity + (checked ? 1 : -1))) } : entry.weapon } : entry) }
    if (!checked && calculateInventoryWeight(next) > calculateLoadState(next).maximumLimit) { setError('Esta modificação ultrapassa o limite de carga de 200%.'); return }
    setError(''); onChange(next)
  }
  return <details className="item-modifications"><summary>Modificações de {item.name} · {spaces}/{maximum} espaços</summary>
    <div className="reference-content">
      <p>{blade ? 'Instale exemplares adquiridos pela Célula, entre missões, em Oficina ou com Artífice/ferramentas. A seleção não desconta RI.' : 'Uma modificação por Óptica, Cano e Trilho nas primárias; secundárias têm um espaço. Selecione apenas acessórios compatíveis com o modelo e adquiridos na campanha. Efeitos situacionais seguem a descrição.'}</p>
      {!blade && spaces === 3 && <p>Configuração completa: +1 kg de Sobrecarga Frontal incluído na carga; -1 Iniciativa.</p>}
      {blade && <p>Dano: {ids.includes('hook') || ids.includes('launcher') ? 'sem dano; sem Assassinato' : ids.includes('phantom') ? '1d8 à distância · 10 m' : ids.includes('combat') ? '1d8' : ids.includes('light') ? '1d4' : '1d6'}. Peso por lâmina com modificações: {(item.weight + itemBladeMods(character, item).reduce((sum, mod) => sum + mod.weight, 0)).toLocaleString('pt-BR')} kg. {ids.some((id) => ['hook', 'launcher', 'silent', 'phantom'].includes(id)) ? 'Não pode Aparar.' : 'Pode Aparar, respeitando o estado da Lâmina.'}</p>}
      {blade ? AC_MODS.map((mod) => {
        const checked = ids.includes(mod.id)
        const incompatible = (mod.id === 'light' && ids.some((id) => ['silent', 'counterweight'].includes(id))) || (['silent', 'counterweight'].includes(mod.id) && ids.includes('light'))
        return <label className="ac-mod" key={mod.id}><input type="checkbox" checked={checked} disabled={!checked && (spaces + mod.slots > 2 || incompatible || character.assassin.era < mod.era)} onChange={() => toggle(mod.id)} /><span><b>{mod.name}</b> · {mod.slots} espaço(s) · {mod.cost} RI · {AC_ERAS[mod.era - 1]}<small>{mod.effect}</small></span></label>
      }) : firearmOptions.map((mod) => {
        const checked = ids.includes(mod.id)
        const group = modificationGroup(mod.id)
        const blocked = ids.some((id) => modificationGroup(id) === group) || (group !== 'magazine' && spaces >= maximum)
        return <label className="ac-mod" key={mod.id}><input type="checkbox" checked={checked} disabled={!checked && blocked} onChange={() => toggle(mod.id)} /><span><b>{mod.name}</b> · {mod.weight.toLocaleString('pt-BR')} kg<small>{mod.effect} · Manual v1.4, pág. {mod.sourcePage}</small></span></label>
      })}
      {error && <p role="alert">{error}</p>}
    </div>
  </details>
}
