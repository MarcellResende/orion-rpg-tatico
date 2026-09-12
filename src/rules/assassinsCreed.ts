import type { Character } from '../types'
import { AC_MODS, AC_SCHOOLS } from '../data/assassinsCreed'
import { hasAssassinsCreed } from '../data/characterOptions'
import { availableInventory, findCharacterEquipment } from '../data/expansions'
import { LEVEL_TABLE } from '../data/progression'
import { itemBladeMods, bladeModifiable } from '../data/itemModifications'

export const assassinLevel = (character: Character) => LEVEL_TABLE.reduce((level, entry) => character.progression.xp >= entry.totalXp ? entry.level : level, 1)
export const assassinSchoolChoices = (character: Character) => {
  if (!hasAssassinsCreed(character)) return []
  const level = assassinLevel(character)
  const slots = Number(level >= 2) + Number(level >= 4) + Number(level >= 7) + Number(level >= 9)
  const selections = [...new Set(character.progression.generalAbilities.slice(0, slots))]
  const trainings = AC_SCHOOLS.filter((school) => selections.includes(`assassins-creed:${school.id}:training`)).slice(0, 2)
  return trainings.map((school) => ({ ...school,
    technique1Known: selections.includes(`assassins-creed:${school.id}:technique1`),
    technique2Known: selections.includes(`assassins-creed:${school.id}:technique2`),
    mastered: level >= 9 && character.assassin.primarySchool === school.id && selections.includes(`assassins-creed:${school.id}:technique1`) && selections.includes(`assassins-creed:${school.id}:technique2`),
  }))
}

export const equippedBladeMods = (character: Character) => {
  if (!hasAssassinsCreed(character)) return []
  return availableInventory(character).filter((item) => item.active && bladeModifiable(item)).flatMap((item) => itemBladeMods(character, item))
}
export function assassinProtection(character: Character, penetration = 0) {
  if (!hasAssassinsCreed(character)) return { ra: 0, effectiveRa: 0, flowMaximum: 0, flow: 0, parkourBonus: 0, movementPenalty: 0, stanceDefense: 0, stanceAttack: 0 }
  const equipment = availableInventory(character).filter((item) => item.active).flatMap((item) => {
    const definition = findCharacterEquipment(character, item.catalogItemId)
    return definition ? [definition] : []
  })
  const armor = Math.max(0, ...equipment.filter((item) => item.slot === 'armor').map((item) => item.armorResistance ?? 0))
  const head = Math.max(0, ...equipment.filter((item) => item.slot === 'head').map((item) => item.armorResistance ?? 0))
  const ra = Math.min(8, armor + head)
  const effectiveRa = Math.max(0, ra - 2 * Math.max(0, Math.min(3, Math.floor(Number.isFinite(penetration) ? penetration : 0))))
  const batedor = character.assassin.functionId === 'assassins-creed:batedor'
  const baseMaximum = batedor ? (assassinLevel(character) >= 10 ? 5 : 4) : 3
  const mods = equippedBladeMods(character)
  const flowMaximum = Math.max(1, Math.min(baseMaximum, ...equipment.map((item) => item.flowCap ?? baseMaximum)) - mods.filter((mod) => mod.id === 'defensive').length)
  const flow = Math.min(flowMaximum, character.assassin.flow)
  const guardActive = assassinSchoolChoices(character).some((school) => school.id === character.assassin.guard)
  return {
    ra, effectiveRa, flowMaximum, flow,
    parkourBonus: flow * 1.5 + (mods.some((mod) => mod.id === 'hook') ? 1.5 : 0),
    movementPenalty: equipment.reduce((sum, item) => sum + (item.movementPenalty ?? 0), 0),
    stanceDefense: guardActive ? 0 : character.assassin.stance === 'defensive' ? 2 : character.assassin.stance === 'offensive' ? -2 : 0,
    stanceAttack: guardActive ? 0 : character.assassin.stance === 'offensive' ? 2 : character.assassin.stance === 'defensive' ? -2 : 0,
  }
}
export const bladeWeightAdjustment = (character: Character) => hasAssassinsCreed(character) ? availableInventory(character).reduce((sum, item) => sum + itemBladeMods(character, item).reduce((weight, mod) => weight + mod.weight, 0) * item.quantity, 0) : 0
export function bladeProfile(character: Character, arm: 'left' | 'right') {
  const blade = availableInventory(character).find((item) => item.active && item.slot === `${arm}Blade` && bladeModifiable(item))
  const ids = blade ? itemBladeMods(character, blade).map((mod) => mod.id) : character.assassin.bladeMods[arm]
  const noBlade = ids.includes('hook') || ids.includes('launcher')
  return {
    damage: noBlade ? 'Sem dano' : ids.includes('phantom') ? '1d8 à distância · 10 m' : ids.includes('combat') ? '1d8' : ids.includes('light') ? '1d4' : '1d6',
    assassination: !noBlade,
    parry: !noBlade && !ids.includes('silent') && !ids.includes('phantom'),
    weight: .5 + AC_MODS.filter((mod) => ids.includes(mod.id)).reduce((sum, mod) => sum + mod.weight, 0),
    names: AC_MODS.filter((mod) => ids.includes(mod.id)).map((mod) => mod.name),
  }
}
export const graveWoundThreshold = (maxHp: number, effectiveRa: number) => Math.max(10, maxHp / 3) + effectiveRa

export function dossierState(character: Character) {
  const confirmed = character.assassin.clues.filter((clue) => clue.confirmed)
  const sceneCounts = new Map<string, number>()
  for (const clue of confirmed) sceneCounts.set(clue.scene, Math.min(2, (sceneCounts.get(clue.scene) ?? 0) + 1))
  const points = [...sceneCounts.values()].reduce((sum, count) => sum + count, 0)
  const categories = new Set(confirmed.map((clue) => clue.category)).size
  return { points, categories, label: points >= 6 && categories >= 3 ? 'Completo' : points >= 4 && categories >= 2 ? 'Profundo' : points >= 2 ? 'Preparado' : 'Cego' }
}
