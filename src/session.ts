import { hydrateCharacter } from './character'
import type { OnlineCharacter } from './onlineTypes'

export type Combatant = {
  id: string
  name: string
  initiative: number
  actions: number
  secondary: number
  half: number
  reactions: number
  movement: number
}
export type Mission = {
  id: string
  name: string
  primary: string
  secondary: string
  rewards: string
  status: 'planned' | 'active' | 'completed' | 'failed'
}
export interface SessionState {
  combat: { round: number; turn: number; active: boolean; entries: Combatant[] }
  missions: Mission[]
  notes: string
  documents: { id: string; name: string; url: string }[]
  sync: { id: string; region: string; discoveries: string; used: boolean }[]
  notices: { id: string; message: string; recipient: string }[]
}
export const emptySession = (): SessionState => ({
  combat: { round: 0, turn: 0, active: false, entries: [] },
  missions: [],
  notes: '',
  documents: [],
  sync: [],
  notices: [],
})
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
const text = (v: unknown, max = 300) =>
  typeof v === 'string' ? v.slice(0, max) : ''
const num = (v: unknown, max: number) =>
  typeof v === 'number' && Number.isFinite(v)
    ? Math.max(0, Math.min(max, Math.trunc(v)))
    : 0
const rows = (v: unknown, max = 100) =>
  Array.isArray(v) ? v.slice(0, max).map(obj) : []
export const safeImage = (v: unknown) =>
  /^https:\/\//.test(text(v, 2000)) ? text(v, 2000) : ''
export function hydrateSession(value: unknown): SessionState {
  const v = obj(value),
    combat = obj(v.combat)
  const entries = rows(combat.entries).map((e) => ({
    id: text(e.id, 100),
    name: text(e.name, 100),
    initiative:
      typeof e.initiative === 'number' && Number.isFinite(e.initiative)
        ? Math.max(-999, Math.min(999, e.initiative))
        : 0,
    actions: num(e.actions, 1),
    secondary: num(e.secondary, 1),
    half: num(e.half, 2),
    reactions: num(e.reactions, 2),
    movement: num(e.movement, 99),
  }))
  return {
    combat: {
      round: num(combat.round, 9999),
      turn: Math.min(num(combat.turn, 100), Math.max(0, entries.length - 1)),
      active: combat.active === true,
      entries,
    },
    notes: text(v.notes, 50000),
    missions: rows(v.missions).map((e) => ({
      id: text(e.id),
      name: text(e.name),
      primary: text(e.primary, 4000),
      secondary: text(e.secondary, 4000),
      rewards: text(e.rewards, 2000),
      status: ['active', 'completed', 'failed'].includes(String(e.status))
        ? (e.status as Mission['status'])
        : 'planned',
    })),
    documents: rows(v.documents).map((e) => ({
      id: text(e.id),
      name: text(e.name),
      url: safeImage(e.url),
    })),
    sync: rows(v.sync).map((e) => ({
      id: text(e.id),
      region: text(e.region),
      discoveries: text(e.discoveries, 4000),
      used: e.used === true,
    })),
    notices: rows(v.notices, 30).map((e) => ({
      id: text(e.id),
      message: text(e.message, 1000),
      recipient: text(e.recipient),
    })),
  }
}
export function advanceTurn(state: SessionState): SessionState {
  const c = state.combat
  if (!c.entries.length) return state
  const turn = (c.turn + 1) % c.entries.length
  return {
    ...state,
    combat: {
      ...c,
      active: true,
      turn,
      round: c.round + (turn === 0 ? 1 : 0),
      entries: c.entries.map((e, i) =>
        i === turn
          ? {
              ...e,
              actions: 1,
              secondary: 1,
              half: 2,
              reactions: 1,
              movement: 9,
            }
          : e,
      ),
    },
  }
}
export function parseDice(formula: string) {
  const match = /^(\d{1,2})d(4|6|8|10|12|20|100)([+-]\d{1,3})?$/.exec(
    formula.replace(/\s/g, '').toLowerCase(),
  )
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 20)
    throw new Error('Use de 1 a 20 dados: por exemplo 1d20+5 ou 2d6-1.')
  return {
    count: Number(match[1]),
    sides: Number(match[2]),
    modifier: Number(match[3] ?? 0),
  }
}
export function downloadJson(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export async function readBackup(
  file: File,
  format: string,
): Promise<Record<string, unknown>> {
  if (file.size > 15_000_000) throw new Error('Backup excede 15 MB.')
  const v = obj(JSON.parse(await file.text()))
  if (v.format !== format || v.version !== 1)
    throw new Error('Formato ou versão de backup não reconhecidos.')
  if (format === 'orion-sheet') {
    if (!obj(v.sheet).identity || !obj(v.sheet).resources)
      throw new Error('Ficha incompleta no backup.')
    return { ...v, sheet: hydrateCharacter(v.sheet) }
  }
  if (
    !Array.isArray(v.characters) ||
    v.characters.length > 100 ||
    !obj(v.campaign).name
  )
    throw new Error('Backup de campanha incompleto.')
  return {
    ...v,
    session: hydrateSession(v.session),
    characters: v.characters.map((raw) => {
      const e = obj(raw)
      if (typeof e.ownerId !== 'string' || !obj(e.sheet).identity)
        throw new Error('Participante inválido.')
      return {
        ...e,
        sheet: hydrateCharacter(e.sheet),
      } as unknown as OnlineCharacter
    }),
  }
}
