import type { Character, ResourceKey } from './types'

export type CampaignRole = 'master' | 'player'

export interface CampaignSummary {
  id: string
  name: string
  description: string
  inviteCode: string
  role: CampaignRole
  createdAt: string
}

export interface OnlineCharacter {
  id: string
  campaignId: string
  ownerId: string
  sheet: Character
  conditions: ActiveCondition[]
  updatedAt: string
}

export interface ActiveCondition {
  id: string
  characterId: string
  conditionId: string
  addedBy: string
  createdAt: string
}

export interface ResourceQuickAction {
  character: OnlineCharacter
  resource: ResourceKey
  delta: number
}
