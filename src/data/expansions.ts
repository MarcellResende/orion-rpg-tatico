import type { AttributeKey, Character, EquipmentDefinition, InventoryItem, SkillKey } from '../types'
import { EQUIPMENT_CATALOG } from './equipment'
import { AC_ID, ASSASSINS_CREED } from './assassinsCreed'

export interface ExpansionModifiers {
  attributes?: Partial<Record<AttributeKey, number>>
  skills?: Partial<Record<SkillKey, number>>
  maxHp?: number
  maxEnergy?: number
  defense?: number
  loadLimit?: number
}

export interface ExpansionDefinition {
  id: string
  name: string
  version: string
  description: string
  source: string
  /** Separate allocation budget defined by the expansion, never invented from the base book. */
  attributePoints: number
  attributes: { id: string; name: string; description: string; maximum: number; perPoint?: ExpansionModifiers }[]
  rules: { id: string; name: string; text: string; sourcePage: number; modifiers?: ExpansionModifiers }[]
  equipment: EquipmentDefinition[]
}

// Only register real PDFs explicitly identified by the user as expansions.
export const EXPANSIONS: ExpansionDefinition[] = [ASSASSINS_CREED]

export const activeExpansions = (character: Character) =>
  EXPANSIONS.filter((entry) => character.expansions.enabledIds.includes(entry.id))

export const expansionAttributeKey = (expansionId: string, attributeId: string) => `${expansionId}:${attributeId}`

export const expansionAttributeValue = (character: Character, expansionId: string, attributeId: string) =>
  character.expansions.attributeValues[expansionAttributeKey(expansionId, attributeId)] ?? 0

export const expansionPointsSpent = (character: Character, expansion: ExpansionDefinition) =>
  expansion.attributes.reduce((sum, attribute) => sum + expansionAttributeValue(character, expansion.id, attribute.id), 0)

export function changeExpansionAttribute(character: Character, expansionId: string, attributeId: string, delta: number): Character {
  const expansion = activeExpansions(character).find((entry) => entry.id === expansionId)
  const attribute = expansion?.attributes.find((entry) => entry.id === attributeId)
  if (!expansion || !attribute || !Number.isFinite(delta)) return character
  const current = expansionAttributeValue(character, expansionId, attributeId)
  const next = current + Math.sign(delta)
  if (next < 0 || next > attribute.maximum || (next > current && expansionPointsSpent(character, expansion) >= expansion.attributePoints)) return character
  return { ...character, expansions: { ...character.expansions, attributeValues: {
    ...character.expansions.attributeValues, [expansionAttributeKey(expansionId, attributeId)]: next,
  } } }
}

export function setExpansionEnabled(character: Character, id: string, enabled: boolean): Character {
  if (!EXPANSIONS.some((entry) => entry.id === id)) return character
  const enabledIds = character.expansions.enabledIds.filter((entry) => entry !== id)
  if (enabled) enabledIds.push(id)
  const nextCharacter = { ...character, expansions: { ...character.expansions, enabledIds } }
  const occupiedSlots = new Set(availableInventory(nextCharacter).filter((item) => equipmentExpansionId(item) !== id && item.active && item.slot).map((item) => item.slot))
  const inventory = enabled && !character.expansions.enabledIds.includes(id)
    ? character.inventory.map((item) => {
        if (equipmentExpansionId(item) !== id || !item.active || !item.slot) return item
        if (occupiedSlots.has(item.slot)) return { ...item, active: false }
        occupiedSlots.add(item.slot)
        return item
      })
    : character.inventory
  return { ...character, inventory, expansions: { ...character.expansions, enabledIds } }
}

export const equipmentExpansionId = (item: InventoryItem) => item.expansionId ??
  EXPANSIONS.find((entry) => entry.equipment.some((definition) => definition.id === item.catalogItemId))?.id

export const availableInventory = (character: Character) => character.inventory.filter((item) => {
  const id = equipmentExpansionId(item)
  if (!id && character.expansions.enabledIds.includes(AC_ID) && ['armor', 'shield'].includes(item.slot ?? '')) return false
  return !id || activeExpansions(character).some((entry) => entry.id === id)
})

export const availableEquipment = (character: Character) => [
  ...EQUIPMENT_CATALOG.filter((item) => !character.expansions.enabledIds.includes(AC_ID) || !['armor', 'shield'].includes(item.slot ?? '')), ...activeExpansions(character).flatMap((entry) => entry.equipment),
]

export const findCharacterEquipment = (character: Character, id: string) => {
  const definition = availableEquipment(character).find((entry) => entry.id === id)
  if (!definition || !character.expansions.enabledIds.includes(AC_ID)) return definition
  const damage = id === 'tactical-pistol' ? '1d10' : id === 'assault-rifle' ? '2d6' : undefined
  return damage ? { ...definition, effect: definition.effect.replace(/Dano 1d\d+/, `Dano ${damage}`) + ' Dano conforme pacote Contemporâneo da expansão; disponibilidade depende da era.' } : definition
}

export function expansionModifiers(character: Character): Required<ExpansionModifiers> {
  const result: Required<ExpansionModifiers> = { attributes: {}, skills: {}, maxHp: 0, maxEnergy: 0, defense: 0, loadLimit: 0 }
  const add = (modifiers: ExpansionModifiers | undefined, multiplier = 1) => {
    if (!modifiers) return
    for (const key of ['maxHp', 'maxEnergy', 'defense', 'loadLimit'] as const) result[key] += (modifiers[key] ?? 0) * multiplier
    for (const [key, value] of Object.entries(modifiers.attributes ?? {})) result.attributes[key as AttributeKey] = (result.attributes[key as AttributeKey] ?? 0) + value * multiplier
    for (const [key, value] of Object.entries(modifiers.skills ?? {})) result.skills[key as SkillKey] = (result.skills[key as SkillKey] ?? 0) + value * multiplier
  }
  for (const expansion of activeExpansions(character)) {
    expansion.rules.forEach((rule) => add(rule.modifiers))
    expansion.attributes.forEach((attribute) => add(attribute.perPoint, expansionAttributeValue(character, expansion.id, attribute.id)))
  }
  return result
}

export function hydrateExpansions(value: unknown): Character['expansions'] {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const enabledIds = Array.isArray(source.enabledIds)
    ? [...new Set(source.enabledIds.filter((id): id is string => typeof id === 'string' && /^[a-z0-9-]{1,80}$/.test(id)))].slice(0, 100) : []
  const values = source.attributeValues && typeof source.attributeValues === 'object' ? source.attributeValues : {}
  const attributeValues: Record<string, number> = Object.fromEntries(Object.entries(values).slice(0, 500)
    .filter(([key, amount]) => /^[a-z0-9-]+:[a-z0-9-]+$/.test(key) && typeof amount === 'number' && Number.isFinite(amount))
    .map(([key, amount]) => [key, Math.max(0, Math.min(999, Math.floor(amount)))]))
  for (const expansion of EXPANSIONS) {
    let remaining = expansion.attributePoints
    for (const attribute of expansion.attributes) {
      const key = expansionAttributeKey(expansion.id, attribute.id)
      attributeValues[key] = Math.min(attributeValues[key] ?? 0, attribute.maximum, remaining)
      remaining -= attributeValues[key]
    }
  }
  return { enabledIds, attributeValues }
}
