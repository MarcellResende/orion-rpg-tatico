import { FUNCTIONS, TRAITS } from '../data/manual'
import {
  ATTRIBUTE_KEYS,
  SKILL_KEYS,
  type AttributeKey,
  type Attributes,
  type Character,
  type CharacterBonuses,
  type DerivedResources,
  type IdentityValidation,
  type ResourceKey,
  type ResourceState,
  type SkillKey,
  type Skills,
} from '../types'

export const ATTRIBUTE_POINT_LIMIT = 6
export const BASE_SKILL_POINTS = 10

const emptyAttributes = (): Attributes => ({
  strength: 0,
  dexterity: 0,
  intelligence: 0,
  constitution: 0,
})

const emptySkills = (): Skills => ({
  combat: 0,
  communication: 0,
  piloting: 0,
  tolerance: 0,
  exploration: 0,
  stealth: 0,
  medicine: 0,
  technology: 0,
  willpower: 0,
})

const sumValues = <T extends string>(keys: readonly T[], values: Record<T, number>) =>
  keys.reduce((total, key) => total + values[key], 0)

export const calculateCharacterBonuses = (character: Character): CharacterBonuses => {
  const attributes = emptyAttributes()
  const skills = emptySkills()
  const selectedFunction = FUNCTIONS.find((item) => item.id === character.identity.functionId)
  const selectedTrait = TRAITS.find((item) => item.id === character.identity.traitId)

  for (const key of ATTRIBUTE_KEYS) {
    attributes[key] += selectedFunction?.attributeBonuses?.[key] ?? 0
  }
  for (const choice of selectedFunction?.attributeChoices ?? []) {
    const selected = character.functionChoices[choice.id]
    if (selected && choice.options.includes(selected)) attributes[selected] += 1
  }
  for (const key of SKILL_KEYS) {
    skills[key] += selectedFunction?.skillBonuses?.[key] ?? 0
    skills[key] += selectedTrait?.skillBonuses?.[key] ?? 0
  }

  return { attributes, skills }
}

export const calculateEffectiveAttributes = (character: Character): Attributes => {
  const bonuses = calculateCharacterBonuses(character).attributes
  return Object.fromEntries(
    ATTRIBUTE_KEYS.map((key) => [key, character.attributes[key] + bonuses[key]]),
  ) as unknown as Attributes
}

export const calculateEffectiveSkills = (character: Character): Skills => {
  const bonuses = calculateCharacterBonuses(character).skills
  return Object.fromEntries(
    SKILL_KEYS.map((key) => [key, character.skills[key] + bonuses[key]]),
  ) as unknown as Skills
}

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

export const calculateMaxSkillPointsForCharacter = (character: Character) =>
  calculateMaxSkillPoints(calculateEffectiveAttributes(character))

export const calculateAttributePointsSpent = (attributes: Attributes) =>
  sumValues(ATTRIBUTE_KEYS, attributes)

export const calculateSkillPointsSpent = (skills: Skills) =>
  sumValues(SKILL_KEYS, skills)

export const calculateDerivedResources = (character: Character): DerivedResources => {
  const attributes = calculateEffectiveAttributes(character)
  const skills = calculateEffectiveSkills(character)
  return {
    maxHp: calculateMaxHp(attributes),
    maxEnergy: calculateMaxEnergy(attributes),
    defense: calculateDefense(),
    maxComposure: calculateMaxComposure(attributes, skills),
    maxStress: calculateMaxStress(),
    maxSkillPoints: calculateMaxSkillPoints(attributes),
  }
}

export const calculateInventoryWeight = (character: Character) =>
  Math.round(character.inventory.reduce(
    (total, item) => total + item.weight * item.quantity,
    0,
  ) * 100) / 100

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

const clampAllocatedSkills = (skills: Skills, maximum: number): Skills => {
  let remaining = maximum
  const next = emptySkills()
  for (const key of SKILL_KEYS) {
    next[key] = clamp(skills[key], 0, remaining)
    remaining -= next[key]
  }
  return next
}

export const applyCharacterLimits = (character: Character): Character => {
  const skills = clampAllocatedSkills(
    character.skills,
    calculateMaxSkillPointsForCharacter(character),
  )
  const withSkills = { ...character, skills }
  return {
    ...withSkills,
    resources: clampResources(withSkills.resources, calculateDerivedResources(withSkills)),
  }
}

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

  const candidate = {
    ...character,
    attributes: { ...character.attributes, [key]: current + step },
  }
  if (
    step < 0 &&
    calculateSkillPointsSpent(character.skills) > calculateMaxSkillPointsForCharacter(candidate)
  ) {
    return character
  }

  return withClampedResources(candidate)
}

export const changeSkill = (
  character: Character,
  key: SkillKey,
  delta: number,
): Character => {
  const step = Math.sign(delta)
  if (step === 0) return character

  const current = character.skills[key]
  if (
    step > 0 &&
    calculateSkillPointsSpent(character.skills) >= calculateMaxSkillPointsForCharacter(character)
  ) {
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
