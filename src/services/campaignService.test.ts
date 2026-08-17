import { describe, expect, it } from 'vitest'
import type { CampaignSummary } from '../onlineTypes'
import { deduplicateCampaigns } from './campaignService'

const campaign = (role: CampaignSummary['role']): CampaignSummary => ({
  id: 'campaign-1',
  name: 'Operação Regicida',
  description: 'Teste',
  inviteCode: '0268390D',
  role,
  createdAt: '2026-08-17T00:00:00.000Z',
})

describe('lista de campanhas', () => {
  it('exibe a mesma campanha uma única vez e preserva o papel de mestre', () => {
    const result = deduplicateCampaigns([
      campaign('player'),
      campaign('player'),
      campaign('master'),
    ])
    expect(result).toHaveLength(1)
    expect(result[0].role).toBe('master')
  })
})

