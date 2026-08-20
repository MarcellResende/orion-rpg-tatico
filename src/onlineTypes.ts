import type { Character, ResourceKey } from './types'

export type CampaignRole = 'master' | 'player'
export type AlertLevel = 'green' | 'yellow' | 'red'

export interface CampaignProgressionState {
  operationalPrestige: number
  headquartersPoints: number
  squadDoctrines: string[]
  eliteDoctrine: string
  headquartersProjects: string[]
  missionSupports: string[]
  heat: number
  alert: AlertLevel
}

export const EMPTY_CAMPAIGN_PROGRESSION: CampaignProgressionState = {
  operationalPrestige: 0,
  headquartersPoints: 0,
  squadDoctrines: [],
  eliteDoctrine: '',
  headquartersProjects: [],
  missionSupports: [],
  heat: 0,
  alert: 'green',
}

export interface CampaignSummary {
  id: string
  name: string
  description: string
  inviteCode: string
  role: CampaignRole
  createdAt: string
  progression: CampaignProgressionState
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
