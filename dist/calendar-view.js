import {addDays,weekday,deadlineRisks} from './engine.js';
import {project,historicalDay,semesterFor} from './planner.js';
import {isCivilDate} from './validation.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const HORIZON='2029-06-30';
const weekdays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const label=(day,options)=>new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',...options}).format(new Date(day+'T12:00Z'));
export function monthDates(day){
 if(!isCivilDate(day))throw Error('Invalid calendar date.');
 const first=day.slice(0,7)+'-01',start=addDays(first,-((weekday(first)+6)%7));
 return Array.from({length:42},(_,i)=>addDays(start,i));
}
function addMonthsClamped(day,months){
 const date=new Date(day+'T12:00Z'),d=date.getUTCDate();date.setUTCDate(1);
 date.setUTCMonth(date.getUTCMonth()+months);
 const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0,12)).getUTCDate();date.setUTCDate(Math.min(d,last));return date.toISOString().slice(0,10);
}
export function navigateDate(day,mode,direction,semesters=[]){
 if(!isCivilDate(day))throw Error('Invalid calendar date.');
 if(['Day','Week','42 days'].includes(mode))return addDays(day,direction*(mode==='Day'?1:mode==='Week'?7:42));
 if(mode==='Semester'){
  const ordered=[...semesters].filter(x=>x.start&&x.end).sort((a,b)=>a.start.localeCompare(b.start));
  const current=ordered.find(x=>day>=x.start&&day<=x.end);
  if(current){
   const target=ordered[ordered.indexOf(current)+direction];
   return target?(direction>0?target.start:target.end):addMonthsClamped(day,direction*6);
  }
  const target=direction>0?ordered.find(x=>x.start>day):[...ordered].reverse().find(x=>x.end<day);
  return target?(direction>0?target.start:target.end):addMonthsClamped(day,direction*6);
 }
 return addMonthsClamped(day,direction*(mode==='3-Year'?36:mode==='Year'?12:1));
}
// Cache only derived rows. Identity changes on every persisted save or cross-tab refresh.
const cache=new WeakMap();
export function calendarRows(s,anchor,start,end,catalog){
 let saved=cache.get(s);
 if(!saved||saved.anchor!==anchor||saved.catalog!==catalog){saved={anchor,catalog,end:'',rows:[]};cache.set(s,saved);}
 const futureEnd=end>HORIZON?HORIZON:end;
 if(futureEnd>=anchor&&futureEnd>saved.end){saved.rows=project(s,anchor,futureEnd,catalog);saved.end=futureEnd;}
 const map=new Map(saved.rows.map(p=>[p.day,p]));
 const result=[];
 for(let d=start;d<=end;d=addDays(d,1))result.push(d<anchor?historicalDay(s,d):map.get(d)||{day:d,band:'scenario',kind:'unavailable',minutes:0,reason:'Outside the projection horizon',task:null,unit:null});
 return result;
}
const title=p=>p.task?`${p.task.resource} ${p.task.section} · ${p.task.heading}${p.blocks?.slice(1).map(b=>` + ${esc(b.task.resource)}`).join('')}`:p.unit?`${p.unit.resource} ${p.unit.unitRef} · ${p.unit.heading}`:p.band==='actual'&&p.attempts.length?p.attempts.map(e=>e.taskSnapshot?.heading||e.taskId).join(' · '):p.reason;
const band=p=>p.band==='actual'?'RECORDED HISTORY':p.band==='actionable'?'ACTIONABLE · PROJECTED ALLOCATION':p.band==='tentative'?'TENTATIVE':'PROVISIONAL · NOT AN ASSIGNMENT';
function details(p,today){
 if(!p)return '';
 return `<section class="panel calendar-detail" aria-label="Selected date details"><h2>${esc(label(p.day,{weekday:'long',day:'numeric',month:'long',year:'numeric'}))}</h2><p class="tiny-label">${band(p)}${p.notActivated?' · NOT ACTIVATED':''}</p><h3>${esc(title(p))}</h3><p>${esc(p.task?.action||p.reason)}</p>${p.blocks?.map(b=>`<p><span class="block-kind block-${b.kind}">${b.kind}</span> ${esc(b.task.resource)} ${b.task.section} · ${esc(b.task.heading)} — ${Math.round(b.minutes)} min</p>`).join('')||''}<p>${p.minutes?`${Math.round(p.minutes)} min · ${p.band==='actual'?'recorded':'estimated'}`:'No study allocation'}</p><p class="muted">${esc(p.confidence||'')} ${p.band==='actual'?'':'Unknown ENSAM requirements remain unallocated; this is not a promise of free time.'}</p>${p.attempts?.map(e=>`<p>${esc(e.outcome)} · ${Math.round(e.minutes)} min${e.note?' · '+esc(e.note):''}</p>`).join('')||''}${p.task?`<button class="text-button" data-edit="${esc(p.task.id)}">Review task and provenance</button>`:''}${p.unit?`<button class="text-button" data-source-unit="${esc(p.unit.id)}">Review source and provenance</button>`:''}${p.day>=today&&p.day<addDays(today,14)?`<button class="text-button" data-day="${p.day}">Adjust availability</button>`:''}${p.windows?.map(w=>`<p class="small">${esc(w.title)} · ${esc(w.confidence||'user / supplied dates')} · ${esc(w.start_date)}–${esc(w.end_date_inclusive)}</p>`).join('')||''}</section>`;
}
function matrix(month,map,today,selected,compact=false){
 return `<section class="calendar-month ${compact?'compact-month':''}" aria-label="${esc(label(month,{month:'long',year:'numeric'}))}">${compact?`<h3><button class="text-button" data-calendar-month="${month}">${esc(label(month,{month:'long',year:'numeric'}))}</button></h3>`:''}<div class="calendar-matrix">${weekdays.map(w=>`<span class="weekday-heading">${w}</span>`).join('')}${monthDates(month).map(day=>{
 const p=map.get(day),outside=day.slice(0,7)!==month.slice(0,7),kind=p?.track==='academic'||p?.kind==='academic'?'academic':p?.task||p?.unit?'study':p?.minutes?'actual':p?.kind==='rest'?'rest':'empty';
 return `<button class="calendar-cell ${outside?'outside-month':''} ${day===selected?'selected-date':''} ${day===today?'is-today':''}" data-calendar-date="${day}" data-kind="${kind}" data-band="${p?.band||'scenario'}" ${day>HORIZON?'disabled':''} ${day===today?'aria-current="date"':''} aria-pressed="${day===selected}" aria-label="${day} · ${esc(p?title(p):'No allocation')}" title="${esc(p?band(p)+' · '+title(p):day)}"><span>${Number(day.slice(-2))}</span><i aria-hidden="true"></i>${!compact?`<small>${esc(p?title(p):'')}</small><span class="cell-band">${p?band(p).split(' · ')[0]:''}</span>`:''}</button>`;
 }).join('')}</div></section>`;
}
export function renderCalendarView(s,today,mode,catalog,selected=today){
 if(!isCivilDate(selected)||selected>HORIZON)selected=today<=HORIZON?today:HORIZON;
 const modes=['Day','Week','Month','Year','3-Year','42 days','Semester'];if(!modes.includes(mode))mode='Month';
 let start=selected,end=selected,months=[];
 if(mode==='Month'){months=[selected.slice(0,7)+'-01'];start=monthDates(selected)[0];end=monthDates(selected).at(-1);}
 else if(mode==='Week'){start=addDays(selected,-((weekday(selected)+6)%7));end=addDays(start,6);}
 else if(mode==='42 days')end=addDays(start,41);
 else if(mode==='Year'||mode==='3-Year'||mode==='Semester'){
  const sem=semesterFor(s,selected);
  const first=mode==='3-Year'?(s.semesters[0]?.start||'2026-09-01'):mode==='Semester'?(sem?.start||selected):selected.slice(0,4)+'-01-01';
  const last=mode==='3-Year'?HORIZON:mode==='Semester'?(sem?.end||selected):selected.slice(0,4)+'-12-31';
  for(let m=first.slice(0,7)+'-01';m<=last&&m<=HORIZON;m=navigateDate(m,'Month',1))months.push(m);
  start=monthDates(months[0]||selected)[0];end=monthDates(months.at(-1)||selected).at(-1);
 }
 const rows=calendarRows(s,today,start,end,catalog),map=new Map(rows.map(p=>[p.day,p]));
 const chosen=map.get(selected)||calendarRows(s,today,selected,selected,catalog)[0];
 let content=months.length?`<div class="${mode==='Month'?'':'calendar-months'}">${months.map(m=>matrix(m,map,today,selected,mode!=='Month')).join('')}</div>`:`<div class="calendar-agenda">${rows.map(p=>`<button class="agenda-day ${p.day===selected?'selected-date':''}" data-calendar-date="${p.day}" data-band="${p.band}"><b>${esc(label(p.day,{weekday:'short',day:'numeric',month:'short'}))}</b><span><small>${band(p)}</small><strong>${esc(title(p))}</strong></span><span>${Math.round(p.minutes)||'—'} min</span></button>`).join('')}</div>`;
 const risks=deadlineRisks(s,today);
 const sem=semesterFor(s,selected);
 const heading=mode==='Day'?label(selected,{weekday:'long',day:'numeric',month:'long',year:'numeric'}):
  mode==='Week'?`${label(start,{day:'numeric',month:'short'})} – ${label(end,{day:'numeric',month:'short',year:'numeric'})}`:
  mode==='42 days'?`${label(start,{day:'numeric',month:'short'})} – ${label(end,{day:'numeric',month:'short',year:'numeric'})}`:
  mode==='Month'?label(selected,{month:'long',year:'numeric'}):
  mode==='Year'?selected.slice(0,4):
  mode==='Semester'?(sem?`S${sem.id} · ${sem.title}`:label(selected,{month:'long',year:'numeric'})):
  `${label(start,{month:'short',year:'numeric'})} – ${label(end,{month:'short',year:'numeric'})}`;
 const jump=`<label class="calendar-jump">Jump to<select id="calendar-jump"><option value="">Choose a date…</option><option value="${today}">Today</option>${s.semesters.map(x=>`<option value="${x.start}" data-semester="${x.id}">S${x.id} · ${esc(x.title)}</option>`).join('')}</select></label>`;
 const windows=s.calendar.filter(w=>w.start_date<=end&&w.end_date_inclusive>=start);
 return `<div class="page-heading compact"><div><p class="eyebrow">14 DAYS ACTIONABLE · 42 DAYS TENTATIVE · THROUGH JUNE 2029</p><h1>Structure, <em>with breathing room.</em></h1><p class="subtitle">Saved outcomes are facts. Future allocations assume progress.</p></div><button class="secondary" data-action="new">+ Add a task</button></div><div class="tabs calendar-modes">${modes.map(m=>`<button data-calendar-mode="${m}" aria-pressed="${mode===m}" class="${mode===m?'selected':''}">${m}</button>`).join('')}</div><div class="calendar-navigation"><button class="secondary" data-calendar-step="-1" aria-label="Previous ${mode}">←</button><h2>${esc(heading)}</h2><button class="secondary" data-calendar-step="1" aria-label="Next ${mode}">→</button><button class="text-button" data-calendar-today>Today</button>${jump}<form id="calendar-date-form" class="calendar-date-form"><label>Go to date<input id="calendar-start" aria-label="Calendar start" type="date" min="${esc(s.semesters[0]?.start||'2026-09-01')}" max="${HORIZON}" value="${selected}" required></label><button class="secondary" type="submit">Go</button></form></div><p class="muted small">Study ● · ENSAM ◇ · Rest ○. Days 0–13 actionable, 14–41 tentative, later provisional. NOT ACTIVATED sources appear only as estimates. Future semester dates and teacher requirements may be unknown.</p>${risks.length?`<div class="quiet-notice"><p>Confirmed deadlines need attention</p>${risks.map(r=>`<p>${esc(r.title)} · ${r.overdue?'overdue · ':''}${Math.ceil(r.shortfall)} min not placeable before ${esc(r.assessmentThrough)}${r.blockedPrerequisite?' · blocked prerequisite':''}${r.limitedHorizon?' · assessment limited to one year':''}</p>`).join('')}</div>`:''}${content}${details(chosen,today)}<h2 class="section-title">Academic commitments</h2><button class="secondary" data-action="new-window">+ Add protected window</button><div class="event-grid">${windows.map(w=>`<article class="event-card"><small>${w.active?'ENABLED':'DISABLED / CONDITIONAL'} · ${esc(w.confidence||'Supplied / user dates')}</small><h3>${esc(w.title)}</h3><p>${esc(w.start_date)} – ${esc(w.end_date_inclusive)}</p><button class="text-button" data-event="${esc(w.id)}">Edit dates →</button></article>`).join('')}</div>`;
}
