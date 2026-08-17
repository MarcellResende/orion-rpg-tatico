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

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number]
export type SkillKey = (typeof SKILL_KEYS)[number]
export type ResourceKey = (typeof RESOURCE_KEYS)[number]

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
export type ResourceState = Record<ResourceKey, number>

export interface Character {
  schemaVersion: 2
  level: 1
  identity: Identity
  functionChoices: FunctionChoices
  attributes: Attributes
  skills: Skills
  resources: ResourceState
  inventory: InventoryItem[]
  updatedAt: string
}

export interface InventoryItem {
  id: string
  name: string
  quantity: number
  weight: number
  notes: string
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
}

export interface DerivedResources {
  maxHp: number
  maxEnergy: number
  defense: number
  maxComposure: number
  maxStress: number
  maxSkillPoints: number
}

export interface IdentityValidation {
  name?: string
  age?: string
}
