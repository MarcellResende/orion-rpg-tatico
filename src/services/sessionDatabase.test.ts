import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
const db = new PGlite()
const master = '00000000-0000-0000-0000-000000000001',
  player = '00000000-0000-0000-0000-000000000002',
  stranger = '00000000-0000-0000-0000-000000000003',
  campaign = '10000000-0000-0000-0000-000000000001',
  character = '20000000-0000-0000-0000-000000000001'
const login = async (id: string) => {
  await db.exec(
    `reset role; select set_config('request.jwt.claim.sub','${id}',false); set role authenticated;`,
  )
}
beforeAll(async () => {
  await db.exec(
    `create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to authenticated; create publication supabase_realtime;`,
  )
  for (const name of [
    '001_online_campaigns.sql',
    '002_secure_conditions.sql',
    '003_manual_v1_1.sql',
    '004_duplicate_campaign.sql',
    '005_session_platform.sql',
  ])
    await db.exec(readFileSync(`supabase/migrations/${name}`, 'utf8'))
  await db.exec(
    `insert into auth.users values('${master}'),('${player}'),('${stranger}');insert into campaigns(id,name,invite_code,created_by) values('${campaign}','Mesa','1234ABCD','${master}');insert into campaign_members(campaign_id,user_id,role) values('${campaign}','${master}','master'),('${campaign}','${player}','player'); insert into characters(id,campaign_id,owner_id,sheet)values('${character}','${campaign}','${player}','{"identity":{"name":"Teste"},"resources":{"hp":20}}');`,
  )
}, 60000)
afterAll(() => db.close())
describe('permissões reais no PostgreSQL', () => {
  it('mestre salva com revisão; versão antiga é rejeitada', async () => {
    await login(master)
    await db.query('select save_campaign_session($1,0,$2)', [
      campaign,
      { combat: { round: 1, entries: [] } },
    ])
    await expect(
      db.query('select save_campaign_session($1,0,$2)', [campaign, {}]),
    ).rejects.toThrow('outra tela')
  })
  it('jogador pode rolar, mas não gerenciar sessão, notas privadas ou alterar histórico', async () => {
    await login(master)
    await db.query(
      'insert into campaign_master_notes(campaign_id,notes) values($1,$2)',
      [campaign, 'segredo'],
    )
    await login(player)
    expect(
      (await db.query('select * from campaign_master_notes')).rows,
    ).toHaveLength(0)
    await expect(
      db.query('select save_campaign_session($1,1,$2)', [campaign, {}]),
    ).rejects.toThrow('Mestre')
    const r = await db.query<{ roll_campaign_dice: { total: number } }>(
      'select roll_campaign_dice($1,1,20,5,$2)',
      [campaign, 'teste'],
    )
    expect(r.rows[0].roll_campaign_dice.total).toBeGreaterThanOrEqual(6)
    await expect(db.exec('delete from campaign_events')).rejects.toThrow()
  })
  it('isola outra campanha e audita alterações de ficha com autor do servidor', async () => {
    await login(player)
    await db.query('update characters set sheet=$1 where id=$2', [
      { identity: { name: 'Teste' }, resources: { hp: 15 } },
      character,
    ])
    expect(
      (await db.query("select * from campaign_events where kind='sheet'")).rows,
    ).toHaveLength(1)
    await login(stranger)
    expect((await db.query('select * from campaign_events')).rows).toHaveLength(
      0,
    )
    await expect(
      db.query('select roll_campaign_dice($1,1,20,0,$2)', [
        campaign,
        'intruso',
      ]),
    ).rejects.toThrow('Acesso negado')
  })
  it('impede que jogador injete ajuste do Mestre', async () => {
    await login(player)
    await db.query('update characters set sheet=sheet||$1::jsonb where id=$2', [
      { masterAdjustments: { hp: 999 } },
      character,
    ])
    const r = await db.query<{ sheet: Record<string, unknown> }>(
      'select sheet from characters where id=$1',
      [character],
    )
    expect(r.rows[0].sheet.masterAdjustments).toBeUndefined()
  })
  it('expira condições na rodada e mantém o evento registrado', async () => {
    await login(master)
    await db.query(
      'insert into character_conditions(character_id,condition_id,expires_round) values($1,$2,2)',
      [character, 'stunned'],
    )
    await db.query('select save_campaign_session($1,1,$2)', [
      campaign,
      { combat: { round: 2 } },
    ])
    expect(
      (await db.query('select * from character_conditions')).rows,
    ).toHaveLength(0)
    expect(
      (await db.query("select * from campaign_events where kind='condition'"))
        .rows,
    ).toHaveLength(2)
  })
  it('aplica Sangrando e Atordoado uma vez ao entrar no turno', async () => {
    await login(master)
    await db.query(
      'insert into character_conditions(character_id,condition_id) values($1,$2),($1,$3)',
      [character, 'bleeding', 'stunned'],
    )
    const state = {
      combat: {
        round: 3,
        turn: 0,
        active: true,
        entries: [{ id: character, actions: 1, reactions: 1, movement: 9 }],
      },
    }
    await db.query('select save_campaign_session($1,2,$2)', [campaign, state])
    const saved = (
      await db.query<{ state: typeof state }>(
        'select state from campaign_sessions',
      )
    ).rows[0].state
    expect(saved.combat.entries[0].actions).toBe(0)
    await db.query('select save_campaign_session($1,3,$2)', [campaign, saved])
    expect(
      (
        await db.query<{ sheet: { resources: { hp: number } } }>(
          'select sheet from characters where id=$1',
          [character],
        )
      ).rows[0].sheet.resources.hp,
    ).toBe(11)
    expect(
      (
        await db.query(
          "select * from character_conditions where condition_id='stunned'",
        )
      ).rows,
    ).toHaveLength(0)
  })
  it('restaura de forma atômica, preserva histórico e rejeita participantes estranhos', async () => {
    await login(master)
    const backup = {
      format: 'orion-campaign',
      version: 1,
      campaignId: campaign,
      campaign: { name: 'Restaurada', description: '', progression: {} },
      session: { notes: 'restaurada' },
      characters: [
        {
          ownerId: player,
          sheet: { identity: { name: 'Restaurado' }, resources: { hp: 10 } },
          conditions: [],
        },
      ],
    }
    const before = (await db.query('select * from campaign_events')).rows.length
    await expect(
      db.query('select restore_campaign_backup($1,$2)', [
        campaign,
        {
          ...backup,
          characters: [...backup.characters, { ownerId: stranger, sheet: {} }],
        },
      ]),
    ).rejects.toThrow('Participante')
    expect(
      (
        await db.query<{ sheet: { resources: { hp: number } } }>(
          'select sheet from characters where id=$1',
          [character],
        )
      ).rows[0].sheet.resources.hp,
    ).toBe(11)
    await db.query('select restore_campaign_backup($1,$2)', [campaign, backup])
    expect(
      (await db.query('select * from campaign_events')).rows.length,
    ).toBeGreaterThan(before)
    expect(
      (
        await db.query<{ name: string }>(
          'select name from campaigns where id=$1',
          [campaign],
        )
      ).rows[0].name,
    ).toBe('Restaurada')
    await expect(
      db.query('select restore_campaign_backup($1,$2)', [campaign, {}]),
    ).rejects.toThrow('Backup inválido')
    await login(player)
    await expect(
      db.query('select restore_campaign_backup($1,$2)', [campaign, backup]),
    ).rejects.toThrow('Mestre')
  })
})
