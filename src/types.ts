export const ATTRIBUTE_KEYS = [
  'strength',
  'dexterity',
  'intelligence',
  'constitution',
] as const

export const SKILL_KEYS = [
  'combat',
  'communication',
  'piloting',
  'tolerance',
  'exploration',
  'stealth',
  'medicine',
  'technology',
  'willpower',
] as const

export const RESOURCE_KEYS = ['hp', 'energy', 'composure', 'stress'] as const

export const SUBSKILL_KEYS = [
  'longRangeWeapons',
  'mediumRangeWeapons',
  'shortRangeWeapons',
  'artilleryWeapons',
  'melee',
  'intimidation',
  'diplomacy',
  'negotiation',
  'landVehicles',
  'waterVehicles',
  'airVehicles',
  'survival',
  'fortitude',
  'firstAid',
  'warSurgery',
  'mechanics',
  'electronics',
  'equipmentRepair',
] as const

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number]
export type SkillKey = (typeof SKILL_KEYS)[number]
export type ResourceKey = (typeof RESOURCE_KEYS)[number]
export type SubskillKey = (typeof SUBSKILL_KEYS)[number]

export type FunctionChoices = Record<string, AttributeKey | ''>

export interface Identity {
  name: string
  codename: string
  age: number | null
  nationality: string
  functionId: string
  traitId: string
  remorse: string
}

export type Attributes = Record<AttributeKey, number>
export type Skills = Record<SkillKey, number>
export type Subskills = Record<SubskillKey, number>
export type ResourceState = Record<ResourceKey, number>

export type EquipmentSlot = 'primary' | 'secondary' | 'armor' | 'shield'
export type EquipmentCategory =
  | 'primaryWeapon'
  | 'secondaryWeapon'
  | 'recon'
  | 'electronic'
  | 'explosive'
  | 'medical'
  | 'ammunition'
  | 'protection'
  | 'survival'
  | 'custom'

export interface WeaponState {
  ammo: number
  magazineCapacity: number
  spareMagazines: number
  allowedShots: number[]
}

export interface DefenseModifiers {
  other: number
}

export interface CustomSpecialization {
  id: string
  skillKey: SkillKey
  name: string
  value: number
}

export interface Character {
  schemaVersion: 3
  level: 1
  identity: Identity
  functionChoices: FunctionChoices
  attributes: Attributes
  skills: Skills
  subskills: Subskills
  specializations: CustomSpecialization[]
  resources: ResourceState
  defenseModifiers: DefenseModifiers
  inventory: InventoryItem[]
  notes: string
  updatedAt: string
}

export interface InventoryItem {
  id: string
  catalogItemId: string
  name: string
  quantity: number
  weight: number
  notes: string
  category: EquipmentCategory
  effect: string
  active: boolean
  slot?: EquipmentSlot
  selectedSkillBonus?: SkillKey
  weapon?: WeaponState
}

export interface EquipmentDefinition {
  id: string
  name: string
  category: EquipmentCategory
  weight: number
  effect: string
  sourcePage: number
  slot?: EquipmentSlot
  defenseBonus?: number
  skillBonuses?: Partial<Record<SkillKey, number>>
  skillBonusChoice?: {
    amount: number
    options: SkillKey[]
  }
  subskillBonuses?: Partial<Record<SubskillKey, number>>
  weapon?: {
    magazineCapacity: number
    allowedShots: number[]
  }
}

export interface SubskillDefinition {
  key: SubskillKey
  skillKey: SkillKey
  name: string
  description: string
}

export interface AttributeChoiceDefinition {
  id: string
  label: string
  options: AttributeKey[]
}

export interface FunctionDefinition {
  id: string
  name: string
  description: string
  bonus: string
  attributeBonuses?: Partial<Record<AttributeKey, number>>
  attributeChoices?: AttributeChoiceDefinition[]
  skillBonuses?: Partial<Record<SkillKey, number>>
  subskillBonuses?: Partial<Record<SubskillKey, number>>
  exclusiveAbility: string
  sourcePage: number
}

export interface TraitDefinition {
  id: string
  name: string
  profile: string
  advantage: string
  skillBonuses?: Partial<Record<SkillKey, number>>
  roleplayTrigger: string
  sourcePage: number
}

export type ConditionGroup = 'physical' | 'mental' | 'mobility'

export interface ConditionDefinition {
  id: string
  name: string
  group: ConditionGroup
  cause: string
  effect: string
  sourcePage: number
}

export interface CharacterBonuses {
  attributes: Attributes
  skills: Skills
  subskills: Subskills
}

export type EncumbranceLevel =
  | 'normal'
  | 'light'
  | 'moderate'
  | 'heavy'
  | 'severe'
  | 'extreme'
  | 'overMaximum'

export interface LoadState {
  weight: number
  baseLimit: number
  maximumLimit: number
  percentage: number
  level: EncumbranceLevel
  label: string
  description: string
  skillPenalties: Partial<Record<SkillKey, number>>
  energyCostPenalty: number
  movementPenalty: number
  exceedsMaximum: boolean
}

export interface DerivedResources {
  maxHp: number
  maxEnergy: number
  defense: number
  defenseBase: number
  defenseEquipment: number
  defenseOther: number
  maxComposure: number
  maxStress: number
  maxSkillPoints: number
}

export interface IdentityValidation {
  name?: string
  age?: string
}

