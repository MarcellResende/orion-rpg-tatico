import {
  ATTRIBUTE_KEYS,
  SKILL_KEYS,
  type Attributes,
  type Character,
  type Identity,
  type ResourceState,
  type Skills,
} from './types'
import {
  ATTRIBUTE_POINT_LIMIT,
  BASE_SKILL_POINTS,
  calculateDerivedResources,
  clamp,
  clampResources,
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
  schemaVersion: 1,
  level: 1,
  identity: { ...EMPTY_IDENTITY },
  attributes: { ...EMPTY_ATTRIBUTES },
  skills: { ...EMPTY_SKILLS },
  resources: {
    hp: 20,
    energy: 10,
    composure: 5,
    stress: 0,
  },
  updatedAt: new Date().toISOString(),
})

const safeObject = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

const safeText = (value: unknown) => (typeof value === 'string' ? value.slice(0, 240) : '')

const safeNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

export const hydrateCharacter = (value: unknown): Character => {
  const root = safeObject(value)
  const identitySource = safeObject(root.identity)
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

  let remainingAttributes = ATTRIBUTE_POINT_LIMIT
  const attributes = { ...EMPTY_ATTRIBUTES }
  for (const key of ATTRIBUTE_KEYS) {
    attributes[key] = clamp(safeNumber(attributesSource[key]), 0, remainingAttributes)
    remainingAttributes -= attributes[key]
  }

  let remainingSkills = BASE_SKILL_POINTS + attributes.intelligence
  const skills = { ...EMPTY_SKILLS }
  for (const key of SKILL_KEYS) {
    skills[key] = clamp(safeNumber(skillsSource[key]), 0, remainingSkills)
    remainingSkills -= skills[key]
  }

  const resources: ResourceState = {
    hp: safeNumber(resourcesSource.hp, 20),
    energy: safeNumber(resourcesSource.energy, 10),
    composure: safeNumber(resourcesSource.composure, 5),
    stress: safeNumber(resourcesSource.stress, 0),
  }

  const character: Character = {
    schemaVersion: 1,
    level: 1,
    identity,
    attributes,
    skills,
    resources,
    updatedAt: safeText(root.updatedAt) || new Date().toISOString(),
  }

  return {
    ...character,
    resources: clampResources(resources, calculateDerivedResources(character)),
  }
}
