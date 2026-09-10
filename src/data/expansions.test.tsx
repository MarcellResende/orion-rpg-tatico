import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createEmptyCharacter, hydrateCharacter } from '../character'
import { ExpansionAttributes } from '../components/ExpansionAttributes'
import { ManualReferencePanel } from '../components/ManualReferencePanel'
import { InventoryPanel } from '../components/InventoryPanel'
import { calculateDerivedResources, calculateInventoryWeight } from '../rules/calculations'
import { activeExpansions, availableEquipment, changeExpansionAttribute, EXPANSIONS, expansionAttributeValue, setExpansionEnabled, type ExpansionDefinition } from './expansions'

const example: ExpansionDefinition = {
  id: 'test-expansion', name: 'Expansão de teste', version: '1', source: 'Somente teste', description: 'Fixture', attributePoints: 2,
  attributes: [{ id: 'attribute-x', name: 'Atributo X', description: 'Reserva adicional', maximum: 2, perPoint: { maxEnergy: 2 } }],
  rules: [{ id: 'resilience', name: 'Resiliência expandida', text: 'Mais 5 PV máximos.', sourcePage: 1, modifiers: { maxHp: 5 } }],
  equipment: [{ id: 'test-expansion:vest', name: 'Colete da expansão', category: 'protection', weight: 2, effect: '+3 Defesa', sourcePage: 2, slot: 'armor', defenseBonus: 3 }],
}
const originalExpansions = [...EXPANSIONS]
beforeEach(() => { EXPANSIONS.splice(0, EXPANSIONS.length, ...originalExpansions, example) })
afterEach(() => { EXPANSIONS.splice(0, EXPANSIONS.length, ...originalExpansions) })

describe('expansões integradas à ficha', () => {
  it('integra atributos, regras e arsenal apenas quando ativada', () => {
    const base = createEmptyCharacter()
    expect(renderToStaticMarkup(<ExpansionAttributes character={base} onChange={() => {}} />)).not.toContain('Atributo X')
    expect(availableEquipment(base).some((item) => item.id === example.equipment[0].id)).toBe(false)
    const active = setExpansionEnabled(base, example.id, true)
    expect(renderToStaticMarkup(<ExpansionAttributes character={active} onChange={() => {}} />)).toContain('Atributo X')
    expect(renderToStaticMarkup(<ManualReferencePanel character={active} />)).toContain('Resiliência expandida')
    expect(renderToStaticMarkup(<InventoryPanel character={active} onChange={() => {}} />)).toContain('Colete da expansão')
    expect(calculateDerivedResources(active).maxHp).toBe(25)
    expect(calculateDerivedResources(changeExpansionAttribute(active, example.id, 'attribute-x', 1)).maxEnergy).toBe(12)
  })

  it('preserva valores e inventário após desativar, salvar e reativar', () => {
    let character = changeExpansionAttribute(setExpansionEnabled(createEmptyCharacter(), example.id, true), example.id, 'attribute-x', 1)
    character.inventory.push({ id: 'owned', catalogItemId: example.equipment[0].id, expansionId: example.id, name: 'Colete da expansão', quantity: 1, weight: 2, notes: '', category: 'protection', effect: '+3 Defesa', slot: 'armor', active: true })
    expect(calculateDerivedResources(character).defense).toBe(13)
    character = hydrateCharacter(JSON.parse(JSON.stringify(setExpansionEnabled(character, example.id, false))))
    expect(calculateInventoryWeight(character)).toBe(0)
    expect(calculateDerivedResources(character)).toMatchObject({ defense: 10, maxHp: 20, maxEnergy: 10 })
    expect(character.inventory).toHaveLength(1)
    expect(expansionAttributeValue(character, example.id, 'attribute-x')).toBe(1)
    character = setExpansionEnabled(character, example.id, true)
    expect(calculateDerivedResources(character)).toMatchObject({ defense: 13, maxHp: 25, maxEnergy: 12 })
    expect(calculateInventoryWeight(character)).toBe(2)
  })

  it('mantém expansões independentes e não duplica ativação', () => {
    EXPANSIONS.push({ ...example, id: 'another', equipment: [], rules: [] })
    let character = setExpansionEnabled(createEmptyCharacter(), example.id, true)
    character = setExpansionEnabled(character, example.id, true)
    character = setExpansionEnabled(character, 'another', true)
    character = changeExpansionAttribute(character, example.id, 'attribute-x', 1)
    expect(activeExpansions(character)).toHaveLength(2)
    expect(expansionAttributeValue(character, 'another', 'attribute-x')).toBe(0)
    expect(activeExpansions(setExpansionEnabled(character, example.id, false)).map((entry) => entry.id)).toEqual(['another'])
  })

  it('respeita orçamento e migra fichas antigas e dados inválidos', () => {
    expect(hydrateCharacter({}).expansions.enabledIds).toEqual([])
    const character = hydrateCharacter({ expansions: { enabledIds: [example.id, example.id, 42], attributeValues: { 'test-expansion:attribute-x': 900, 'bad:key': 'invalido' } } })
    expect(character.expansions.enabledIds).toEqual([example.id])
    expect(expansionAttributeValue(character, example.id, 'attribute-x')).toBe(2)
    expect(changeExpansionAttribute(character, example.id, 'attribute-x', 1)).toBe(character)
    const disabled = setExpansionEnabled(character, example.id, false)
    expect(changeExpansionAttribute(disabled, example.id, 'attribute-x', -1)).toBe(disabled)
  })

  it('reativa armadura guardada sem substituir a proteção já equipada', () => {
    const character = createEmptyCharacter()
    character.inventory = [
      { id: 'base', catalogItemId: 'light-tactical-vest', name: 'Colete leve', quantity: 1, weight: 4, notes: '', category: 'protection', effect: '', slot: 'armor', active: true },
      { id: 'extra', expansionId: example.id, catalogItemId: example.equipment[0].id, name: 'Colete extra', quantity: 1, weight: 2, notes: '', category: 'protection', effect: '', slot: 'armor', active: true },
    ]
    const active = setExpansionEnabled(character, example.id, true)
    expect(active.inventory.map((item) => item.active)).toEqual([true, false])
    expect(calculateDerivedResources(active).defense).toBe(14)
  })

  it('preserva expansão ausente sem aplicar seus efeitos', () => {
    const character = hydrateCharacter({ expansions: { enabledIds: ['future'], attributeValues: { 'future:x': 2 } }, inventory: [{ id: 'future-item', expansionId: 'future', name: 'Item futuro', weight: 99 }] })
    expect(character.expansions.attributeValues['future:x']).toBe(2)
    expect(activeExpansions(character)).toHaveLength(0)
    expect(calculateInventoryWeight(character)).toBe(0)
  })
})
