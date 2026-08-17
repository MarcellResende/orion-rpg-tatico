import {
  ATTRIBUTE_KEYS,
  SKILL_KEYS,
  type AttributeKey,
  type Attributes,
  type Character,
  type DerivedResources,
  type IdentityValidation,
  type ResourceKey,
  type ResourceState,
  type SkillKey,
  type Skills,
} from '../types'

export const ATTRIBUTE_POINT_LIMIT = 6
export const BASE_SKILL_POINTS = 10

const sumValues = <T extends string>(keys: readonly T[], values: Record<T, number>) =>
  keys.reduce((total, key) => total + values[key], 0)

export const calculateMaxHp = (attributes: Attributes) =>
  20 + attributes.constitution * 10

export const calculateMaxEnergy = (attributes: Attributes) =>
  10 + attributes.dexterity * 5

export const calculateDefense = () => 10

export const calculateMaxComposure = (attributes: Attributes, skills: Skills) =>
  5 + attributes.intelligence + skills.willpower

export const calculateMaxStress = () => 6

export const calculateMaxSkillPoints = (attributes: Attributes) =>
  BASE_SKILL_POINTS + attributes.intelligence

export const calculateAttributePointsSpent = (attributes: Attributes) =>
  sumValues(ATTRIBUTE_KEYS, attributes)

export const calculateSkillPointsSpent = (skills: Skills) =>
  sumValues(SKILL_KEYS, skills)

export const calculateDerivedResources = (character: Character): DerivedResources => ({
  maxHp: calculateMaxHp(character.attributes),
  maxEnergy: calculateMaxEnergy(character.attributes),
  defense: calculateDefense(),
  maxComposure: calculateMaxComposure(character.attributes, character.skills),
  maxStress: calculateMaxStress(),
  maxSkillPoints: calculateMaxSkillPoints(character.attributes),
})

export const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(Math.round(Number.isFinite(value) ? value : minimum), minimum), maximum)

export const clampResources = (
  resources: ResourceState,
  derived: DerivedResources,
): ResourceState => ({
  hp: clamp(resources.hp, 0, derived.maxHp),
  energy: clamp(resources.energy, 0, derived.maxEnergy),
  composure: clamp(resources.composure, 0, derived.maxComposure),
  stress: clamp(resources.stress, 0, derived.maxStress),
})

const withClampedResources = (character: Character): Character => ({
  ...character,
  resources: clampResources(character.resources, calculateDerivedResources(character)),
})

export const changeAttribute = (
  character: Character,
  key: AttributeKey,
  delta: number,
): Character => {
  const step = Math.sign(delta)
  if (step === 0) return character

  const current = character.attributes[key]
  if (step > 0 && calculateAttributePointsSpent(character.attributes) >= ATTRIBUTE_POINT_LIMIT) {
    return character
  }
  if (step < 0 && current === 0) return character

  const nextValue = current + step
  if (
    key === 'intelligence' &&
    step < 0 &&
    calculateSkillPointsSpent(character.skills) > BASE_SKILL_POINTS + nextValue
  ) {
    return character
  }

  return withClampedResources({
    ...character,
    attributes: { ...character.attributes, [key]: nextValue },
  })
}

export const changeSkill = (
  character: Character,
  key: SkillKey,
  delta: number,
): Character => {
  const step = Math.sign(delta)
  if (step === 0) return character

  const current = character.skills[key]
  if (step > 0 && calculateSkillPointsSpent(character.skills) >= calculateMaxSkillPoints(character.attributes)) {
    return character
  }
  if (step < 0 && current === 0) return character

  return withClampedResources({
    ...character,
    skills: { ...character.skills, [key]: current + step },
  })
}

const resourceMaximum = (character: Character, key: ResourceKey) => {
  const derived = calculateDerivedResources(character)
  const maximums: Record<ResourceKey, number> = {
    hp: derived.maxHp,
    energy: derived.maxEnergy,
    composure: derived.maxComposure,
    stress: derived.maxStress,
  }
  return maximums[key]
}

export const setResource = (
  character: Character,
  key: ResourceKey,
  value: number,
): Character => ({
  ...character,
  resources: {
    ...character.resources,
    [key]: clamp(value, 0, resourceMaximum(character, key)),
  },
})

export const changeResource = (
  character: Character,
  key: ResourceKey,
  delta: number,
) => setResource(character, key, character.resources[key] + delta)

export const validateIdentity = (character: Character): IdentityValidation => {
  const errors: IdentityValidation = {}
  if (!character.identity.name.trim()) errors.name = 'Informe o nome do operador.'
  if (character.identity.age !== null && character.identity.age < 23) {
    errors.age = 'O manual exige idade mínima de 23 anos.'
  }
  return errors
}
