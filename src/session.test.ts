import { describe, expect, it } from 'vitest'
import {
  advanceTurn,
  emptySession,
  hydrateSession,
  parseDice,
  safeImage,
} from './session'
import { ASSASSINS_CREED, AC_MODS } from './data/assassinsCreed'
import { createEmptyCharacter, hydrateCharacter } from './character'
import { setExpansionEnabled } from './data/expansions'
import { calculateInventoryWeight } from './rules/calculations'
describe('sessão e pesos oficiais', () => {
  it('valida fórmulas sem executar código', () => {
    expect(parseDice('2d6-1')).toEqual({ count: 2, sides: 6, modifier: -1 })
    for (const bad of ['alert(1)', '0d20', '99d6', '1d3', '1d20+9999'])
      expect(() => parseDice(bad)).toThrow()
  })
  it('avança turno, roda a ordem e renova somente o próximo combatente', () => {
    const s = emptySession()
    s.combat = {
      active: true,
      round: 3,
      turn: 1,
      entries: ['a', 'b'].map((id) => ({
        id,
        name: id,
        initiative: 1,
        actions: 0,
        secondary: 0,
        half: 0,
        reactions: 0,
        movement: 0,
      })),
    }
    const next = advanceTurn(s)
    expect(next.combat.round).toBe(4)
    expect(next.combat.turn).toBe(0)
    expect(next.combat.entries[0].actions).toBe(1)
    expect(next.combat.entries[1].actions).toBe(0)
  })
  it('hidrata limites e rejeita links executáveis', () => {
    expect(safeImage('javascript:alert(1)')).toBe('')
    const s = hydrateSession({
      combat: { round: -1, turn: 80, entries: [{ name: 'NPC', actions: 999 }] },
      documents: [{ url: 'data:text/html,<script>' }],
    })
    expect(s.combat.round).toBe(0)
    expect(s.combat.turn).toBe(0)
    expect(s.combat.entries[0].actions).toBe(1)
    expect(s.documents[0].url).toBe('')
  })
  it('usa pesos finais de armaduras e customizações, inclusive itens guardados', () => {
    expect(
      ASSASSINS_CREED.equipment.find(
        (e) => e.id === 'assassins-creed:medium-armor',
      )?.weight,
    ).toBe(6.5)
    expect(AC_MODS.find((e) => e.id === 'phantom')?.weight).toBe(0.75)
    expect(AC_MODS.find((e) => e.id === 'quick')?.weight).toBe(0.25)
    let c = setExpansionEnabled(createEmptyCharacter(), 'assassins-creed', true)
    const armor = ASSASSINS_CREED.equipment.find(
      (e) => e.id === 'assassins-creed:exceptional-armor',
    )!
    c.inventory = [
      {
        ...armor,
        catalogItemId: armor.id,
        id: 'armor',
        weight: 0,
        quantity: 1,
        notes: '',
        active: false,
        weapon: undefined,
      },
    ]
    c = hydrateCharacter(c)
    expect(calculateInventoryWeight(c)).toBe(12)
    expect(
      calculateInventoryWeight(
        setExpansionEnabled(c, 'assassins-creed', false),
      ),
    ).toBe(0)
  })
})
