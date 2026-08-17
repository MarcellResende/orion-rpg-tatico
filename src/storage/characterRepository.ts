import { hydrateCharacter } from '../character'
import type { Character } from '../types'

export const CHARACTER_STORAGE_KEY = 'rpg-tatico.character.v1'

export interface CharacterRepository {
  load(): Character | null
  save(character: Character): void
  clear(): void
}

export const createLocalStorageCharacterRepository = (
  storage: Storage,
): CharacterRepository => ({
  load() {
    const serialized = storage.getItem(CHARACTER_STORAGE_KEY)
    if (!serialized) return null

    try {
      return hydrateCharacter(JSON.parse(serialized) as unknown)
    } catch {
      return null
    }
  },
  save(character) {
    storage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(character))
  },
  clear() {
    storage.removeItem(CHARACTER_STORAGE_KEY)
  },
})
