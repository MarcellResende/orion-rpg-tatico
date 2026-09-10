import { activeExpansions, changeExpansionAttribute, expansionAttributeValue, expansionPointsSpent } from '../data/expansions'
import type { Character } from '../types'
import { Stepper } from './Stepper'

export function ExpansionAttributes({ character, onChange }: { character: Character; onChange: (character: Character) => void }) {
  return activeExpansions(character).flatMap((expansion) => expansion.attributes.map((attribute) => {
    const value = expansionAttributeValue(character, expansion.id, attribute.id)
    const change = (delta: number) => onChange({ ...changeExpansionAttribute(character, expansion.id, attribute.id, delta), updatedAt: new Date().toISOString() })
    return <Stepper key={`${expansion.id}:${attribute.id}`} label={attribute.name} value={value}
      hint={`${attribute.description} · ${expansion.name}: ${expansionPointsSpent(character, expansion)}/${expansion.attributePoints} pontos`}
      disableDecrease={value <= 0} disableIncrease={value >= attribute.maximum || expansionPointsSpent(character, expansion) >= expansion.attributePoints}
      onDecrease={() => change(-1)} onIncrease={() => change(1)} />
  }))
}
