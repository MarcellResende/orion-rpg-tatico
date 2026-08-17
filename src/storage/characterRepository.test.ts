import { describe, expect, it } from 'vitest'
import { createEmptyCharacter } from '../character'
import {
  CHARACTER_STORAGE_KEY,
  createLocalStorageCharacterRepository,
} from './characterRepository'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('repositório local da ficha', () => {
  it('salva e restaura a ficha usando a chave versionada', () => {
    const storage = new MemoryStorage()
    const repository = createLocalStorageCharacterRepository(storage)
    const character = createEmptyCharacter()
    character.identity.name = 'Chloe Vance'
    character.attributes.constitution = 2
    character.resources.hp = 37

    repository.save(character)

    expect(storage.getItem(CHARACTER_STORAGE_KEY)).not.toBeNull()
    expect(repository.load()?.identity.name).toBe('Chloe Vance')
    expect(repository.load()?.resources.hp).toBe(37)
  })

  it('remove os dados ao criar uma nova ficha', () => {
    const storage = new MemoryStorage()
    const repository = createLocalStorageCharacterRepository(storage)
    repository.save(createEmptyCharacter())
    repository.clear()
    expect(repository.load()).toBeNull()
  })

  it('recupera com segurança um armazenamento corrompido', () => {
    const storage = new MemoryStorage()
    storage.setItem(CHARACTER_STORAGE_KEY, '{não é json')
    const repository = createLocalStorageCharacterRepository(storage)
    expect(repository.load()).toBeNull()
  })
})
