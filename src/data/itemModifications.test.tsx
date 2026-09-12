import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createEmptyCharacter, hydrateCharacter } from '../character'
import { EQUIPMENT_CATALOG } from './equipment'
import { ASSASSINS_CREED, AC_ID } from './assassinsCreed'
import { setExpansionEnabled } from './expansions'
import { installedFirearmMods, itemBladeMods, firearmExtraWeight } from './itemModifications'
import { calculateInventoryWeight, calculateCharacterBonuses } from '../rules/calculations'
import { equippedBladeMods } from '../rules/assassinsCreed'
import { InventoryPanel } from '../components/InventoryPanel'
import type { EquipmentDefinition, InventoryItem } from '../types'

const item = (definition: EquipmentDefinition, id = definition.id): InventoryItem => ({ ...definition, id, catalogItemId: definition.id, quantity: 1, active: true, notes: '', weapon: undefined })
const lmg = () => item(EQUIPMENT_CATALOG.find((entry) => entry.id === 'light-machine-gun')!)
describe('modificações por exemplar do inventário', () => {
  it('limita grupos e espaços da primária e inclui a sobrecarga frontal', () => {
    const weapon = { ...lmg(), modifications: ['optic-red-dot', 'optic-hybrid', 'barrel-suppressor', 'rail-bipod', 'rail-laser'] }
    expect(installedFirearmMods(weapon).map((entry) => entry.id)).toEqual(['optic-red-dot', 'barrel-suppressor', 'rail-bipod'])
    expect(firearmExtraWeight(weapon)).toBe(2)
    const pistol = item(EQUIPMENT_CATALOG.find((entry) => entry.id === 'tactical-pistol')!)
    expect(installedFirearmMods({ ...pistol, modifications: weapon.modifications })).toHaveLength(1)
  })
  it('mantém configurações independentes, peso e persistência; bônus acompanham a arma equipada', () => {
    let character = createEmptyCharacter()
    character.inventory = [{ ...lmg(), modifications: ['rail-bipod'] }, { ...lmg(), id: 'second', active: false, modifications: ['optic-red-dot'] }]
    character = hydrateCharacter(JSON.parse(JSON.stringify(character)))
    expect(character.inventory[1].modifications).toEqual(['optic-red-dot'])
    expect(calculateInventoryWeight(character)).toBe(20.75)
    expect(calculateCharacterBonuses(character).skills.combat).toBe(2)
    character.inventory[0].active = false
    expect(calculateCharacterBonuses(character).skills.combat).toBe(0)
    expect(calculateInventoryWeight(character)).toBe(20.75)
  })
  it('preserva configuração antiga apenas na lâmina original e suspende a expansão', () => {
    let character = setExpansionEnabled(createEmptyCharacter(), AC_ID, true)
    const blade = item(ASSASSINS_CREED.equipment.find((entry) => entry.id === `${AC_ID}:hidden-blade-left`)!)
    character.assassin.bladeMods.left = ['combat']
    character.inventory = [{ ...blade, expansionId: AC_ID }, { ...blade, expansionId: AC_ID, id: 'second', active: false, bladeMods: ['light', 'silent'] }]
    expect(itemBladeMods(character, character.inventory[0]).map((mod) => mod.id)).toEqual(['combat'])
    expect(itemBladeMods(character, character.inventory[1]).map((mod) => mod.id)).toEqual(['light'])
    expect(equippedBladeMods(character).map((mod) => mod.id)).toEqual(['combat'])
    const weight = calculateInventoryWeight(character)
    character = hydrateCharacter(setExpansionEnabled(character, AC_ID, false))
    expect(calculateInventoryWeight(character)).toBe(0)
    expect(equippedBladeMods(character)).toEqual([])
    character = setExpansionEnabled(character, AC_ID, true)
    expect(calculateInventoryWeight(character)).toBe(weight)
  })
  it('exibe a aba somente em itens compatíveis já adicionados', () => {
    const character = createEmptyCharacter()
    const empty = renderToStaticMarkup(<InventoryPanel character={character} onChange={() => {}} />)
    expect(empty).not.toContain('<summary>Modificações de')
    character.inventory = [lmg()]
    const html = renderToStaticMarkup(<InventoryPanel character={character} onChange={() => {}} />)
    expect(html).toContain('<summary>Modificações de Metralhadora Leve / LMG')
    expect(html).toContain('Bipé')
  })
})
