import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CampaignLobby } from '../screens/CampaignLobby'
import { EMPTY_CAMPAIGN_PROGRESSION, type CampaignSummary } from '../onlineTypes'
import { deleteCampaign } from './campaignService'

const db = vi.hoisted(() => ({ from: vi.fn(), delete: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn() }))
vi.mock('../lib/supabase', () => ({ requireSupabase: () => db }))
const campaign = (role: 'master' | 'player'): CampaignSummary => ({ id: 'target-campaign', name: 'Teste', description: '', inviteCode: '12345678', role, createdAt: '', progression: EMPTY_CAMPAIGN_PROGRESSION })
describe('exclusão de campanha', () => {
  it('recusa jogador antes de enviar qualquer exclusão', async () => {
    db.from.mockClear()
    await expect(deleteCampaign(campaign('player'))).rejects.toThrow('Somente o mestre')
    expect(db.from).not.toHaveBeenCalled()
  })
  it('exclui somente o ID escolhido e exige confirmação do banco', async () => {
    db.from.mockReturnValue(db); db.delete.mockReturnValue(db); db.eq.mockReturnValue(db); db.select.mockReturnValue(db)
    db.single.mockResolvedValue({ data: { id: 'target-campaign' }, error: null })
    await deleteCampaign(campaign('master'))
    expect(db.from).toHaveBeenCalledWith('campaigns')
    expect(db.eq).toHaveBeenCalledWith('id', 'target-campaign')
    db.single.mockResolvedValue({ data: null, error: { message: 'RLS denied' } })
    await expect(deleteCampaign(campaign('master'))).rejects.toEqual({ message: 'RLS denied' })
  })
  it('oferece o botão apenas no cartão do mestre', () => {
    const render = (role: 'master' | 'player') => renderToStaticMarkup(<CampaignLobby campaigns={[campaign(role)]} email="" loading={false} actionLoading={false} error="" onCreate={async () => {}} onDuplicate={async () => {}} onDelete={async () => {}} onJoin={async () => {}} onOpen={() => {}} onSignOut={() => {}} />)
    expect(render('master')).toContain('Apagar campanha')
    expect(render('player')).not.toContain('Apagar campanha')
    expect(render('master')).not.toContain('Confirmar exclusão definitiva')
  })
})
