import type { AbilityDefinition, Character } from '../types'
import { GENERAL_ABILITIES } from './abilities'
import { AC_SCHOOLS } from './assassinsCreed'
import { hasAssassinsCreed } from './characterOptions'

export const SCHOOL_ABILITIES: AbilityDefinition[] = AC_SCHOOLS.flatMap((school) => [
  { id: `assassins-creed:${school.id}:training`, name: `${school.name} · Treinamento`, effect: `Guarda: ${school.guard} Fundamental: ${school.fundamental}`, sourcePage: school.sourcePage, situational: true },
  { id: `assassins-creed:${school.id}:technique1`, name: `${school.name} · Técnica I`, effect: school.technique1, sourcePage: school.sourcePage, situational: true },
  { id: `assassins-creed:${school.id}:technique2`, name: `${school.name} · Técnica II`, effect: school.technique2, sourcePage: school.sourcePage, situational: true },
])
export const characterAbilities = (character: Character) => hasAssassinsCreed(character) ? [...GENERAL_ABILITIES, ...SCHOOL_ABILITIES] : GENERAL_ABILITIES
export const findCharacterAbility = (character: Character, id: string) => characterAbilities(character).find((entry) => entry.id === id)
export function schoolSelectionAllowed(ids: string[], id: string) {
  if (!id.startsWith('assassins-creed:')) return true
  const [, school, type] = id.split(':')
  const trainings = new Set(ids.filter((entry) => entry.startsWith('assassins-creed:') && entry.endsWith(':training')).map((entry) => entry.split(':')[1]))
  return type === 'training' ? trainings.size <= 2 : trainings.has(school)
}
