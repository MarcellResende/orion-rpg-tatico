import {
  ATTRIBUTE_KEYS,
  SKILL_KEYS,
  SUBSKILL_KEYS,
  type Attributes,
  type Character,
  type CustomSpecialization,
  type EquipmentCategory,
  type EquipmentSlot,
  type ExperienceAward,
  type FunctionChoices,
  type Identity,
  type InventoryItem,
  type ResourceState,
  type Skills,
  type Subskills,
} from './types'
import {
  applyCharacterLimits,
  calculateAttributePointLimitForLevel,
  calculateLevelFromXp,
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

const EMPTY_SUBSKILLS: Subskills = Object.fromEntries(
  SUBSKILL_KEYS.map((key) => [key, 0]),
) as Subskills

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
  schemaVersion: 4,
  level: 1,
  identity: { ...EMPTY_IDENTITY },
  functionChoices: {},
  attributes: { ...EMPTY_ATTRIBUTES },
  skills: { ...EMPTY_SKILLS },
  subskills: { ...EMPTY_SUBSKILLS },
  specializations: [],
  progression: {
    xp: 0,
    generalAbilities: [],
    functionSpecialization: '',
    veteranTraining: '',
    maximumFunctionAbility: '',
    awards: [],
  },
  resources: {
    hp: 20,
    energy: 10,
    composure: 5,
    stress: 0,
  },
  defenseModifiers: { other: 0 },
  inventory: [],
  notes: '',
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

const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  'primaryWeapon',
  'secondaryWeapon',
  'recon',
  'electronic',
  'explosive',
  'medical',
  'ammunition',
  'protection',
  'survival',
  'custom',
]

const EQUIPMENT_SLOTS: EquipmentSlot[] = ['primary', 'secondary', 'armor', 'shield']

const hydrateInventory = (value: unknown): InventoryItem[] => {
  if (!Array.isArray(value)) return []
  return value.slice(0, 100).flatMap((raw, index) => {
    const item = safeObject(raw)
    const name = safeText(item.name, 100).trim()
    if (!name) return []
    const category = typeof item.category === 'string' && EQUIPMENT_CATEGORIES.includes(item.category as EquipmentCategory)
      ? item.category as EquipmentCategory
      : 'custom'
    const slot = typeof item.slot === 'string' && EQUIPMENT_SLOTS.includes(item.slot as EquipmentSlot)
      ? item.slot as EquipmentSlot
      : undefined
    const weaponSource = safeObject(item.weapon)
    const magazineCapacity = clamp(safeNumber(weaponSource.magazineCapacity), 0, 999)
    const allowedShots = Array.isArray(weaponSource.allowedShots)
      ? [...new Set(weaponSource.allowedShots.map((shot) => clamp(safeNumber(shot), 1, 10)))].sort((a, b) => a - b)
      : []
    return [{
      id: safeText(item.id, 100) || `legacy-${index}`,
      catalogItemId: safeText(item.catalogItemId, 100),
      name,
      quantity: clamp(safeNumber(item.quantity, 1), 1, 999),
      weight: safeDecimal(item.weight, 0, 9999),
      notes: safeText(item.notes, 300),
      category,
      effect: safeText(item.effect, 1000),
      active: typeof item.active === 'boolean' ? item.active : true,
      slot,
      selectedSkillBonus:
        typeof item.selectedSkillBonus === 'string' && SKILL_KEYS.includes(item.selectedSkillBonus as never)
          ? item.selectedSkillBonus as InventoryItem['selectedSkillBonus']
          : undefined,
      weapon: magazineCapacity > 0
        ? {
            magazineCapacity,
            ammo: clamp(safeNumber(weaponSource.ammo, magazineCapacity), 0, magazineCapacity),
            spareMagazines: clamp(safeNumber(weaponSource.spareMagazines), 0, 99),
            allowedShots: allowedShots.length > 0 ? allowedShots : [1],
          }
        : undefined,
    }]
  })
}

const hydrateSpecializations = (value: unknown): CustomSpecialization[] => {
  if (!Array.isArray(value)) return []
  return value.slice(0, 50).flatMap((raw, index) => {
    const specialization = safeObject(raw)
    const name = safeText(specialization.name, 80).trim()
    const skillKey = specialization.skillKey
    if (!name || typeof skillKey !== 'string' || !SKILL_KEYS.includes(skillKey as never)) return []
    return [{
      id: safeText(specialization.id, 100) || `specialization-${index}`,
      skillKey: skillKey as CustomSpecialization['skillKey'],
      name,
      value: clamp(safeNumber(specialization.value), 0, 99),
    }]
  })
}

const hydrateExperienceAwards = (value: unknown): ExperienceAward[] => {
  if (!Array.isArray(value)) return []
  return value.slice(0, 50).flatMap((raw, index) => {
    const award = safeObject(raw)
    const amount = clamp(safeNumber(award.amount), -99, 99)
    const reason = safeText(award.reason, 240).trim()
    if (amount === 0 || !reason) return []
    return [{
      id: safeText(award.id, 100) || `legacy-xp-${index}`,
      amount,
      reason,
      createdAt: safeText(award.createdAt, 40) || new Date().toISOString(),
    }]
  })
}

export const hydrateCharacter = (value: unknown): Character => {
  const root = safeObject(value)
  const identitySource = safeObject(root.identity)
  const choicesSource = safeObject(root.functionChoices)
  const attributesSource = safeObject(root.attributes)
  const skillsSource = safeObject(root.skills)
  const subskillsSource = safeObject(root.subskills)
  const resourcesSource = safeObject(root.resources)
  const defenseSource = safeObject(root.defenseModifiers)
  const progressionSource = safeObject(root.progression)
  const xp = clamp(safeNumber(progressionSource.xp ?? root.xp), 0, 9999)
  const level = calculateLevelFromXp(xp)

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

  let remainingAttributes = calculateAttributePointLimitForLevel(level)
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
    schemaVersion: 4,
    level,
    identity,
    functionChoices,
    attributes,
    skills: { ...EMPTY_SKILLS },
    subskills: { ...EMPTY_SUBSKILLS },
    specializations: hydrateSpecializations(root.specializations),
    progression: {
      xp,
      generalAbilities: Array.isArray(progressionSource.generalAbilities)
        ? progressionSource.generalAbilities.slice(0, 4).map((item) => safeText(item, 120))
        : [],
      functionSpecialization: safeText(progressionSource.functionSpecialization, 160),
      veteranTraining: safeText(progressionSource.veteranTraining, 160),
      maximumFunctionAbility: safeText(progressionSource.maximumFunctionAbility, 160),
      awards: hydrateExperienceAwards(progressionSource.awards),
    },
    resources,
    defenseModifiers: {
      other: clamp(safeNumber(defenseSource.other), -20, 20),
    },
    inventory: hydrateInventory(root.inventory),
    notes: safeText(root.notes, 20000),
    updatedAt: safeText(root.updatedAt) || new Date().toISOString(),
  }

  let remainingSkills = calculateMaxSkillPointsForCharacter(character)
  for (const key of SKILL_KEYS) {
    character.skills[key] = clamp(safeNumber(skillsSource[key]), 0, remainingSkills)
    remainingSkills -= character.skills[key]
  }

  for (const key of SUBSKILL_KEYS) {
    character.subskills[key] = clamp(safeNumber(subskillsSource[key]), 0, 99)
  }

  return applyCharacterLimits(character)
}
