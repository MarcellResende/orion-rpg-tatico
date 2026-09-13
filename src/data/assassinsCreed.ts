import type { AssassinState, EquipmentDefinition, FunctionDefinition } from '../types'
import type { ExpansionDefinition } from './expansions'
import pages from './assassinsCreedPages.json'
import schools from './assassinsCreedSchools.json'
import eraEquipment from './assassinsCreedEraEquipment.json'
import mods from './assassinsCreedMods.json'

export const AC_ID = 'assassins-creed'
export const AC_SCHOOLS = schools
export const AC_MODS = mods
export const AC_ERAS = ['Pré-História', 'Idade do Bronze', 'Idade do Ferro', 'Antiguidade Clássica', 'Antiguidade Tardia', 'Alta Idade Média', 'Cruzadas / Idade Média Central', 'Baixa Idade Média', 'Renascimento', 'Era das Navegações', 'Revoluções / Era Napoleônica', 'Era Industrial', 'Era Vitoriana / Belle Époque', 'Guerras Mundiais', 'Guerra Fria', 'Contemporâneo']
export const emptyAssassin = (): AssassinState => ({ functionId: '', specialization: '', era: 9, modernTechnology: false, flow: 0, suspicion: 0, credibility: 2, distance: 1, stance: 'balanced', primarySchool: '', guard: '', clues: [], target: '', layers: 0, opportunities: '', bladeMods: { left: [], right: [] } })

export const AC_FUNCTIONS: FunctionDefinition[] = [
  { id: 'assassins-creed:sombra', name: 'Sombra', description: 'Infiltração e anonimato.', bonus: '+1 Destreza, +1 Inteligência, +2 Furtividade.', attributeBonuses: { dexterity: 1, intelligence: 1 }, skillBonuses: { stealth: 2 }, exclusiveAbility: 'Presença Ausente', exclusiveAbilityEffect: '1/cena, ignore o primeiro +1 de Suspeita recebido. Não funciona em Alerta Vermelho.', sourcePage: 4 },
  { id: 'assassins-creed:batedor', name: 'Batedor', description: 'Parkour e perseguição.', bonus: '+1 Destreza, +1 Constituição, +2 Mobilidade.', attributeBonuses: { dexterity: 1, constitution: 1 }, skillBonuses: { mobility: 2 }, exclusiveAbility: 'Movimento Natural', exclusiveAbilityEffect: 'Fluxo máximo 4 em vez de 3.', sourcePage: 4 },
  { id: 'assassins-creed:agente', name: 'Agente', description: 'Identidades de cobertura.', bonus: '+1 Inteligência, +1 Constituição, +2 Comunicação.', attributeBonuses: { intelligence: 1, constitution: 1 }, skillBonuses: { communication: 2 }, exclusiveAbility: 'Pertence ao Lugar', exclusiveAbilityEffect: 'Disfarces preparados recebem +1 Credibilidade, máx. 3; 1/cena pode rerrolar Disfarce e aceitar o segundo resultado.', sourcePage: 4 },
  { id: 'assassins-creed:duelista', name: 'Duelista', description: 'Combate corpo a corpo.', bonus: '+1 Força ou Destreza, +1 Constituição, +2 Combate.', attributeBonuses: { constitution: 1 }, attributeChoices: [{ id: 'ac-duelista', label: 'Bônus do Duelista', options: ['strength', 'dexterity'] }], skillBonuses: { combat: 2 }, exclusiveAbility: 'Resposta Imediata', exclusiveAbilityEffect: 'Se uma Reação defensiva fizer um inimigo errar por 5+, +2 no próximo ataque contra ele.', sourcePage: 4 },
  { id: 'assassins-creed:observador', name: 'Observador', description: 'Informação e oportunidades.', bonus: '+1 Inteligência, +1 Destreza, +2 Exploração.', attributeBonuses: { intelligence: 1, dexterity: 1 }, skillBonuses: { exploration: 2 }, exclusiveAbility: 'Olhar Treinado', exclusiveAbilityEffect: 'A primeira investigação bem-sucedida da missão concede uma Informação adicional relacionada à fonte.', sourcePage: 4 },
  { id: 'assassins-creed:artifice', name: 'Artífice', description: 'Preparação de equipamento.', bonus: '+1 Inteligência, +1 Destreza, +2 Tecnologia.', attributeBonuses: { intelligence: 1, dexterity: 1 }, skillBonuses: { technology: 2 }, exclusiveAbility: 'Preparação Meticulosa', exclusiveAbilityEffect: 'Escolha 2 equipamentos no planejamento; cada um recebe +1 no primeiro teste diretamente relacionado.', sourcePage: 4 },
]

export const AC_SPECIALIZATIONS: Record<string, string[]> = {
  sombra: ['Fantasma', 'Executor'], batedor: ['Acrobata Urbano', 'Rastreador de Rotas'], agente: ['Camaleão', 'Negociador'], duelista: ['Mestre de Escola', 'Quebra-Linhas'], observador: ['Analista de Dossiê', 'Vigia'], artifice: ['Armeiro', 'Engenheiro de Campo'],
}

const item = (id: string, name: string, weight: number, effect: string, extra: Partial<EquipmentDefinition> = {}): EquipmentDefinition => ({ id: `${AC_ID}:${id}`, name, weight, effect, sourcePage: 19, category: 'survival', ...extra })
export const AC_EQUIPMENT: EquipmentDefinition[] = [
  item('hidden-blade-left', 'Lâmina Oculta · braço esquerdo', .5, '1d6; Ocultável; permite Assassinato. 2 espaços de modificação.', { category: 'secondaryWeapon', slot: 'leftBlade' }),
  item('hidden-blade-right', 'Lâmina Oculta · braço direito', .5, '1d6; Ocultável; permite Assassinato. 2 espaços de modificação.', { category: 'secondaryWeapon', slot: 'rightBlade' }),
  item('hidden-pouch', 'Bolsa Oculta', .25, 'Esconde 1 objeto pequeno; revista direta ainda pode encontrá-lo.'),
  item('disguise-kit', 'Kit de Disfarce', 1, '+1 Credibilidade quando preparado; máximo 3.'),
  item('medical-kit', 'Kit Médico da Irmandade', 1.5, '+2 Primeiros Socorros; 3 usos/missão.', { category: 'medical', subskillBonuses: { firstAid: 2 } }),
  item('climbing-kit', 'Kit de Escalada', 2, '+1 Mobilidade quando aplicável; pode liberar uma Rota.', { skillBonuses: { mobility: 1 } }),
  item('mechanisms-kit', 'Kit de Mecanismos', 1, '+2 Mecanismos contra segurança física compatível.', { subskillBonuses: { mechanisms: 2 } }),
  item('observation-tool', 'Ferramenta de Observação', .5, '+1 Exploração em observação prolongada.', { skillBonuses: { exploration: 1 } }),
  item('prepared-map', 'Mapa Preparado', .25, '+1 no primeiro teste de rota da missão.'),
  ...([
    ['clothes', 'Roupa / Traje', 0, 2, 0, 0, undefined, 0], ['light-armor', 'Armadura Leve', 2, 4, 1, 2, undefined, 0],
    ['medium-armor', 'Armadura Média', 5, 8, 2, 4, 2, 0], ['heavy-armor', 'Armadura Pesada', 9, 9999, 3, 6, 1, -1.5],
    ['exceptional-armor', 'Armadura Excepcional · rara', 0, 9999, 3, 8, 1, -1.5],
  ] as const).map(([id, name, min, max, defense, ra, flowCap, movementPenalty]) => item(id, name, min, `+${defense} Defesa; RA ${ra}. A RA aumenta o limite de Ferimento Grave, sem reduzir dano nos PV. ${flowCap ? `Fluxo máximo ${flowCap}.` : 'Fluxo normal.'}`, { category: 'protection', slot: 'armor', sourcePage: 24, defenseBonus: defense, armorResistance: ra, flowCap, movementPenalty, weightUnspecified: true, weightRange: [min, max] })),
  item('reinforced-hood', 'Capuz Reforçado', .5, '+1 RA; pode ser ocultado.', { category: 'protection', slot: 'head', armorResistance: 1, sourcePage: 24 }),
  item('open-helmet', 'Capacete Aberto', 1, '+1 RA; visível, pode prejudicar identidades civis.', { category: 'protection', slot: 'head', armorResistance: 1, sourcePage: 24 }),
  item('closed-helmet', 'Capacete Fechado', 2, '+2 RA; -1 Exploração baseada em audição/percepção periférica.', { category: 'protection', slot: 'head', armorResistance: 2, sourcePage: 24 }),
  item('buckler', 'Broquel / Escudo Pequeno', 1.5, '+1 Defesa frontal; pode Aparar corpo a corpo. Bloquear: Reação, +2 Defesa adicional.', { category: 'protection', slot: 'shield', defenseBonus: 1, sourcePage: 25 }),
  item('medium-shield', 'Escudo Médio', 4, '+2 Defesa frontal; ocupa uma mão. Bloquear: Reação, +2 Defesa adicional.', { category: 'protection', slot: 'shield', defenseBonus: 2, sourcePage: 25 }),
  item('large-shield', 'Escudo Grande', 7, '+3 Defesa frontal; -1,5 m Deslocamento e -2 Furtividade. Bloquear: Reação, +2 Defesa adicional.', { category: 'protection', slot: 'shield', defenseBonus: 3, sourcePage: 25, movementPenalty: -1.5, skillBonuses: { stealth: -2 } }),
]

export const ASSASSINS_CREED: ExpansionDefinition = {
  id: AC_ID, name: "Assassin’s Creed", version: '1.5.1', source: 'Expansão fan-made · compatível com RPG Tático v1.4',
  description: 'Infiltração histórica, Mobilidade, funções da Irmandade, escolas de combate, Dossiê, Fluxo e Lâminas Ocultas.',
  attributePoints: 0, attributes: [], rules: pages, equipment: [...AC_EQUIPMENT.map((entry) => {
    const weights: Record<string, number> = { clothes: 1.5, 'light-armor': 3, 'medium-armor': 6.5, 'heavy-armor': 11, 'exceptional-armor': 12 }
    const weight = weights[entry.id.replace(`${AC_ID}:`, '')]
    return weight === undefined ? entry : { ...entry, weight, weightUnspecified: false, weightRange: undefined, weightSourcePage: 49 }
  }), ...eraEquipment.map((entry) => entry.id === 'assassins-creed:era-12-survival-3' ? { ...entry, weight: 1, weightUnspecified: false } : entry.id === 'assassins-creed:era-16-survival-3' ? { ...entry, weight: 2, weightUnspecified: false } : entry) as EquipmentDefinition[]],
}
