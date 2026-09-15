import {describe,it,expect} from 'vitest'
import {createEmptyCharacter,hydrateCharacter} from '../character'
import {ASSASSINS_CREED} from '../data/assassinsCreed'
import {setExpansionEnabled} from '../data/expansions'
import {calculateInventoryWeight} from './calculations'
import {reloadFromBag} from './ammunition'
import type {InventoryItem} from '../types'
const entry=(id:string):InventoryItem=>{const d=ASSASSINS_CREED.equipment.find(e=>e.id===id)!;return {...d,id,catalogItemId:id,quantity:1,active:true,notes:'',weapon:d.weapon?{...d.weapon,ammo:0,spareMagazines:0}:undefined}}
describe('munição oficial da expansão',()=>{
 it('usa capacidades por era e preserva munição esgotada na hidratação',()=>{
  const capacities=[[10,'Pistola de Pederneira',1],[13,'Revólver',6],[14,'Pistola',8],[15,'Rifle',5],[16,'Pistola',15],[16,'LMG',100]] as const
  for(const [era,name,capacity] of capacities){const d=ASSASSINS_CREED.equipment.find(e=>e.era===era&&e.name.startsWith(name+' ·'))!;expect(d.weapon?.magazineCapacity).toBe(capacity);const c=createEmptyCharacter();c.inventory=[entry(d.id)];expect(hydrateCharacter(c).inventory[0].weapon?.ammo).toBe(0)}
 })
 it('consome a reserva do saco correto e mantém peso vazio após reabrir',()=>{
  let c=setExpansionEnabled(createEmptyCharacter(),'assassins-creed',true)
  const gun=ASSASSINS_CREED.equipment.find(e=>e.era===16&&e.name.startsWith('Pistola ·'))!
  const weapon=entry(gun.id), bag={...entry('assassins-creed:ammo-bag-contemporary'),ammoBag:{family:'contemporary' as const,reloads:1}}
  c.inventory=[weapon,bag];const weight=calculateInventoryWeight(c);c=reloadFromBag(c,weapon.id,bag.id)
  expect(c.inventory[0].weapon?.ammo).toBe(15);expect(c.inventory[1].ammoBag?.reloads).toBe(0);expect(calculateInventoryWeight(c)).toBe(weight-.75)
  c=hydrateCharacter(c);expect(c.inventory[1].ammoBag?.reloads).toBe(0);expect(reloadFromBag(c,weapon.id,bag.id)).toBe(c)
 })
 it('rejeita família incompatível e suspende munição/peso com a expansão desligada',()=>{
  let c=setExpansionEnabled(createEmptyCharacter(),'assassins-creed',true)
  const d=ASSASSINS_CREED.equipment.find(e=>e.era===13&&e.name.startsWith('Revólver ·'))!
  c.inventory=[entry(d.id),{...entry('assassins-creed:ammo-bag-contemporary'),ammoBag:{family:'contemporary',reloads:6}}]
  expect(reloadFromBag(c,c.inventory[0].id,c.inventory[1].id)).toBe(c)
  c=setExpansionEnabled(c,'assassins-creed',false);expect(calculateInventoryWeight(c)).toBe(0);expect(c.inventory[1].ammoBag?.reloads).toBe(6)
  expect(reloadFromBag(c,c.inventory[0].id,c.inventory[1].id)).toBe(c)
 })
})
