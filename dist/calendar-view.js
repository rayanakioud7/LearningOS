import {activeAttempts} from './effort.js';
import {renderRoadmapDay,renderRoadmapControls,roadmapTitle} from './roadmap-view.js';
import {addDays,weekday,deadlineRisks} from './engine.js';
import {project,semesterFor} from './planner.js';
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
function calendarCache(s,anchor,catalog){
 let saved=cache.get(s);
 if(!saved||saved.anchor!==anchor||saved.catalog!==catalog){
  const history=new Map();for(const e of activeAttempts(s)){if(!history.has(e.day))history.set(e.day,[]);history.get(e.day).push(e);}
  saved={anchor,catalog,end:'',map:new Map(),history};cache.set(s,saved);
 }
 return saved;
}
export function calendarRows(s,anchor,start,end,catalog){
 if(![anchor,start,end].every(isCivilDate)||end<start)throw Error('Choose a valid calendar date range.');
 const saved=calendarCache(s,anchor,catalog),requestedEnd=end>HORIZON?HORIZON:end;
 if(requestedEnd>=anchor&&requestedEnd>saved.end){
  // Project from the original anchor for correct prerequisites; cache three
  // months ahead so ordinary next-month and day browsing need no simulation.
  const d=new Date(requestedEnd+'T12:00Z'),ahead=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+3,0,12)).toISOString().slice(0,10);
  const futureEnd=ahead>HORIZON?HORIZON:ahead;
  saved.map=new Map(project(s,anchor,futureEnd,catalog).map(p=>[p.day,p]));saved.end=futureEnd;
 }
 const result=[];
 for(let day=start;day<=end;day=addDays(day,1)){
  if(day<anchor){const attempts=saved.history.get(day)||[];result.push({day,band:'actual',kind:'history',task:null,unit:null,attempts,minutes:attempts.reduce((n,e)=>n+e.minutes,0),reason:attempts.length?'Recorded attempts · completion only when explicitly confirmed':'No recorded attempts',confidence:'Actual saved history; no forward simulation',windows:s.calendar.filter(w=>w.active&&w.start_date<=day&&w.end_date_inclusive>=day)});}
  else result.push(saved.map.get(day)||{day,band:'scenario',kind:'unavailable',minutes:0,reason:'Outside the projection horizon',task:null,unit:null});
 }
 return result;
}
export function calendarKeyDate(day,key){
 if(!isCivilDate(day))return null;
 const offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7,Home:-((weekday(day)+6)%7),End:6-((weekday(day)+6)%7)};
 return Object.hasOwn(offsets,key)?addDays(day,offsets[key]):key==='PageUp'?navigateDate(day,'Month',-1):key==='PageDown'?navigateDate(day,'Month',1):null;
}
export function allocationAction(s,task){
 if(!task)return '';
 return s.tasks.some(t=>t.id===task.id)?`<button class="text-button" data-edit="${esc(task.id)}">Task details</button>`:`<button class="text-button" data-stage-unit="${esc(task.unitId)}">Add task</button>`;
}
const sourceNames={ila:'ILA',mit1802:'MIT 18.02SC',udl:'Prince UDL',stat110:'Stat 110',geron:'Géron',huang:'PyTorch · Huang et al.',tunstall:'NLP with Transformers',raschka:'Raschka',mml:'MML',wasserman:'Wasserman','vanderplas-2e':'Python Data Science Handbook',missing:'Missing Semester',velleman:'Velleman',builder:'Builder’s Lab'};
const sourceTitle=t=>`${sourceNames[t.resourceId]||t.resource} ${/^task-[a-f\d]+$/i.test(t.section||t.unitRef||'')?'':t.section||t.unitRef||''} · ${t.heading}`;
const title=p=>p.task?sourceTitle(p.task):p.unit?sourceTitle(p.unit):p.band==='actual'&&p.attempts.length?p.attempts.map(e=>e.taskSnapshot?.heading||e.taskId).join(' · '):roadmapTitle(p);
const band=p=>p.band==='actual'?'RECORDED HISTORY':p.band==='actionable'?'ACTIONABLE · PROJECTED ALLOCATION':p.band==='tentative'?'TENTATIVE':'PROVISIONAL · NOT AN ASSIGNMENT';
function details(p,today,s){
 if(!p)return '';
 return `<section class="panel calendar-detail" aria-label="Selected date details"><h2>${esc(label(p.day,{weekday:'long',day:'numeric',month:'long',year:'numeric'}))}</h2><p class="tiny-label">${band(p)}${p.notActivated?' · NOT ACTIVATED':''}</p><h3>${esc(title(p))}</h3><p>${esc(p.task?.action||p.blocks?.[0]?.task.action||p.reason)}</p>${p.blocks?.length?`<details class="calendar-rhythm"><summary>Weekly rhythm & source information</summary>${renderRoadmapDay(p)}</details>`:renderRoadmapDay(p)}${p.blocks?.map(b=>`<p><span class="block-kind block-${b.kind}">${b.kind}</span> ${esc(b.task.resource)} ${esc(b.task.section)} · ${esc(b.task.heading)} — ${Math.round(b.minutes)} min${b.notActivated?' · NOT ACTIVATED':''} ${allocationAction(s,b.task)}</p>`).join('')||''}<p>${p.minutes?`${Math.round(p.minutes)} min · ${p.band==='actual'?'recorded':'estimated'}`:'No study allocation'}</p><p class="muted">${esc(p.confidence||'')} ${p.band==='actual'?'':'Unknown ENSAM requirements remain unallocated; this is not a promise of free time.'}</p>${p.attempts?.map(e=>`<p>${esc(e.outcome)} · ${Math.round(e.minutes)} min${e.note?' · '+esc(e.note):''}</p>`).join('')||''}${!p.blocks?.length&&p.task?allocationAction(s,p.task):''}${p.unit?`<button class="text-button" data-source-unit="${esc(p.unit.id)}">Source details</button>`:''}${p.day>=today&&p.day<addDays(today,14)?`<button class="text-button" data-day="${p.day}">Adjust availability</button>`:''}${p.windows?.map(w=>`<p class="small">${esc(w.title)} · ${esc(w.confidence||'user / supplied dates')} · ${esc(w.start_date)}–${esc(w.end_date_inclusive)}</p>`).join('')||''}</section>`;
}
function matrix(month,map,today,selected,compact=false){
 return `<section class="calendar-month ${compact?'compact-month':''}" aria-label="${esc(label(month,{month:'long',year:'numeric'}))}">${compact?`<h3><button class="text-button" data-calendar-month="${month}">${esc(label(month,{month:'long',year:'numeric'}))}</button></h3>`:''}<div class="calendar-matrix">${weekdays.map(w=>`<span class="weekday-heading">${w}</span>`).join('')}${monthDates(month).map(day=>{
 const p=map.get(day),outside=day.slice(0,7)!==month.slice(0,7),kind=p?.track==='academic'||p?.kind==='academic'?'academic':p?.task||p?.unit||!p?.protectedDay&&p?.roadmap?.blocks.some(b=>b.track==='independent')?'study':p?.minutes?'actual':p?.kind==='rest'?'rest':'empty';
 return `<button class="calendar-cell ${outside?'outside-month':''} ${day===selected?'selected-date':''} ${day===today?'is-today':''}" data-calendar-date="${day}" data-kind="${kind}" data-band="${p?.band||'scenario'}" ${day>HORIZON?'disabled':''} ${day===today?'aria-current="date"':''} tabindex="${day===(selected.slice(0,7)===month.slice(0,7)?selected:month)?0:-1}" aria-pressed="${day===selected}" aria-label="${day} · ${esc(p?title(p):'No allocation')}" title="${esc(p?band(p)+' · '+title(p):day)}"><span>${Number(day.slice(-2))}</span><i aria-hidden="true"></i>${!compact?`<small>${esc(p?title(p):'')}</small><span class="cell-band">${p?band(p).split(' · ')[0]:''}</span>`:''}</button>`;
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
 return `<div class="page-heading compact"><div><h1>Calendar</h1><p class="subtitle">Make room for the work ahead.</p></div><button class="secondary" data-action="new">+ Add a task</button></div><div class="tabs calendar-modes">${['Day','Week','Month'].map(m=>`<button data-calendar-mode="${m}" aria-pressed="${mode===m}" class="${mode===m?'selected':''}">${m}</button>`).join('')}<label class="calendar-more-label"><span class="sr-only">More calendar views</span><select id="calendar-more-mode" aria-label="More calendar views"><option value="">More views</option>${modes.filter(m=>!['Day','Week','Month'].includes(m)).map(m=>`<option value="${m}" ${mode===m?'selected':''}>${m}</option>`).join('')}</select></label></div><div class="calendar-navigation"><button class="secondary" data-calendar-step="-1" aria-label="Previous ${mode}">←</button><h2>${esc(heading)}</h2><button class="secondary" data-calendar-step="1" aria-label="Next ${mode}">→</button><button class="text-button" data-calendar-today aria-label="Go to today">Today</button><details class="calendar-jump-menu"><summary>Jump to semester</summary>${jump}</details><form id="calendar-date-form" class="calendar-date-form"><label>Go to date<input id="calendar-start" aria-label="Calendar start" type="date" min="1900-01-01" max="${HORIZON}" value="${selected}" required></label><button class="secondary" type="submit">Go</button></form></div><details class="calendar-help"><summary>How this plan works</summary><p class="muted small">Study ● · ENSAM ◇ · Rest ○. Days 0–13 actionable, 14–41 tentative, later provisional. ${s.settings.automaticCurriculum?'Active chapters follow prerequisites and available time.':'NOT ACTIVATED sources appear only as estimates.'} Future semester dates and teacher requirements may be unknown.</p></details>${risks.length?`<div class="quiet-notice"><p>Confirmed deadlines need attention</p>${risks.map(r=>`<p>${esc(r.title)} · ${r.overdue?'overdue · ':''}${Math.ceil(r.shortfall)} min not placeable before ${esc(r.assessmentThrough)}${r.blockedPrerequisite?' · blocked prerequisite':''}${r.limitedHorizon?' · assessment limited to one year':''}</p>`).join('')}</div>`:''}${content}${details(chosen,today,s)}${renderRoadmapControls(s,selected,today,catalog)}<details class="academic-windows"><summary>Academic commitments and protected dates (${windows.length})</summary><button class="secondary" data-action="new-window">+ Add protected window</button><div class="event-grid">${windows.map(w=>`<article class="event-card"><small>${w.active?'ENABLED':'DISABLED / CONDITIONAL'} · ${esc(w.confidence||'Supplied / user dates')}</small><h3>${esc(w.title)}</h3><p>${esc(w.start_date)} – ${esc(w.end_date_inclusive)}</p><button class="text-button" data-event="${esc(w.id)}">Edit dates →</button></article>`).join('')}</div></details>`;
}
