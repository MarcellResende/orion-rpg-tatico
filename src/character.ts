import {
  ATTRIBUTE_KEYS,
  SKILL_KEYS,
  type Attributes,
  type Character,
  type FunctionChoices,
  type Identity,
  type InventoryItem,
  type ResourceState,
  type Skills,
} from './types'
import {
  ATTRIBUTE_POINT_LIMIT,
  applyCharacterLimits,
  calculateMaxSkillPointsForCharacter,
  clamp,
} from './rules/calculations'

const EMPTY_ATTRIBUTES: Attributes = {
  strength: 0,
  dexterity: 0,
  intelligence: 0,
  constitution: 0,
}

const EMPTY_SKILLS: Skills = {
  combat: 0,
  communication: 0,
  piloting: 0,
  tolerance: 0,
  exploration: 0,
  stealth: 0,
  medicine: 0,
  technology: 0,
  willpower: 0,
}

const EMPTY_IDENTITY: Identity = {
  name: '',
  codename: '',
  age: null,
  nationality: '',
  functionId: '',
  traitId: '',
  remorse: '',
}

export const createEmptyCharacter = (): Character => ({
  schemaVersion: 2,
  level: 1,
  identity: { ...EMPTY_IDENTITY },
  functionChoices: {},
  attributes: { ...EMPTY_ATTRIBUTES },
  skills: { ...EMPTY_SKILLS },
  resources: {
    hp: 20,
    energy: 10,
    composure: 5,
    stress: 0,
  },
  inventory: [],
  updatedAt: new Date().toISOString(),
})

const safeObject = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

const safeText = (value: unknown, maximum = 240) =>
  typeof value === 'string' ? value.slice(0, maximum) : ''

const safeNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const safeDecimal = (value: unknown, minimum: number, maximum: number) => {
  const number = safeNumber(value, minimum)
  return Math.min(Math.max(Math.round(number * 100) / 100, minimum), maximum)
}

const hydrateInventory = (value: unknown): InventoryItem[] => {
  if (!Array.isArray(value)) return []
  return value.slice(0, 100).flatMap((raw, index) => {
    const item = safeObject(raw)
    const name = safeText(item.name, 100).trim()
    if (!name) return []
    return [{
      id: safeText(item.id, 100) || `legacy-${index}`,
      name,
      quantity: clamp(safeNumber(item.quantity, 1), 1, 999),
      weight: safeDecimal(item.weight, 0, 9999),
      notes: safeText(item.notes, 300),
    }]
  })
}

export const hydrateCharacter = (value: unknown): Character => {
  const root = safeObject(value)
  const identitySource = safeObject(root.identity)
  const choicesSource = safeObject(root.functionChoices)
  const attributesSource = safeObject(root.attributes)
  const skillsSource = safeObject(root.skills)
  const resourcesSource = safeObject(root.resources)

  const identity: Identity = {
    name: safeText(identitySource.name),
    codename: safeText(identitySource.codename),
    age:
      identitySource.age === null || identitySource.age === undefined
        ? null
        : clamp(safeNumber(identitySource.age), 0, 120),
    nationality: safeText(identitySource.nationality),
    functionId: safeText(identitySource.functionId),
    traitId: safeText(identitySource.traitId),
    remorse: safeText(identitySource.remorse),
  }

  const functionChoices: FunctionChoices = {}
  for (const [key, rawChoice] of Object.entries(choicesSource).slice(0, 10)) {
    if (typeof rawChoice === 'string' && ATTRIBUTE_KEYS.includes(rawChoice as never)) {
      functionChoices[key] = rawChoice as FunctionChoices[string]
    }
  }

  let remainingAttributes = ATTRIBUTE_POINT_LIMIT
  const attributes = { ...EMPTY_ATTRIBUTES }
  for (const key of ATTRIBUTE_KEYS) {
    attributes[key] = clamp(safeNumber(attributesSource[key]), 0, remainingAttributes)
    remainingAttributes -= attributes[key]
  }

  const resources: ResourceState = {
    hp: safeNumber(resourcesSource.hp, 20),
    energy: safeNumber(resourcesSource.energy, 10),
    composure: safeNumber(resourcesSource.composure, 5),
    stress: safeNumber(resourcesSource.stress, 0),
  }

  const character: Character = {
    schemaVersion: 2,
    level: 1,
    identity,
    functionChoices,
    attributes,
    skills: { ...EMPTY_SKILLS },
    resources,
    inventory: hydrateInventory(root.inventory),
    updatedAt: safeText(root.updatedAt) || new Date().toISOString(),
  }

  let remainingSkills = calculateMaxSkillPointsForCharacter(character)
  for (const key of SKILL_KEYS) {
    character.skills[key] = clamp(safeNumber(skillsSource[key]), 0, remainingSkills)
    remainingSkills -= character.skills[key]
  }

  return applyCharacterLimits(character)
}
