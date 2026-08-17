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
  schemaVersion: 1
  level: 1
  identity: Identity
  attributes: Attributes
  skills: Skills
  resources: ResourceState
  updatedAt: string
}

export interface FunctionDefinition {
  id: string
  name: string
  description: string
  bonus: string
  exclusiveAbility: string
  sourcePage: number
}

export interface TraitDefinition {
  id: string
  name: string
  profile: string
  advantage: string
  roleplayTrigger: string
  sourcePage: number
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
