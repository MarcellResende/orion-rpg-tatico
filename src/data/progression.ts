import type { LevelDefinition, MissionXpOption } from '../types'

export const LEVEL_TABLE: LevelDefinition[] = [
  { level: 1, totalXp: 0, reward: 'Criação do personagem + Habilidade Exclusiva da Função' },
  { level: 2, totalXp: 4, reward: '+1 Perícia + 1 Habilidade Geral' },
  { level: 3, totalXp: 9, reward: '+1 Perícia + 1 Atributo' },
  { level: 4, totalXp: 15, reward: '+1 Perícia + 1 Habilidade Geral' },
  { level: 5, totalXp: 22, reward: '+1 Perícia + Especialização da Função' },
  { level: 6, totalXp: 30, reward: '+1 Perícia + 1 Atributo' },
  { level: 7, totalXp: 39, reward: '+1 Perícia + 1 Habilidade Geral' },
  { level: 8, totalXp: 49, reward: '+1 Perícia + Treinamento Veterano' },
  { level: 9, totalXp: 60, reward: '+1 Perícia + 1 Atributo + 1 Habilidade Geral' },
  { level: 10, totalXp: 72, reward: 'Habilidade Máxima da Função' },
]

export const MISSION_XP_OPTIONS: MissionXpOption[] = [
  { id: 'completed', label: 'Participou e concluiu a missão', amount: 2 },
  { id: 'primary', label: 'Objetivo primário cumprido', amount: 1 },
  { id: 'secondary', label: 'Objetivo secundário cumprido', amount: 1 },
  { id: 'ghost', label: 'Operação Fantasma', amount: 1 },
  { id: 'intel', label: 'Informação ou objetivo importante descoberto', amount: 1 },
]

export const MAX_MISSION_XP = 6
