const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={completed:'Milestone marked complete',partial:'Partial progress',ensam:'ENSAM priority',skipped:'Skipped'};
const timestamp=value=>{const n=Date.parse(value||'');return Number.isFinite(n)?n:null;};
export function transferSummary(state){
  const sessions=state.events.filter(e=>e.type==='session'),voided=new Set(state.events.filter(e=>e.type==='void').map(e=>e.target));
  const latest=sessions.reduce((a,b)=>!a||(timestamp(b.at)??timestamp(b.day)??0)>=(timestamp(a.at)??timestamp(a.day)??0)?b:a,null);
  const task=latest&&(latest.taskSnapshot||state.tasks.find(t=>t.id===latest.taskId));
  return {tasks:state.tasks.length,sessions:sessions.length,timer:Boolean(state.timer),latest:latest?{title:[task?.resource,task?.section,task?.heading].filter(Boolean).join(' · ')||'Saved task',day:latest.day,status:voided.has(latest.id)?'Corrected attempt':labels[latest.outcome]||'Saved attempt'}:null};
}
function formatTime(value,zone){try{return new Intl.DateTimeFormat('en-GB',{timeZone:zone,day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return 'Not recorded';}}
function card(title,state,zone){
  const summary=transferSummary(state),checkpoint=state.checkpoints?.at(-1);
  return `<section class="transfer-summary"><h3>${title}</h3><p class="transfer-counts">${summary.tasks} tasks · ${summary.sessions} saved attempts${summary.timer?' · paused focus included':''}</p><span class="detail-label">Latest saved work</span>${summary.latest?`<p class="transfer-work">${esc(summary.latest.title)}</p><small>${esc(summary.latest.day)} · ${esc(summary.latest.status)}</small>`:`<p class="muted">No saved attempts yet.</p>${checkpoint?`<small>Starting checkpoint: ${esc(checkpoint.resource)} · ${esc(checkpoint.last_demonstrated)}</small>`:''}`}<p class="transfer-date">${title==='Incoming backup'?'Export created':'Last saved'}: ${esc(formatTime(title==='Incoming backup'?state.exportedAt||state.updatedAt:state.updatedAt,zone))}</p></section>`;
}
export function renderRestorePreview(incoming,current,{fileName='Selected backup'}={}){
  const zone=current.settings.timezone||'UTC',exported=timestamp(incoming.exportedAt),saved=timestamp(current.updatedAt);
  const older=exported!=null&&saved!=null&&exported<saved;
  return `<p class="eyebrow">RESTORE PREVIEW</p><h2>Restore this backup?</h2><p class="transfer-file">${esc(fileName)}</p><div class="transfer-compare">${card('Incoming backup',incoming,zone)}${card('This browser',current,zone)}</div>${older?'<p class="transfer-age">This backup was created before the last save in this browser.</p>':''}<p class="small muted">Times shown in ${esc(zone)}. Restore replaces this browser’s plan and saves a local recovery copy first. Export your current work if you want a separate copy.</p><div class="dialog-actions"><button class="text-button" data-close>Cancel</button><button class="secondary" id="pre-export">Export current</button><button class="primary" id="restore">Restore</button></div>`;
}
