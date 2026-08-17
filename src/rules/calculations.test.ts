import { describe, expect, it } from 'vitest'
import { createEmptyCharacter } from '../character'
import { findEquipment } from '../data/equipment'
import {
  calculateAttributePointsSpent,
  calculateBaseLoadLimit,
  calculateCharacterBonuses,
  calculateDerivedResources,
  calculateEffectiveAttributes,
  calculateEffectiveSkills,
  calculateInventoryWeight,
  calculateLoadState,
  calculateMaxComposure,
  calculateMaxEnergy,
  calculateMaxHp,
  calculateMaxSkillPoints,
  calculateSkillPointsSpent,
  calculateSubskillPointsAvailable,
  calculateSubskillPointsSpent,
  changeAttribute,
  changeResource,
  changeSkill,
  changeSubskill,
  validateIdentity,
} from './calculations'
import type { InventoryItem } from '../types'

const catalogInventoryItem = (catalogItemId: string, active = true): InventoryItem => {
  const definition = findEquipment(catalogItemId)
  if (!definition) throw new Error(`Item de teste ausente: ${catalogItemId}`)
  return {
    id: `test-${catalogItemId}`,
    catalogItemId,
    name: definition.name,
    quantity: 1,
    weight: definition.weight,
    notes: '',
    category: definition.category,
    effect: definition.effect,
    active,
    slot: definition.slot,
  }
}

describe('cálculos do manual', () => {
  it('calcula 40 PV para Constituição 2', () => {
    const character = createEmptyCharacter()
    character.attributes.constitution = 2
    expect(calculateMaxHp(character.attributes)).toBe(40)
  })

  it('calcula 15 de Energia para Destreza 1', () => {
    const character = createEmptyCharacter()
    character.attributes.dexterity = 1
    expect(calculateMaxEnergy(character.attributes)).toBe(15)
  })

  it('calcula Compostura como 5 + Vontade + Inteligência', () => {
    const character = createEmptyCharacter()
    character.attributes.intelligence = 2
    character.skills.willpower = 3
    expect(calculateMaxComposure(character.attributes, character.skills)).toBe(10)
  })

  it('aumenta a reserva de perícias com Inteligência', () => {
    const character = createEmptyCharacter()
    character.attributes.intelligence = 3
    expect(calculateMaxSkillPoints(character.attributes)).toBe(13)
  })
})

describe('bônus automáticos sem consumir pontos', () => {
  it('aplica os bônus de Médico em atributos, perícia e recursos', () => {
    const character = createEmptyCharacter()
    character.identity.functionId = 'medic'

    expect(calculateEffectiveAttributes(character)).toMatchObject({
      dexterity: 1,
      intelligence: 1,
    })
    expect(calculateEffectiveSkills(character).medicine).toBe(2)
    expect(calculateAttributePointsSpent(character.attributes)).toBe(0)
    expect(calculateSkillPointsSpent(character.skills)).toBe(0)
    expect(calculateDerivedResources(character)).toMatchObject({
      maxEnergy: 15,
      maxSkillPoints: 11,
    })
  })

  it('aplica as duas escolhas de atributo da Infantaria', () => {
    const character = createEmptyCharacter()
    character.identity.functionId = 'infantry'
    character.functionChoices = {
      infantry_tactical: 'intelligence',
      infantry_physical: 'constitution',
    }

    const bonuses = calculateCharacterBonuses(character)
    expect(bonuses.attributes.intelligence).toBe(1)
    expect(bonuses.attributes.constitution).toBe(1)
    expect(bonuses.skills.combat).toBe(2)
    expect(calculateAttributePointsSpent(character.attributes)).toBe(0)
  })

  it('mostra bônus situacional de traço separado dos pontos distribuídos', () => {
    const character = createEmptyCharacter()
    character.identity.traitId = 'calculating'
    expect(calculateEffectiveSkills(character).exploration).toBe(2)
    expect(calculateSkillPointsSpent(character.skills)).toBe(0)
  })

  it('soma quantidade e peso unitário do inventário', () => {
    const character = createEmptyCharacter()
    character.inventory = [
      { id: 'a', catalogItemId: '', name: 'Granada', quantity: 2, weight: 0.5, notes: '', category: 'custom', effect: '', active: true },
      { id: 'b', catalogItemId: '', name: 'Kit', quantity: 1, weight: 3, notes: '', category: 'custom', effect: '', active: true },
    ]
    expect(calculateInventoryWeight(character)).toBe(4)
  })

  it('aplica bônus gratuito de perícia somente quando o equipamento está em uso', () => {
    const character = createEmptyCharacter()
    character.inventory = [catalogInventoryItem('ifak')]
    expect(calculateEffectiveSkills(character).medicine).toBe(2)
    expect(calculateSkillPointsSpent(character.skills)).toBe(0)

    character.inventory[0].active = false
    expect(calculateEffectiveSkills(character).medicine).toBe(0)
  })

  it('soma a proteção equipada à Defesa sem alterar a base', () => {
    const character = createEmptyCharacter()
    character.inventory = [
      catalogInventoryItem('light-tactical-vest'),
      catalogInventoryItem('ballistic-shield'),
    ]
    expect(calculateDerivedResources(character)).toMatchObject({
      defenseBase: 10,
      defenseEquipment: 10,
      defense: 20,
    })

    character.inventory[1].active = false
    expect(calculateDerivedResources(character).defense).toBe(15)
  })

  it('mantém bônus de Artilharia na subperícia sem gastar pontos', () => {
    const character = createEmptyCharacter()
    character.identity.functionId = 'artillery'
    expect(calculateCharacterBonuses(character).subskills.artilleryWeapons).toBe(3)
    expect(calculateSubskillPointsSpent(character, 'combat')).toBe(0)
  })

  it('usa o total da perícia, incluindo bônus gratuito, na reserva de subperícias', () => {
    const character = createEmptyCharacter()
    character.skills.technology = 6
    character.inventory = [catalogInventoryItem('invasion-tools')]

    expect(calculateEffectiveSkills(character).technology).toBe(8)
    expect(calculateSubskillPointsAvailable(character, 'technology')).toBe(8)
  })

  it('aplica também o bônus gratuito no total dobrado das subperícias de Combate', () => {
    const character = createEmptyCharacter()
    character.skills.combat = 1
    character.identity.functionId = 'infantry'

    expect(calculateEffectiveSkills(character).combat).toBe(3)
    expect(calculateSubskillPointsAvailable(character, 'combat')).toBe(6)
  })
})

describe('carga e sobrecarga', () => {
  it('combina Tolerância total e Força total no limite de carga base', () => {
    const character = createEmptyCharacter()
    character.skills.tolerance = 2
    character.attributes.strength = 1
    expect(calculateBaseLoadLimit(character)).toBe(30)
  })

  it('classifica a carga de 100% até 200% e aplica as desvantagens do manual', () => {
    const character = createEmptyCharacter()
    character.skills.stealth = 6
    character.inventory = [
      { id: 'load', catalogItemId: '', name: 'Carga', quantity: 1, weight: 18, notes: '', category: 'custom', effect: '', active: true },
    ]

    const load = calculateLoadState(character)
    expect(load.percentage).toBe(120)
    expect(load.level).toBe('moderate')
    expect(load.skillPenalties).toEqual({ stealth: -4, tolerance: -2 })
    expect(calculateEffectiveSkills(character).stealth).toBe(2)
  })

  it('marca 200% como sobrecarga extrema e mais de 200% como inválido', () => {
    const character = createEmptyCharacter()
    character.inventory = [
      { id: 'load', catalogItemId: '', name: 'Carga', quantity: 1, weight: 30, notes: '', category: 'custom', effect: '', active: true },
    ]
    expect(calculateLoadState(character)).toMatchObject({ level: 'extreme', percentage: 200, exceedsMaximum: false })

    character.inventory[0].weight = 31
    expect(calculateLoadState(character)).toMatchObject({ level: 'overMaximum', exceedsMaximum: true })
  })
})

describe('limites de criação', () => {
  it('não permite gastar mais de seis pontos de atributo', () => {
    let character = createEmptyCharacter()
    for (let index = 0; index < 7; index += 1) {
      character = changeAttribute(character, 'constitution', 1)
    }
    expect(calculateAttributePointsSpent(character.attributes)).toBe(6)
    expect(character.attributes.constitution).toBe(6)
  })

  it('não permite gastar mais pontos de perícia do que o disponível', () => {
    let character = createEmptyCharacter()
    for (let index = 0; index < 12; index += 1) {
      character = changeSkill(character, 'combat', 1)
    }
    expect(calculateSkillPointsSpent(character.skills)).toBe(10)
    expect(character.skills.combat).toBe(10)
  })

  it('impede reduzir Inteligência quando os pontos gastos ficariam inválidos', () => {
    let character = createEmptyCharacter()
    character = changeAttribute(character, 'intelligence', 1)
    for (let index = 0; index < 11; index += 1) {
      character = changeSkill(character, 'technology', 1)
    }
    const result = changeAttribute(character, 'intelligence', -1)
    expect(result.attributes.intelligence).toBe(1)
  })

  it('gera dois pontos de subperícia por ponto distribuído em Combate', () => {
    let character = createEmptyCharacter()
    character = changeSkill(character, 'combat', 1)
    expect(calculateSubskillPointsAvailable(character, 'combat')).toBe(2)

    character = changeSubskill(character, 'mediumRangeWeapons', 1)
    character = changeSubskill(character, 'shortRangeWeapons', 1)
    character = changeSubskill(character, 'melee', 1)
    expect(calculateSubskillPointsSpent(character, 'combat')).toBe(2)
    expect(character.subskills.melee).toBe(0)
    expect(changeSkill(character, 'combat', -1)).toBe(character)
  })
})

describe('recursos atuais e validação', () => {
  it('limita recursos entre zero e o máximo', () => {
    let character = createEmptyCharacter()
    character = changeResource(character, 'hp', -100)
    character = changeResource(character, 'energy', 100)
    character = changeResource(character, 'stress', 100)
    expect(character.resources.hp).toBe(0)
    expect(character.resources.energy).toBe(10)
    expect(character.resources.stress).toBe(6)
  })

  it('reduz o recurso atual quando o máximo diminui', () => {
    let character = createEmptyCharacter()
    character = changeAttribute(character, 'constitution', 1)
    character.resources.hp = 30
    character = changeAttribute(character, 'constitution', -1)
    expect(character.resources.hp).toBe(20)
  })

  it('informa a idade mínima e o nome obrigatório', () => {
    const character = createEmptyCharacter()
    character.identity.age = 22
    expect(validateIdentity(character)).toEqual({
      name: 'Informe o nome do operador.',
      age: 'O manual exige idade mínima de 23 anos.',
    })
  })
})

