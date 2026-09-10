import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createEmptyCharacter, hydrateCharacter } from '../character'
import { AC_ID, AC_MODS, AC_SCHOOLS, ASSASSINS_CREED } from '../data/assassinsCreed'
import { availableEquipment, availableInventory, setExpansionEnabled } from '../data/expansions'
import { characterFunction, characterSkillKeys, characterSubskillsFor } from '../data/characterOptions'
import { schoolSelectionAllowed } from '../data/characterAbilities'
import { calculateDerivedResources, calculateInventoryWeight, calculateSkillPointsSpent, changeSkill, changeSubskill } from './calculations'
import { assassinProtection, assassinSchoolChoices, bladeProfile, dossierState, graveWoundThreshold } from './assassinsCreed'
import { AssassinsCreedPanel } from '../components/AssassinsCreedPanel'
import { AbilitiesPanel } from '../components/AbilitiesPanel'
import { SubskillsPanel } from '../components/SubskillsPanel'
import { hydrateCampaignProgression } from '../services/campaignService'
import type { Character, InventoryItem } from '../types'

const active = () => setExpansionEnabled(createEmptyCharacter(), AC_ID, true)
const equip = (character: Character, id: string): InventoryItem => {
  const definition = availableEquipment(character).find((item) => item.id === `${AC_ID}:${id}`)!
  return { id, expansionId: AC_ID, catalogItemId: definition.id, name: definition.name, quantity: 1, weight: definition.weight, notes: '', category: definition.category, effect: definition.effect, slot: definition.slot, active: true }
}
describe('Assassin’s Creed v1.5.1', () => {
  it('alterna proteções históricas e base sem perder o estado equipado', () => {
    let character = active()
    const baseArmor: InventoryItem = { id: 'base-armor', catalogItemId: '', name: 'Proteção base', quantity: 1, weight: 4, notes: '', effect: '', category: 'protection', slot: 'armor', active: true }
    character.inventory = [baseArmor, equip(character, 'medium-armor')]
    expect(availableInventory(character).map((item) => item.id)).toEqual(['medium-armor'])
    character = setExpansionEnabled(character, AC_ID, false)
    expect(availableInventory(character).map((item) => item.id)).toEqual(['base-armor'])
    character = setExpansionEnabled(character, AC_ID, true)
    expect(character.inventory.every((item) => item.active)).toBe(true)
    expect(assassinProtection(character).ra).toBe(4)
  })
  it('cadastra a expansão desligada, sem inventar atributo ou orçamento', () => {
    const character = createEmptyCharacter()
    expect(character.expansions.enabledIds).toEqual([])
    expect(ASSASSINS_CREED.attributes).toEqual([])
    expect(ASSASSINS_CREED.attributePoints).toBe(0)
    expect(characterSkillKeys(character)).not.toContain('mobility')
    expect(availableEquipment(character).some((item) => item.id.startsWith(AC_ID))).toBe(false)
  })
  it('Mobilidade consome a reserva normal e Batedor concede +2 gratuito', () => {
    let character = active()
    character.assassin.functionId = `${AC_ID}:batedor`
    for (let i = 0; i < 11; i++) character = changeSkill(character, 'mobility', 1)
    expect(character.skills.mobility).toBe(10)
    expect(calculateSkillPointsSpent(character.skills, character)).toBe(10)
    expect(assassinProtection(character).flowMaximum).toBe(4)
    expect(calculateDerivedResources(character)).toMatchObject({ maxHp: 25, maxEnergy: 13 })
  })
  it('substitui Combate e Tecnologia, acrescenta Disfarce no mesmo orçamento', () => {
    let character = active()
    character = changeSkill(character, 'combat', 1)
    for (let i = 0; i < 3; i++) character = changeSubskill(character, 'shortBlades', 1)
    expect(character.subskills.shortBlades).toBe(2)
    expect(changeSubskill(character, 'longRangeWeapons', 1)).toBe(character)
    expect(characterSubskillsFor(character, 'combat')).toHaveLength(5)
    character = changeSkill(character, 'communication', 1)
    character = changeSubskill(character, 'disguise', 1)
    expect(changeSubskill(character, 'diplomacy', 1)).toBe(character)
    expect(characterSubskillsFor(character, 'technology').map((item) => item.key)).toEqual(['engineering', 'mechanisms', 'crafts'])
    character.assassin.modernTechnology = true
    expect(characterSubskillsFor(character, 'technology')).toHaveLength(6)
  })
  it('desativar e reativar preserva dados, função base e subperícias de ambas versões', () => {
    let character = active()
    character.identity.functionId = 'medic'
    character.assassin.functionId = `${AC_ID}:batedor`
    character.skills.combat = 2
    character.skills.mobility = 2
    character.subskills.shortBlades = 3
    character.subskills.longRangeWeapons = 2
    character.assassin.flow = 3
    character.inventory = [equip(character, 'medium-armor')]
    character = hydrateCharacter(JSON.parse(JSON.stringify(setExpansionEnabled(character, AC_ID, false))))
    expect(characterFunction(character)?.id).toBe('medic')
    expect(character.subskills.shortBlades).toBe(3)
    expect(character.skills.mobility).toBe(2)
    expect(calculateInventoryWeight(character)).toBe(0)
    character = hydrateCharacter(setExpansionEnabled(character, AC_ID, true))
    expect(characterFunction(character)?.id).toBe(`${AC_ID}:batedor`)
    expect(character.subskills.longRangeWeapons).toBe(2)
    expect(character.assassin.flow).toBe(3)
    expect(assassinProtection(character).flow).toBe(2)
  })
  it('aplica teto de RA antes de Penetrante, sem alterar dano ou PV', () => {
    const character = active()
    character.inventory = [equip(character, 'exceptional-armor'), equip(character, 'closed-helmet')]
    const protection = assassinProtection(character, 2)
    expect(protection.ra).toBe(8)
    expect(protection.effectiveRa).toBe(4)
    expect(graveWoundThreshold(30, protection.effectiveRa)).toBe(14)
    expect(calculateDerivedResources(character)).toMatchObject({ defense: 13, maxHp: 20, movement: 7.5 })
    expect(character.resources.hp).toBe(20)
  })
  it('limita Fluxo por armadura e aplica postura, escudo e customização de braço', () => {
    const character = active()
    character.assassin.functionId = `${AC_ID}:batedor`
    character.progression.xp = 72
    expect(assassinProtection(character).flowMaximum).toBe(5)
    character.inventory = [equip(character, 'medium-armor'), equip(character, 'large-shield'), equip(character, 'hidden-blade-left')]
    character.assassin.bladeMods.left = ['defensive']
    character.assassin.stance = 'defensive'
    expect(assassinProtection(character).flowMaximum).toBe(1)
    expect(calculateDerivedResources(character)).toMatchObject({ defense: 17, movement: 7.5 })
    expect(calculateInventoryWeight(character)).toBe(13)
    expect(bladeProfile(character, 'left').weight).toBe(1)
  })
  it('preserva as restrições de duas escolas, escolhas e Maestria no nível 9', () => {
    const character = active()
    character.progression.xp = 60
    character.assassin.primarySchool = 'masyaf'
    character.progression.generalAbilities = ['assassins-creed:masyaf:training', 'assassins-creed:masyaf:technique1', 'assassins-creed:masyaf:technique2']
    expect(assassinSchoolChoices(character)[0].mastered).toBe(true)
    character.progression.xp = 39
    expect(assassinSchoolChoices(character)[0].mastered).toBe(false)
    expect(schoolSelectionAllowed(['assassins-creed:masyaf:training'], 'assassins-creed:fiore:technique1')).toBe(false)
    expect(schoolSelectionAllowed(['assassins-creed:masyaf:training', 'assassins-creed:fiore:training', 'assassins-creed:dardi:training'], 'assassins-creed:dardi:training')).toBe(false)
    expect(AC_SCHOOLS).toHaveLength(14)
    expect(AC_SCHOOLS.every((school) => school.guard && school.fundamental && school.technique1 && school.technique2 && school.mastery)).toBe(true)
  })
  it('hidrata Lâminas respeitando espaços e incompatibilidades', () => {
    const character = hydrateCharacter({ assassin: { bladeMods: { left: ['hook', 'quick'], right: ['light', 'counterweight'] } } })
    expect(character.assassin.bladeMods).toEqual({ left: ['hook'], right: ['light'] })
    expect(bladeProfile(character, 'left').assassination).toBe(false)
    expect(bladeProfile(character, 'right').damage).toBe('1d4')
    expect(AC_MODS).toHaveLength(14)
  })
  it('Dossiê limita PD por cena e exige variedade de fontes', () => {
    const character = active()
    character.assassin.clues = Array.from({ length: 6 }, (_, index) => ({ id: String(index), text: 'Pista', scene: 'Uma cena', category: 'HUMINT', confirmed: true }))
    expect(dossierState(character)).toMatchObject({ points: 2, label: 'Preparado' })
    character.assassin.clues = character.assassin.clues.map((clue, index) => ({ ...clue, scene: String(Math.floor(index / 2)), category: ['HUMINT', 'Observação', 'Documentos'][Math.floor(index / 2)] }))
    expect(dossierState(character)).toMatchObject({ points: 6, categories: 3, label: 'Completo' })
  })
  it('integra painéis e preserva estado coletivo na hidratação da campanha', () => {
    const character = active()
    expect(renderToStaticMarkup(<AssassinsCreedPanel character={character} onChange={() => {}} />)).toContain('RA efetiva')
    expect(renderToStaticMarkup(<SubskillsPanel character={character} onChange={() => {}} />)).toContain('Lâminas Curtas')
    character.progression.xp = 60
    expect(renderToStaticMarkup(<AbilitiesPanel character={character} onChange={() => {}} />)).toContain('Masyaf')
    expect(hydrateCampaignProgression({ brotherhood: { prestige: 12, resources: 20, notoriety: 99, fractures: -2 } }).brotherhood).toMatchObject({ prestige: 12, resources: 20, notoriety: 5, fractures: 0 })
  })
})
