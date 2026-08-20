export interface SquadLevelDefinition {
  level: number
  prestige: number
  classification: string
  reward: string
}

export interface CampaignOptionDefinition {
  id: string
  name: string
  effect: string
  cost?: number
}

export const SQUAD_LEVELS: SquadLevelDefinition[] = [
  { level: 1, prestige: 0, classification: 'Recém-Formado', reward: 'Sem Doutrina adicional.' },
  { level: 2, prestige: 5, classification: 'Coordenado', reward: 'Escolha 1 Doutrina de Esquadrão.' },
  { level: 3, prestige: 12, classification: 'Veterano', reward: 'Escolha +1 Doutrina de Esquadrão.' },
  { level: 4, prestige: 20, classification: 'Elite', reward: 'Escolha +1 Doutrina de Esquadrão.' },
  { level: 5, prestige: 30, classification: 'Fantasma', reward: 'Escolha 1 Doutrina de Elite.' },
]

export const SQUAD_DOCTRINES: CampaignOptionDefinition[] = [
  { id: 'breach-clear', name: 'Breach and Clear', effect: 'Na primeira rodada após entrar à força, todos recebem +1 Defesa.' },
  { id: 'hand-signals', name: 'Comunicação por Sinais', effect: 'Enquanto puderem se ver, sinais simples não exigem rádio e não aumentam o Alerta.' },
  { id: 'organized-retreat', name: 'Retirada Organizada', effect: 'Dois ou mais operadores recuando juntos recebem +1 Defesa durante a retirada.' },
  { id: 'coordinated-fire', name: 'Fogo Coordenado', effect: 'Quando dois operadores atacam o mesmo alvo na rodada, o segundo recebe +1 no ataque.' },
  { id: 'team-medicine', name: 'Medicina de Equipe', effect: 'Qualquer operador usa IFAK para estabilizar; com Primeiros Socorros 0, sofre -3 no teste.' },
  { id: 'standard-recon', name: 'Reconhecimento Padronizado', effect: 'Após 10 minutos observando, +1 no primeiro teste de Exploração ou Furtividade da operação.' },
]

export const ELITE_DOCTRINES: CampaignOptionDefinition[] = [
  { id: 'leave-no-one', name: 'Sem Deixar Ninguém', effect: 'Uma vez por missão, quando alguém cai a 0 PV, aliados recebem +2 m ao ir em direção a ele ou à extração.' },
  { id: 'perfect-execution', name: 'Execução Perfeita', effect: 'Concluir toda a Fase Verde sem falha de Furtividade concede +1 PQG adicional.' },
]

export const HEADQUARTERS_PROJECTS: CampaignOptionDefinition[] = [
  { id: 'arsenal', name: 'Arsenal', cost: 20, effect: 'A primeira modificação instalada ou trocada entre missões não gera custo adicional de manutenção, se usado na campanha.' },
  { id: 'infirmary', name: 'Enfermaria', cost: 20, effect: 'Descanso Longo no QG recupera +5 PV adicionais e pode reduzir uma Condição física tratável em um estágio.' },
  { id: 'workshop', name: 'Oficina', cost: 25, effect: 'Reparos completos em veículos/drones entre missões; Zelador recebe +2 em manutenção no QG.' },
  { id: 'intelligence-center', name: 'Centro de Inteligência', cost: 30, effect: 'Antes da operação, obtém uma informação verdadeira e relevante sobre o alvo.' },
  { id: 'electronic-warfare-center', name: 'Centro de Guerra Eletrônica', cost: 30, effect: 'O primeiro uso de Guerra Eletrônica por missão custa -1 EN, mínimo 1.' },
  { id: 'hangar', name: 'Hangar', cost: 40, effect: 'Armazena veículos da campanha e organiza o acesso a suporte aéreo quando permitido.' },
]

export const BRIEFING_SUPPORTS: CampaignOptionDefinition[] = [
  { id: 'structural-map', name: 'Mapa Estrutural', cost: 2, effect: 'Revela plantas, ventilação e rotas de fuga.' },
  { id: 'supply-box', name: 'Caixa de Suprimentos', cost: 5, effect: 'Suprimentos adicionais para a operação.' },
  { id: 'power-cut', name: 'Corte de Energia', cost: 5, effect: 'A missão começa com as luzes do alvo desligadas.' },
  { id: 'fast-helicopter', name: 'Extração de Helicóptero Rápida', cost: 5, effect: 'Extração em 1 rodada em área aberta, quando o suporte puder chegar.' },
  { id: 'mortar-support', name: 'Suporte de Morteiro', cost: 8, effect: 'Ataque em área por rádio, 1 uso por missão.' },
  { id: 'external-sniper', name: 'Sniper Externo', cost: 10, effect: 'Um disparo de precisão de longa distância, 1 uso por missão.' },
  { id: 'favorable-insertion', name: 'Inserção Favorável', cost: 15, effect: 'O grupo começa dentro do perímetro e pula a aproximação externa.' },
]

export const calculateSquadLevel = (prestige: number) =>
  SQUAD_LEVELS.reduce((level, definition) => prestige >= definition.prestige ? definition.level : level, 1)

export const calculateSquadDoctrineSlots = (level: number) => Math.max(0, Math.min(level, 4) - 1)
