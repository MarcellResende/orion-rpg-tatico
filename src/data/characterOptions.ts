import { SKILL_KEYS, type Character, type SkillKey, type SubskillDefinition } from '../types'
import { FUNCTIONS } from './manual'
import { SUBSKILLS } from './subskills'
import { AC_FUNCTIONS, AC_ID, AC_MODS, emptyAssassin } from './assassinsCreed'

export const hasAssassinsCreed = (character: Character) => character.expansions.enabledIds.includes(AC_ID)
export const characterFunctions = (character: Character) => hasAssassinsCreed(character) ? AC_FUNCTIONS : FUNCTIONS
export const characterFunctionId = (character: Character) => hasAssassinsCreed(character) ? character.assassin.functionId : character.identity.functionId
export const characterFunction = (character: Character) => characterFunctions(character).find((entry) => entry.id === characterFunctionId(character))
export const characterSkillKeys = (character: Character) => SKILL_KEYS.filter((key) => key !== 'mobility' || hasAssassinsCreed(character))
export const HISTORICAL_SUBSKILLS: SubskillDefinition[] = [
  { key: 'shortBlades', skillKey: 'combat', name: 'Lâminas Curtas', description: 'Adagas, facas e Lâmina Oculta.' },
  { key: 'longBlades', skillKey: 'combat', name: 'Lâminas Longas', description: 'Espadas e armas semelhantes.' },
  { key: 'heavyWeapons', skillKey: 'combat', name: 'Armas Pesadas', description: 'Armas grandes ou de impacto.' },
  { key: 'rangedWeapons', skillKey: 'combat', name: 'Armas à Distância', description: 'Arcos, bestas e equivalentes.' },
  { key: 'disguise', skillKey: 'communication', name: 'Disfarce', description: 'Furtividade social e identidades de cobertura.' },
  { key: 'engineering', skillKey: 'technology', name: 'Engenho', description: 'Estruturas, mecanismos e soluções históricas.' },
  { key: 'mechanisms', skillKey: 'technology', name: 'Mecanismos', description: 'Fechaduras e segurança física.' },
  { key: 'crafts', skillKey: 'technology', name: 'Ofícios', description: 'Manutenção e preparação de equipamentos.' },
]
export const characterSubskills = (character: Character) => !hasAssassinsCreed(character) ? SUBSKILLS : [
  ...SUBSKILLS.filter((entry) => (entry.skillKey !== 'combat' || entry.key === 'melee') && (entry.skillKey !== 'technology' || character.assassin.modernTechnology)), ...HISTORICAL_SUBSKILLS,
]
export const characterSubskillsFor = (character: Character, skill: SkillKey) => characterSubskills(character).filter((entry) => entry.skillKey === skill)

export function hydrateAssassin(value: unknown): Character['assassin'] {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const result = emptyAssassin()
  for (const key of ['functionId', 'specialization', 'primarySchool', 'guard', 'target', 'opportunities'] as const) {
    if (typeof source[key] === 'string') result[key] = source[key].slice(0, key === 'opportunities' ? 10000 : 200)
  }
  for (const [key, maximum] of [['era', 16], ['flow', 5], ['suspicion', 4], ['credibility', 3], ['distance', 4], ['layers', 99]] as const) {
    if (typeof source[key] === 'number' && Number.isFinite(source[key])) result[key] = Math.max(key === 'era' ? 1 : 0, Math.min(maximum, Math.floor(source[key])))
  }
  result.modernTechnology = source.modernTechnology === true
  if (source.stance === 'offensive' || source.stance === 'defensive') result.stance = source.stance
  if (Array.isArray(source.clues)) result.clues = source.clues.slice(0, 100).flatMap((clue) => {
    if (!clue || typeof clue !== 'object' || typeof clue.text !== 'string') return []
    return [{ id: String(clue.id ?? '').slice(0, 100), text: clue.text.slice(0, 1000), category: ['HUMINT', 'Observação', 'Documentos', 'Infraestrutura'].includes(clue.category) ? clue.category : 'HUMINT', confirmed: clue.confirmed === true, scene: String(clue.scene ?? '').slice(0, 100) }]
  })
  const blades = source.bladeMods && typeof source.bladeMods === 'object' ? source.bladeMods as Record<string, unknown> : {}
  for (const arm of ['left', 'right'] as const) {
    let spaces = 2
    if (Array.isArray(blades[arm])) for (const id of blades[arm]) {
      const mod = AC_MODS.find((entry) => entry.id === id)
      if (!mod || result.bladeMods[arm].includes(mod.id) || mod.slots > spaces) continue
      if ((mod.id === 'light' && result.bladeMods[arm].some((entry) => ['counterweight', 'silent'].includes(entry))) || (['counterweight', 'silent'].includes(mod.id) && result.bladeMods[arm].includes('light'))) continue
      result.bladeMods[arm].push(mod.id); spaces -= mod.slots
    }
  }
  return result
}
