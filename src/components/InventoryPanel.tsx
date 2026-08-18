import { useMemo, useState, type FormEvent } from 'react'
import {
  EQUIPMENT_CATALOG,
  EQUIPMENT_CATEGORY_LABELS,
  findEquipment,
} from '../data/equipment'
import { SKILL_LABELS } from '../data/manual'
import { calculateInventoryWeight, calculateLoadState, clamp } from '../rules/calculations'
import type { Character, InventoryItem, SkillKey } from '../types'

interface InventoryPanelProps {
  character: Character
  onChange: (character: Character) => void
}

const makeInventoryId = () =>
  globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(36).slice(2)}`

export function InventoryPanel({ character, onChange }: InventoryPanelProps) {
  const [catalogItemId, setCatalogItemId] = useState('')
  const [catalogQuantity, setCatalogQuantity] = useState(1)
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customQuantity, setCustomQuantity] = useState(1)
  const [customWeight, setCustomWeight] = useState(0)
  const [customNotes, setCustomNotes] = useState('')
  const inventoryWeight = calculateInventoryWeight(character)
  const loadState = calculateLoadState(character)
  const selectedCatalogItem = findEquipment(catalogItemId)
  const catalogProjectedWeight = inventoryWeight + (selectedCatalogItem?.weight ?? 0) * (catalogQuantity || 0)
  const customProjectedWeight = inventoryWeight + Math.max(0, customWeight || 0) * (customQuantity || 0)
  const catalogWouldExceed = catalogProjectedWeight > loadState.maximumLimit
  const customWouldExceed = customProjectedWeight > loadState.maximumLimit

  const groupedCatalog = useMemo(() => {
    const groups = new Map<string, typeof EQUIPMENT_CATALOG>()
    for (const definition of EQUIPMENT_CATALOG) {
      groups.set(definition.category, [...(groups.get(definition.category) ?? []), definition])
    }
    return groups
  }, [])

  const commit = (inventory: InventoryItem[]) => onChange({
    ...character,
    inventory,
    updatedAt: new Date().toISOString(),
  })

  const addCatalogItem = (event: FormEvent) => {
    event.preventDefault()
    const definition = findEquipment(catalogItemId)
    if (!definition || catalogWouldExceed) return
    const item: InventoryItem = {
      id: makeInventoryId(),
      catalogItemId: definition.id,
      name: definition.name,
      quantity: clamp(catalogQuantity || 1, 1, 999),
      weight: definition.weight,
      notes: '',
      category: definition.category,
      effect: definition.effect,
      active: true,
      slot: definition.slot,
      selectedSkillBonus: definition.skillBonusChoice?.options[0],
      weapon: definition.weapon
        ? {
            ammo: definition.weapon.magazineCapacity,
            magazineCapacity: definition.weapon.magazineCapacity,
            spareMagazines: 0,
            allowedShots: definition.weapon.allowedShots,
          }
        : undefined,
    }
    const inventory = definition.slot
      ? character.inventory.map((current) => current.slot === definition.slot ? { ...current, active: false } : current)
      : character.inventory
    commit([...inventory, item])
    setCatalogItemId('')
    setCatalogQuantity(1)
  }

  const addCustomItem = (event: FormEvent) => {
    event.preventDefault()
    const name = customName.trim()
    if (!name || customWouldExceed) return
    commit([...character.inventory, {
      id: makeInventoryId(),
      catalogItemId: '',
      name,
      quantity: clamp(customQuantity || 1, 1, 999),
      weight: Math.max(0, Math.round((customWeight || 0) * 100) / 100),
      notes: customNotes.trim(),
      category: 'custom',
      effect: '',
      active: true,
    }])
    setCustomName('')
    setCustomQuantity(1)
    setCustomWeight(0)
    setCustomNotes('')
    setShowCustom(false)
  }

  const updateItem = (itemId: string, update: (item: InventoryItem) => InventoryItem) => {
    commit(character.inventory.map((item) => item.id === itemId ? update(item) : item))
  }

  const toggleItem = (itemId: string) => {
    const target = character.inventory.find((item) => item.id === itemId)
    if (!target) return
    const nextActive = !target.active
    commit(character.inventory.map((item) => {
      if (item.id === itemId) return { ...item, active: nextActive }
      if (nextActive && target.slot && item.slot === target.slot) return { ...item, active: false }
      return item
    }))
  }

  const fireWeapon = (itemId: string, shots: number) => {
    updateItem(itemId, (item) => item.weapon ? {
      ...item,
      weapon: { ...item.weapon, ammo: clamp(item.weapon.ammo - shots, 0, item.weapon.magazineCapacity) },
    } : item)
  }

  const reloadWeapon = (itemId: string) => {
    updateItem(itemId, (item) => {
      if (!item.weapon || item.weapon.spareMagazines === 0 || item.weapon.ammo === item.weapon.magazineCapacity) return item
      return {
        ...item,
        weapon: {
          ...item.weapon,
          ammo: item.weapon.magazineCapacity,
          spareMagazines: item.weapon.spareMagazines - 1,
        },
      }
    })
  }

  return (
    <section className="panel operations-panel inventory-panel" aria-labelledby="inventory-heading">
      <div className="panel-heading">
        <div>
          <span className="section-index">07</span>
          <h2 id="inventory-heading">Inventário e armamento</h2>
        </div>
        <span className="point-counter">{inventoryWeight.toLocaleString('pt-BR')} KG</span>
      </div>
      <p className="panel-intro">
        Escolha um item do arsenal para preencher peso, efeito, bônus e munição automaticamente. Itens ativos concedem seus bônus sem gastar pontos.
      </p>

      <section className={`load-console load-console--${loadState.level}`} aria-label="Capacidade de carga do operador">
        <div className="load-console__heading">
          <div>
            <span>CARGA DO OPERADOR</span>
            <strong>{loadState.label}</strong>
          </div>
          <b>{loadState.percentage.toLocaleString('pt-BR')}%</b>
        </div>
        <div
          className="load-meter"
          role="meter"
          aria-label="Percentual de carga"
          aria-valuemin={0}
          aria-valuemax={200}
          aria-valuenow={Math.min(loadState.percentage, 200)}
        >
          <span className="load-meter__fill" style={{ width: `${Math.min(loadState.percentage / 2, 100)}%` }} />
          <span className="load-meter__base-marker" aria-hidden="true" />
        </div>
        <div className="load-meter__labels" aria-hidden="true">
          <span>0%</span><span>100% BASE</span><span>200% MÁX.</span>
        </div>
        <div className="load-console__summary">
          <strong>{inventoryWeight.toLocaleString('pt-BR')} kg carregados</strong>
          <span>Base: {loadState.baseLimit.toLocaleString('pt-BR')} kg</span>
          <span>Máximo absoluto: {loadState.maximumLimit.toLocaleString('pt-BR')} kg</span>
        </div>
        <p>{loadState.description}</p>
        <div className="load-penalties">
          {Object.entries(loadState.skillPenalties).map(([key, penalty]) => (
            <span key={key}>{penalty} em {SKILL_LABELS[key as SkillKey]}</span>
          ))}
          {loadState.energyCostPenalty > 0 && <span>+{loadState.energyCostPenalty} no custo de Energia em ações físicas</span>}
          {loadState.movementPenalty < 0 && <span>{loadState.movementPenalty} m de deslocamento</span>}
          {loadState.level === 'normal' && <span>Sem desvantagens</span>}
          {loadState.exceedsMaximum && <strong>Retire equipamentos: não é permitido operar acima de 200%.</strong>}
        </div>
        <small>Capacidade: 15 kg + 5 kg por ponto de Força total.</small>
      </section>

      <form className="catalog-form" onSubmit={addCatalogItem}>
        <label className="field catalog-picker">
          <span>Item do manual</span>
          <select value={catalogItemId} required onChange={(event) => setCatalogItemId(event.currentTarget.value)}>
            <option value="">Selecione um equipamento</option>
            {[...groupedCatalog.entries()].map(([category, definitions]) => (
              <optgroup key={category} label={EQUIPMENT_CATEGORY_LABELS[category as keyof typeof EQUIPMENT_CATEGORY_LABELS]}>
                {definitions.map((definition) => (
                  <option key={definition.id} value={definition.id}>{definition.name} — {definition.weight.toLocaleString('pt-BR')} kg</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="field catalog-quantity">
          <span>Quantidade</span>
          <input type="number" min={1} max={999} value={catalogQuantity} onChange={(event) => setCatalogQuantity(event.currentTarget.valueAsNumber)} />
        </label>
        <button type="submit" className="primary-button" disabled={!catalogItemId || catalogWouldExceed}>Adicionar do arsenal</button>
        <button type="button" className="secondary-button" onClick={() => setShowCustom((current) => !current)}>
          {showCustom ? 'Cancelar personalizado' : 'Item personalizado'}
        </button>
      </form>

      {catalogItemId && catalogWouldExceed && (
        <p className="load-limit-warning" role="alert">Esse equipamento passaria do máximo absoluto de 200%. Reduza a quantidade ou remova outro item.</p>
      )}

      {showCustom && (
        <form className="inventory-form custom-inventory-form" onSubmit={addCustomItem}>
          <label className="field inventory-name"><span>Nome</span><input required maxLength={100} value={customName} onChange={(event) => setCustomName(event.currentTarget.value)} /></label>
          <label className="field"><span>Quantidade</span><input type="number" min={1} max={999} value={customQuantity} onChange={(event) => setCustomQuantity(event.currentTarget.valueAsNumber)} /></label>
          <label className="field"><span>Peso unitário</span><input type="number" min={0} max={9999} step="0.01" value={customWeight} onChange={(event) => setCustomWeight(event.currentTarget.valueAsNumber)} /></label>
          <label className="field inventory-notes"><span>Observação</span><input maxLength={300} value={customNotes} onChange={(event) => setCustomNotes(event.currentTarget.value)} /></label>
          <button type="submit" className="primary-button" disabled={customWouldExceed}>Adicionar personalizado</button>
        </form>
      )}

      {showCustom && customWouldExceed && (
        <p className="load-limit-warning" role="alert">Este item personalizado passaria do máximo absoluto de 200%.</p>
      )}

      {character.inventory.length === 0 ? (
        <div className="empty-inline">Nenhum equipamento adicionado.</div>
      ) : (
        <div className="inventory-list inventory-list--detailed">
          {character.inventory.map((item) => {
            const definition = findEquipment(item.catalogItemId)
            const skillChoice = definition?.skillBonusChoice
            const grantsBonus = Boolean(
              definition?.defenseBonus ||
              definition?.skillBonuses ||
              definition?.subskillBonuses ||
              skillChoice ||
              item.slot,
            )
            return (
              <article className={`inventory-item inventory-item--detailed ${item.active ? 'inventory-item--active' : ''}`} key={item.id}>
                <div className="inventory-item__heading">
                  <div>
                    <span className="inventory-category">{EQUIPMENT_CATEGORY_LABELS[item.category]}</span>
                    <strong>{item.name}</strong>
                    <span>{item.quantity} × {item.weight.toLocaleString('pt-BR')} kg = {(item.quantity * item.weight).toLocaleString('pt-BR')} kg</span>
                  </div>
                  {grantsBonus && (
                    <label className="equipment-toggle">
                      <input type="checkbox" checked={item.active} onChange={() => toggleItem(item.id)} />
                      <span>{item.slot ? 'Equipado' : 'Em uso'}</span>
                    </label>
                  )}
                </div>

                {(item.effect || item.notes) && (
                  <div className="inventory-effect">
                    {item.effect && <p>{item.effect}</p>}
                    {item.notes && <p>{item.notes}</p>}
                    {definition && <small>Manual // pág. {definition.sourcePage}</small>}
                  </div>
                )}

                {skillChoice && item.active && (
                  <label className="field equipment-skill-choice">
                    <span>Bônus gratuito de +{skillChoice.amount}</span>
                    <select
                      value={item.selectedSkillBonus ?? skillChoice.options[0]}
                      onChange={(event) => {
                        const selectedSkillBonus = event.currentTarget.value as SkillKey
                        updateItem(item.id, (current) => ({ ...current, selectedSkillBonus }))
                      }}
                    >
                      {skillChoice.options.map((key) => <option key={key} value={key}>{SKILL_LABELS[key]}</option>)}
                    </select>
                  </label>
                )}

                {item.weapon && (
                  <div className="weapon-console">
                    <div className="ammo-readout">
                      <span>MUNIÇÃO NO PENTE</span>
                      <strong>{item.weapon.ammo}<small>/{item.weapon.magazineCapacity}</small></strong>
                    </div>
                    <div className="fire-controls" aria-label={`Disparos de ${item.name}`}>
                      {item.weapon.allowedShots.map((shots) => (
                        <button type="button" key={shots} disabled={item.weapon!.ammo < shots} onClick={() => fireWeapon(item.id, shots)}>
                          Disparar {shots}
                        </button>
                      ))}
                      <button type="button" disabled={item.weapon.ammo >= item.weapon.magazineCapacity} onClick={() => fireWeapon(item.id, -1)}>Corrigir +1</button>
                    </div>
                    <div className="magazine-controls">
                      <span>Pentes reserva</span>
                      <button type="button" disabled={item.weapon.spareMagazines === 0} onClick={() => updateItem(item.id, (current) => current.weapon ? { ...current, weapon: { ...current.weapon, spareMagazines: current.weapon.spareMagazines - 1 } } : current)}>−</button>
                      <output>{item.weapon.spareMagazines}</output>
                      <button type="button" onClick={() => updateItem(item.id, (current) => current.weapon ? { ...current, weapon: { ...current.weapon, spareMagazines: clamp(current.weapon.spareMagazines + 1, 0, 99) } } : current)}>+</button>
                      <button type="button" className="reload-button" disabled={item.weapon.spareMagazines === 0 || item.weapon.ammo === item.weapon.magazineCapacity} onClick={() => reloadWeapon(item.id)}>Recarregar</button>
                    </div>
                  </div>
                )}

                <button type="button" className="danger-text-button inventory-remove" onClick={() => commit(character.inventory.filter((current) => current.id !== item.id))}>Remover item</button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
