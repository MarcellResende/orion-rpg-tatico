import { findEquipment } from '../data/equipment'
import { FUNCTIONS, TRAITS } from '../data/manual'
import { SUBSKILLS } from '../data/subskills'
import {
  ATTRIBUTE_KEYS,
  SKILL_KEYS,
  SUBSKILL_KEYS,
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
  type SubskillKey,
  type Subskills,
} from '../types'

export const ATTRIBUTE_POINT_LIMIT = 6
export const BASE_SKILL_POINTS = 10
export const BASE_DEFENSE = 10

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

const emptySubskills = (): Subskills => Object.fromEntries(
  SUBSKILL_KEYS.map((key) => [key, 0]),
) as Subskills

const sumValues = <T extends string>(keys: readonly T[], values: Record<T, number>) =>
  keys.reduce((total, key) => total + values[key], 0)

export const calculateCharacterBonuses = (character: Character): CharacterBonuses => {
  const attributes = emptyAttributes()
  const skills = emptySkills()
  const subskills = emptySubskills()
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
  for (const key of SUBSKILL_KEYS) {
    subskills[key] += selectedFunction?.subskillBonuses?.[key] ?? 0
  }

  for (const inventoryItem of character.inventory) {
    if (!inventoryItem.active) continue
    const definition = findEquipment(inventoryItem.catalogItemId)
    if (!definition) continue
    for (const key of SKILL_KEYS) {
      skills[key] += definition.skillBonuses?.[key] ?? 0
    }
    const choice = definition.skillBonusChoice
    if (
      choice &&
      inventoryItem.selectedSkillBonus &&
      choice.options.includes(inventoryItem.selectedSkillBonus)
    ) {
      skills[inventoryItem.selectedSkillBonus] += choice.amount
    }
    for (const key of SUBSKILL_KEYS) {
      subskills[key] += definition.subskillBonuses?.[key] ?? 0
    }
  }

  return { attributes, skills, subskills }
}

export const calculateEffectiveAttributes = (character: Character): Attributes => {
  const bonuses = calculateCharacterBonuses(character).attributes
  return Object.fromEntries(
    ATTRIBUTE_KEYS.map((key) => [key, Math.max(0, character.attributes[key] + bonuses[key])]),
  ) as unknown as Attributes
}

export const calculateEffectiveSkills = (character: Character): Skills => {
  const bonuses = calculateCharacterBonuses(character).skills
  return Object.fromEntries(
    SKILL_KEYS.map((key) => [key, Math.max(0, character.skills[key] + bonuses[key])]),
  ) as unknown as Skills
}

export const calculateEffectiveSubskills = (character: Character): Subskills => {
  const bonuses = calculateCharacterBonuses(character).subskills
  return Object.fromEntries(
    SUBSKILL_KEYS.map((key) => [key, Math.max(0, character.subskills[key] + bonuses[key])]),
  ) as unknown as Subskills
}

export const calculateMaxHp = (attributes: Attributes) =>
  20 + attributes.constitution * 10

export const calculateMaxEnergy = (attributes: Attributes) =>
  10 + attributes.dexterity * 5

export const calculateEquipmentDefense = (character: Character) => {
  let armor = 0
  let shield = 0
  for (const item of character.inventory) {
    if (!item.active) continue
    const definition = findEquipment(item.catalogItemId)
    const bonus = definition?.defenseBonus ?? 0
    if (item.slot === 'armor') armor = Math.max(armor, bonus)
    if (item.slot === 'shield') shield = Math.max(shield, bonus)
  }
  return armor + shield
}

export const calculateDefense = (character: Character) =>
  BASE_DEFENSE + calculateEquipmentDefense(character) + character.defenseModifiers.other

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

const specializationRatio = (skillKey: SkillKey) => skillKey === 'combat' ? 2 : 1

export const calculateSubskillPointsAvailable = (character: Character, skillKey: SkillKey) =>
  character.skills[skillKey] * specializationRatio(skillKey)

export const calculateSubskillPointsSpent = (character: Character, skillKey: SkillKey) => {
  const defined = SUBSKILLS
    .filter((definition) => definition.skillKey === skillKey)
    .reduce((total, definition) => total + character.subskills[definition.key], 0)
  const custom = character.specializations
    .filter((specialization) => specialization.skillKey === skillKey)
    .reduce((total, specialization) => total + specialization.value, 0)
  return defined + custom
}

export const calculateDerivedResources = (character: Character): DerivedResources => {
  const attributes = calculateEffectiveAttributes(character)
  const skills = calculateEffectiveSkills(character)
  const defenseEquipment = calculateEquipmentDefense(character)
  const defenseOther = character.defenseModifiers.other
  return {
    maxHp: calculateMaxHp(attributes),
    maxEnergy: calculateMaxEnergy(attributes),
    defense: BASE_DEFENSE + defenseEquipment + defenseOther,
    defenseBase: BASE_DEFENSE,
    defenseEquipment,
    defenseOther,
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

const clampSpecializations = (character: Character): Pick<Character, 'subskills' | 'specializations'> => {
  const subskills = emptySubskills()
  const specializations = character.specializations.map((specialization) => ({
    ...specialization,
    value: 0,
  }))

  for (const skillKey of SKILL_KEYS) {
    let remaining = calculateSubskillPointsAvailable(character, skillKey)
    for (const definition of SUBSKILLS.filter((item) => item.skillKey === skillKey)) {
      subskills[definition.key] = clamp(character.subskills[definition.key], 0, remaining)
      remaining -= subskills[definition.key]
    }
    for (const specialization of specializations.filter((item) => item.skillKey === skillKey)) {
      const original = character.specializations.find((item) => item.id === specialization.id)?.value ?? 0
      specialization.value = clamp(original, 0, remaining)
      remaining -= specialization.value
    }
  }

  return { subskills, specializations }
}

export const applyCharacterLimits = (character: Character): Character => {
  const skills = clampAllocatedSkills(
    character.skills,
    calculateMaxSkillPointsForCharacter(character),
  )
  const withSkills = { ...character, skills }
  const specializationValues = clampSpecializations(withSkills)
  const withSpecializations = { ...withSkills, ...specializationValues }
  return {
    ...withSpecializations,
    resources: clampResources(
      withSpecializations.resources,
      calculateDerivedResources(withSpecializations),
    ),
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
  if (
    step < 0 &&
    calculateSubskillPointsSpent(character, key) > (current - 1) * specializationRatio(key)
  ) {
    return character
  }

  return withClampedResources({
    ...character,
    skills: { ...character.skills, [key]: current + step },
  })
}

export const changeSubskill = (
  character: Character,
  key: SubskillKey,
  delta: number,
): Character => {
  const definition = SUBSKILLS.find((item) => item.key === key)
  const step = Math.sign(delta)
  if (!definition || step === 0) return character
  const current = character.subskills[key]
  if (step < 0 && current === 0) return character
  if (
    step > 0 &&
    calculateSubskillPointsSpent(character, definition.skillKey) >=
      calculateSubskillPointsAvailable(character, definition.skillKey)
  ) return character
  return {
    ...character,
    subskills: { ...character.subskills, [key]: current + step },
  }
}

export const changeCustomSpecialization = (
  character: Character,
  specializationId: string,
  delta: number,
): Character => {
  const target = character.specializations.find((item) => item.id === specializationId)
  const step = Math.sign(delta)
  if (!target || step === 0 || (step < 0 && target.value === 0)) return character
  if (
    step > 0 &&
    calculateSubskillPointsSpent(character, target.skillKey) >=
      calculateSubskillPointsAvailable(character, target.skillKey)
  ) return character
  return {
    ...character,
    specializations: character.specializations.map((item) =>
      item.id === specializationId ? { ...item, value: item.value + step } : item
    ),
  }
}

export const changeDefenseOther = (character: Character, delta: number): Character => ({
  ...character,
  defenseModifiers: {
    ...character.defenseModifiers,
    other: clamp(character.defenseModifiers.other + Math.sign(delta), -20, 20),
  },
})

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

