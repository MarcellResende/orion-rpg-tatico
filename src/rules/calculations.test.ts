import { describe, expect, it } from 'vitest'
import { createEmptyCharacter } from '../character'
import {
  calculateAttributePointsSpent,
  calculateCharacterBonuses,
  calculateDerivedResources,
  calculateEffectiveAttributes,
  calculateEffectiveSkills,
  calculateInventoryWeight,
  calculateMaxComposure,
  calculateMaxEnergy,
  calculateMaxHp,
  calculateMaxSkillPoints,
  calculateSkillPointsSpent,
  changeAttribute,
  changeResource,
  changeSkill,
  validateIdentity,
} from './calculations'

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
      { id: 'a', name: 'Granada', quantity: 2, weight: 0.5, notes: '' },
      { id: 'b', name: 'Kit', quantity: 1, weight: 3, notes: '' },
    ]
    expect(calculateInventoryWeight(character)).toBe(4)
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
