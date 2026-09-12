import { EQUIPMENT_CATALOG } from './equipment'
import { AC_MODS } from './assassinsCreed'
import type { Character, InventoryItem } from '../types'

export const firearmModifiable = (item: InventoryItem) => Boolean(EQUIPMENT_CATALOG.find((entry) => entry.id === item.catalogItemId)?.weapon)
export const bladeModifiable = (item: InventoryItem) => ['assassins-creed:hidden-blade-left', 'assassins-creed:hidden-blade-right'].includes(item.catalogItemId)
export const modificationGroup = (id: string) => id.startsWith('optic-') ? 'optic' : id.startsWith('barrel-') ? 'barrel' : id.startsWith('rail-') ? 'rail' : 'magazine'
export const firearmOptions = EQUIPMENT_CATALOG.filter((item) => item.category === 'weaponModification')
export function installedFirearmMods(item: InventoryItem) {
  if (!firearmModifiable(item)) return []
  const groups = new Set<string>()
  let slots = 0
  return (item.modifications ?? []).flatMap((id) => {
    const definition = firearmOptions.find((entry) => entry.id === id)
    const group = modificationGroup(id)
    if (!definition || groups.has(group) || (group !== 'magazine' && slots >= (item.slot === 'secondary' ? 1 : 3))) return []
    groups.add(group)
    if (group !== 'magazine') slots++
    return [definition]
  })
}
export function itemBladeMods(character: Character, item: InventoryItem) {
  if (!bladeModifiable(item)) return []
  const arm = item.slot === 'leftBlade' ? 'left' : 'right'
  // Older sheets stored one configuration per arm. Assign it only to the first existing blade.
  const legacy = character.inventory.find((entry) => entry.slot === item.slot && bladeModifiable(entry))?.id === item.id
  const ids = item.bladeMods ?? (legacy ? character.assassin.bladeMods[arm] : [])
  const result: typeof AC_MODS = []
  let slots = 0
  for (const id of ids) {
    const mod = AC_MODS.find((entry) => entry.id === id)
    if (!mod || result.some((entry) => entry.id === id) || slots + mod.slots > 2) continue
    if ((id === 'light' && result.some((entry) => ['silent', 'counterweight'].includes(entry.id))) || (['silent', 'counterweight'].includes(id) && result.some((entry) => entry.id === 'light'))) continue
    result.push(mod); slots += mod.slots
  }
  return result
}
export const firearmExtraWeight = (item: InventoryItem) => {
  const mods = installedFirearmMods(item)
  return (mods.reduce((sum, mod) => sum + mod.weight, 0) + (mods.filter((mod) => modificationGroup(mod.id) !== 'magazine').length === 3 ? 1 : 0)) * item.quantity
}
export function inventoryWithModifications(items: InventoryItem[]): InventoryItem[] {
  return items.flatMap((item) => [item, ...installedFirearmMods(item).map((mod) => ({ ...item, id: `${item.id}:${mod.id}`, catalogItemId: mod.id, name: mod.name, category: mod.category, slot: undefined, weapon: undefined, modifications: undefined, weight: mod.weight, effect: mod.effect }))])
}
