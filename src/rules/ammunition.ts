import type { Character, InventoryItem } from '../types'
import { availableInventory, findCharacterEquipment } from '../data/expansions'
export const AMMO_FAMILIES = { historical: 'Histórica', 'world-wars': 'Guerras Mundiais / Guerra Fria', contemporary: 'Contemporânea' }
export const carriedItemWeight = (item: InventoryItem) => item.ammoBag ? (item.ammoBag.reloads > 0 ? 1 : .25) : item.weight
export function compatibleBags(character: Character, weapon: InventoryItem) {
  const family = findCharacterEquipment(character, weapon.catalogItemId)?.ammunitionFamily
  return availableInventory(character).filter(item => family && item.ammoBag?.family === family && item.ammoBag.reloads > 0 && item.quantity === 1)
}
export function reloadFromBag(character: Character, weaponId: string, bagId: string): Character {
  const weapon = availableInventory(character).find(item => item.id === weaponId)
  if (!weapon?.weapon || weapon.weapon.ammo >= weapon.weapon.magazineCapacity || !compatibleBags(character, weapon).some(item => item.id === bagId)) return character
  return {...character,inventory:character.inventory.map(item => item.id === weaponId ? {...item,weapon:{...weapon.weapon!,ammo:weapon.weapon!.magazineCapacity}} : item.id === bagId ? {...item,ammoBag:{...item.ammoBag!,reloads:item.ammoBag!.reloads-1}} : item),updatedAt:new Date().toISOString()}
}
