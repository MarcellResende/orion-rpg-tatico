import { useEffect, useState } from 'react'
import type { CampaignSummary, OnlineCharacter } from '../onlineTypes'
import { requireSupabase } from '../lib/supabase'
import { loadSession, saveSession } from '../services/sessionService'
import type { SessionState } from '../session'

export function CampaignSessionSummary({campaign,characters,userId}:{campaign:CampaignSummary;characters:OnlineCharacter[];userId:string}) {
  const [session,setSession]=useState<{state:SessionState;revision:number}|null>(null)
  const [members,setMembers]=useState<{user_id:string;role:string}[]>([])
  const [error,setError]=useState(''),[busy,setBusy]=useState(false)
  useEffect(()=>{
    let active=true
    const refresh=()=>void loadSession(campaign.id).then(data=>{if(active)setSession(data)}).catch(()=>{})
    refresh()
    void requireSupabase().from('campaign_members').select('user_id,role').eq('campaign_id',campaign.id).then(({data,error})=>{if(active){if(error)setError('Não foi possível carregar os participantes.');else setMembers(data??[])}})
    const timer=setInterval(refresh,8000)
    return()=>{active=false;clearInterval(timer)}
  },[campaign.id])
  const combat=session?.state.combat
  return <section className="panel session-section"><h2>Sessão e participantes</h2>
    {combat?.active&&<><p>Rodada {combat.round} · Turno de {combat.entries[combat.turn]?.name}</p><div className="combat-list">{combat.entries.map(e=><p key={e.id}><b>{e.name}</b> · Iniciativa {e.initiative} · Padrão {e.actions} · Secundária {e.secondary} · Meia ação {e.half} · Reações {e.reactions}</p>)}</div></>}
    {session?.state.notices.filter(n=>!n.recipient||n.recipient===userId||campaign.role==='master').map(n=><p key={n.id} role="status">Aviso: {n.message}</p>)}
    <details><summary>{members.length} participantes da campanha</summary>{members.map(m=><p key={m.user_id}>{characters.find(c=>c.ownerId===m.user_id)?.sheet.identity.codename||characters.find(c=>c.ownerId===m.user_id)?.sheet.identity.name||`Participante ${m.user_id.slice(0,8)}`} · {m.role==='master'?'Mestre':'Jogador'}{campaign.role==='master'&&session&&<button className="secondary-button" disabled={busy} onClick={async()=>{
      const message=window.prompt('Aviso ao jogador (visível para a campanha):')
      if(!message?.trim())return
      setBusy(true)
      try {const current=await loadSession(campaign.id);const state={...current.state,notices:[...current.state.notices,{id:crypto.randomUUID(),recipient:m.user_id,message:message.slice(0,1000)}].slice(-30)};await saveSession(campaign.id,current.revision,state);setSession(await loadSession(campaign.id));setError('')}catch{setError('Não foi possível enviar o aviso. Atualize a sessão e tente novamente.')}finally{setBusy(false)}
    }}>Enviar aviso</button>}</p>)}</details>
    {error&&<p role="alert">{error}</p>}
  </section>
}
