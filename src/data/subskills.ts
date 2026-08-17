import type { SkillKey, SubskillDefinition } from '../types'

export const SUBSKILLS: SubskillDefinition[] = [
  { key: 'longRangeWeapons', skillKey: 'combat', name: 'Armas de Longo Alcance', description: 'Fuzis de precisão, rifles antimaterial e alvos distantes.' },
  { key: 'mediumRangeWeapons', skillKey: 'combat', name: 'Armas de Médio Alcance', description: 'Fuzis de assalto, LMGs e combate em campo aberto.' },
  { key: 'shortRangeWeapons', skillKey: 'combat', name: 'Armas de Curto Alcance', description: 'Submetralhadoras, pistolas e espingardas para CQB.' },
  { key: 'artilleryWeapons', skillKey: 'combat', name: 'Armas de Artilharia', description: 'Lança-foguetes, lança-granadas e armamentos pesados.' },
  { key: 'melee', skillKey: 'combat', name: 'Corpo a Corpo', description: 'Combate desarmado, facas, imobilizações e eliminações silenciosas.' },
  { key: 'intimidation', skillKey: 'communication', name: 'Intimidação', description: 'Extrair informações, coagir e impor presença.' },
  { key: 'diplomacy', skillKey: 'communication', name: 'Diplomacia', description: 'Alianças, negociação institucional e redução de conflitos.' },
  { key: 'negotiation', skillKey: 'communication', name: 'Negociação', description: 'Suprimentos, trocas de reféns e favores.' },
  { key: 'landVehicles', skillKey: 'piloting', name: 'Veículos Terrestres', description: 'Carros blindados, caminhões, buggies e motos.' },
  { key: 'waterVehicles', skillKey: 'piloting', name: 'Veículos Aquáticos', description: 'Botes de invasão, lanchas e minissubmarinos.' },
  { key: 'airVehicles', skillKey: 'piloting', name: 'Veículos Aéreos', description: 'Helicópteros, aeronaves leves e drones pilotados.' },
  { key: 'survival', skillKey: 'tolerance', name: 'Sobrevivência', description: 'Climas extremos, rastreamento e busca por recursos.' },
  { key: 'fortitude', skillKey: 'tolerance', name: 'Fortitude', description: 'Venenos, gás lacrimogêneo, infecções e fadiga extrema.' },
  { key: 'firstAid', skillKey: 'medicine', name: 'Primeiros Socorros', description: 'Sangramentos, torniquetes e estabilização em campo.' },
  { key: 'warSurgery', skillKey: 'medicine', name: 'Cirurgia de Guerra', description: 'Traumas graves, projéteis e procedimentos complexos.' },
  { key: 'mechanics', skillKey: 'technology', name: 'Mecânica', description: 'Veículos, motores, estruturas e mecanismos físicos.' },
  { key: 'electronics', skillKey: 'technology', name: 'Eletrônica', description: 'Computadores, redes, alarmes e bloqueadores de rádio.' },
  { key: 'equipmentRepair', skillKey: 'technology', name: 'Reparo de Equipamentos', description: 'Consertar armas travadas, coletes e gadgets táticos.' },
]

export const SUBSKILL_RULES: Record<SkillKey, string> = {
  combat: 'Cada ponto distribuído em Combate gera 2 pontos de subperícia.',
  tolerance: 'Cada ponto distribuído em Tolerância gera 1 ponto de subperícia.',
  communication: 'Cada ponto distribuído gera 1 ponto de especialização.',
  piloting: 'Cada ponto distribuído gera 1 ponto de especialização.',
  exploration: 'Use especializações livres para registrar campos de atuação.',
  stealth: 'Use especializações livres para registrar campos de atuação.',
  medicine: 'Cada ponto distribuído gera 1 ponto de especialização.',
  technology: 'Cada ponto distribuído gera 1 ponto de especialização.',
  willpower: 'Use especializações livres para registrar campos de atuação.',
}

export const subskillsFor = (skillKey: SkillKey) =>
  SUBSKILLS.filter((item) => item.skillKey === skillKey)

