import {groupAttempts,effortFor} from './effort.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function historyPage(state,{search='',month='',page=0,pageSize=20}={}){
 pageSize=Math.max(1,Math.min(100,Math.floor(Number(pageSize))||20));
 const tasks=new Map(state.tasks.map(t=>[t.id,t]));
 const term=String(search).trim().toLowerCase(),groups=groupAttempts(state).filter(g=>{
  if(month&&!g.day.startsWith(month))return false;
  const task=tasks.get(g.taskId),snapshot=g.attempts[0].taskSnapshot||task;
  return !term||[snapshot?.resource,snapshot?.section,snapshot?.heading,...g.attempts.map(e=>e.note||'')].join(' ').toLowerCase().includes(term);
 });
 const pages=Math.max(1,Math.ceil(groups.length/pageSize)),selected=Math.max(0,Math.min(Number.isInteger(page)?page:0,pages-1));
 return {groups:groups.slice(selected*pageSize,(selected+1)*pageSize),total:groups.length,pages,page:selected,minutes:groups.reduce((n,g)=>n+g.minutes,0)};
}
export function renderHistoryView(state,options={}){
 const result=historyPage(state,options),{groups,page,pages,total}=result;
 const body=groups.map(g=>{
  const t=state.tasks.find(t=>t.id===g.taskId),snapshot=g.attempts[0].taskSnapshot||t,effort=effortFor(state,t);
  return `<details class="log-group"><summary><span class="outcome-badge">${g.completed?'completed':g.attempts.every(e=>e.voided)?'corrected':g.attempts.filter(e=>!e.voided).at(-1)?.outcome||'attempts'}</span><span><b>${esc(snapshot.resource)} ${esc(snapshot.section)} · ${esc(snapshot.heading)}</b><small>${esc(g.day)} · ${g.attempts.length} retained attempts · ${Math.round(g.minutes)} active min</small></span></summary><p class="muted">${effort.initialEstimateMinutes} min initial estimate · ${Math.round(effort.timeSpentMinutes)} min recorded across all days · ${effort.completed?'explicitly completed':effort.remainingEstimateMinutes+' min remaining estimate'} (${esc(effort.remainingEstimateSource)}).</p>${g.attempts.map(e=>`<article class="log-row ${e.voided?'voided':''}"><span class="outcome-badge ${e.outcome}">${esc(e.outcome)}</span><div><p>${Math.round(e.minutes)} active min${e.at?' · '+esc(e.at):''}</p><p>${esc(e.note||'No attempt note')}</p>${e.remainingMinutes?`<small>${e.remainingMinutes} min revised remaining estimate</small>`:''}</div>${e.voided?'<small>Corrected · original retained</small>':`<button class="text-button" data-undo="${esc(e.id)}">Correct</button>`}</article>`).join('')}</details>`;
 }).join('');
 return `<div class="page-heading compact"><div><h1>Study log</h1><p class="subtitle">Your saved attempts, notes and progress.</p></div><button class="secondary" data-action="export">Export backup ↗</button></div><details class="checkpoint-details"><summary>Your starting checkpoint</summary>${state.checkpoints.map(c=>`<div class="checkpoint-banner">${esc(c.resource)} · ${esc(c.last_demonstrated)}<small>${esc(c.scope)} · ${esc(c.origin)} · confirmed ${esc(c.confirmed_at)}</small></div>`).join('')}</details><div class="library-toolbar history-toolbar"><label>Find an attempt<input id="history-search" type="search" placeholder="Task, resource or attempt note…" value="${esc(options.search||'')}"></label><label>Month<input id="history-month" type="month" value="${esc(options.month||'')}"></label>${options.search||options.month?'<button class="text-button" data-history-clear>Clear filters</button>':''}</div><p class="muted small">${total} task/day groups · ${Math.round(result.minutes)} active min in this view</p>${body||`<div class="empty"><h2>${state.events.some(e=>e.type==='session')?'No matching attempts.':'Your story starts here.'}</h2><p>Only saved attempts appear here.</p><button class="secondary" data-view="today">Back to Today</button></div>`}${pages>1?`<nav class="history-pages" aria-label="Study log pages"><button class="secondary" data-history-page="${page-1}" ${page===0?'disabled':''}>← Newer</button><span>Page ${page+1} of ${pages}</span><button class="secondary" data-history-page="${page+1}" ${page+1===pages?'disabled':''}>Older →</button></nav>`:''}`;
}
