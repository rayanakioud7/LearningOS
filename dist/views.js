import {completed} from './engine.js';
import {explainTask} from './planner.js';
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function pretty(day,opts={weekday:'short',month:'short',day:'numeric'}){return new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',...opts}).format(new Date(day+'T12:00:00Z'));}
export {renderCalendarView} from './calendar-view.js';
const naturalOrder=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
const normalizeRef=value=>String(value||'').replace(/[§\s]/g,'').toLowerCase();
const unitKey=(resourceId,ref)=>`${resourceId}|${normalizeRef(ref)}`;
const sourceLink=link=>{try{const u=new URL(link);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
const statusLabel=status=>({catalog:'Not staged',draft:'Draft',active:'Active',completed:'Completed',suspended:'Suspended'}[status]||status);
const statusClass=status=>`unit-status ${status}`;
const statusMark=status=>status==='completed'?'✓':status==='active'?'●':status==='draft'?'◔':status==='suspended'?'—':'·';
function resourceTaskState(s,resourceId,task,done){
 const unit=s.units.find(u=>u.id===task.unitId);
 if(task.archived||unit?.suspended)return 'suspended';
 if(done.has(task.id))return 'completed';
 return task.status==='active'?'active':'draft';
}
function resourceStats(s,resourceId,catalog,done,semester=''){
 const tasks=s.tasks.filter(t=>t.resourceId===resourceId&&(!semester||t.semester===Number(semester)));
 const units=(catalog?.units||[]).filter(u=>u.resourceId===resourceId&&(!semester||u.semester===Number(semester)));
 const stateUnits=new Map(s.units.map(u=>[u.id,u]));
 const taskByKey=new Map();
 for(const t of tasks){const u=stateUnits.get(t.unitId);if(u)taskByKey.set(unitKey(t.resourceId,u.unitRef),t);}
 const taskByUnit=new Map(tasks.map(t=>[t.unitId,t]));
 let missing=0;
 for(const u of units){const t=taskByUnit.get(u.id)||taskByKey.get(unitKey(resourceId,u.unitRef));if(!t)missing++;}
 return {tasks,units,missing,completed:tasks.filter(t=>done.has(t.id)).length,active:tasks.filter(t=>resourceTaskState(s,resourceId,t,done)==='active').length,draft:tasks.filter(t=>resourceTaskState(s,resourceId,t,done)==='draft').length,suspended:tasks.filter(t=>resourceTaskState(s,resourceId,t,done)==='suspended').length};
}
function resourceMatchesFilter(s,r,catalog,filter,done,semester){
 const stats=resourceStats(s,r.id,catalog,done,semester);
 if(filter==='active')return stats.active>0;
 if(filter==='draft')return stats.draft>0;
 if(filter==='completed')return stats.completed>0;
 if(filter==='suspended')return stats.suspended>0||r.enabled===false;
 if(filter==='catalog')return stats.missing>0;
 return true;
}
function resourceMatchesSearch(s,r,catalog,search){
 const term=String(search||'').toLowerCase().trim();
 if(!term)return true;
 if(`${r.name} ${r.edition} ${r.source||''}`.toLowerCase().includes(term))return true;
 if(s.tasks.some(t=>t.resourceId===r.id&&`${t.section} ${t.heading} ${t.action}`.toLowerCase().includes(term)))return true;
 return (catalog?.units||[]).some(u=>u.resourceId===r.id&&`${u.unitRef} ${u.heading} ${u.activity}`.toLowerCase().includes(term));
}
function resourceSemesters(s,r,catalog){
 const values=new Set([...s.tasks.filter(t=>t.resourceId===r.id).map(t=>t.semester),...(catalog?.units||[]).filter(u=>u.resourceId===r.id).map(u=>u.semester)].filter(Boolean));
 const sorted=[...values].sort((a,b)=>a-b);
 if(!sorted.length)return 'Semester not set';
 return sorted.length===1?`S${sorted[0]}`:`S${sorted[0]}–S${sorted.at(-1)}`;
}
function statusPicker(filter){return `<label class="status-picker">Show<select id="status-filter" aria-label="Task status">${[['all','Everything'],['active','Active'],['draft','Needs review'],['completed','Completed'],['catalog','Available to add'],['suspended','Suspended']].map(([value,label])=>`<option value="${value}" ${value===filter?'selected':''}>${label}</option>`).join('')}</select></label>`;}
function renderResourceCard(s,r,catalog,done,semester){
 const stats=resourceStats(s,r.id,catalog,done,semester);
 const counts=[stats.active?`${stats.active} active`:'',stats.draft?`${stats.draft} need review`:'',stats.completed?`${stats.completed} completed`:'',stats.missing?`${stats.missing} available`:''].filter(Boolean);
 return `<article class="resource-card ${r.enabled===false?'is-suspended':''}"><div class="resource-card-head"><div><h3>${esc(r.name)}</h3><p>${esc(resourceSemesters(s,r,catalog))}${r.enabled===false?' · Suspended':''}</p></div></div><p class="resource-card-meta">${counts.map(x=>`<span>${esc(x)}</span>`).join('')||'No saved tasks yet'}</p><button class="secondary" data-resource-view="${esc(r.id)}" aria-label="View contents →">View contents →</button></article>`;
}
function renderResourceDetail(s,r,{catalog,search='',semester='',filter='all',done}){
 const catalogUnits=(catalog?.units||[]).filter(u=>u.resourceId===r.id);
 const stateUnits=new Map(s.units.map(u=>[u.id,u]));
 const tasks=s.tasks.filter(t=>t.resourceId===r.id);
 const taskByUnit=new Map(tasks.map(t=>[t.unitId,t]));
 const taskByKey=new Map();
 for(const t of tasks){const u=stateUnits.get(t.unitId);if(u)taskByKey.set(unitKey(r.id,u.unitRef),t);}
 const match=u=>taskByUnit.get(u.id)||taskByKey.get(unitKey(r.id,u.unitRef));
 const shown=new Set(catalogUnits.map(u=>match(u)?.id).filter(Boolean));
 const term=String(search).toLowerCase().trim();
 const included=(u,t)=>{
  if(semester&&(u.semester||t?.semester)!==Number(semester))return false;
  const status=t?resourceTaskState(s,r.id,t,done):'catalog';
  if(filter!=='all'&&filter!==status)return false;
  return !term||[u.unitRef,u.heading,u.activity,t?.section,t?.heading,t?.action].join(' ').toLowerCase().includes(term);
 };
 const visible=catalogUnits.filter(u=>included(u,match(u))).sort((a,b)=>a.semester-b.semester||naturalOrder.compare(String(a.order??a.unitRef),String(b.order??b.unitRef)));
 const standalone=tasks.filter(t=>!shown.has(t.id)&&included({semester:t.semester},t)).sort((a,b)=>(a.order??999)-(b.order??999)||naturalOrder.compare(a.section,b.section));
 const missingAll=catalogUnits.filter(u=>!match(u)).length;
 const row=(u,t)=>{
  const status=t?resourceTaskState(s,r.id,t,done):'catalog';
  const ref=t?.section||u.unitRef||'Source unit',heading=t?.heading||u.heading||'Untitled unit';
  const action=t?.action||u.activity||'Review this source unit and choose a concrete next action.';
  const evidence=t?.evidence||u.completionEvidence||'Confirm the evidence after doing the work.';
  const minutes=t?.remainingMinutes??t?.minutes??u.estimatedMinutes,link=sourceLink(t?.url||u.link);
  return `<article class="unit-row ${status}"><span class="unit-mark" aria-hidden="true">${statusMark(status)}</span><div class="unit-copy"><span class="tiny-label">${esc(ref)} · S${u.semester||t?.semester||'—'}</span><h3>${esc(heading)}</h3><p>${esc(action)}</p><details class="unit-evidence"><summary>${minutes?`${Math.round(minutes*10)/10} min estimate · `:''}Task details</summary><p>${esc(evidence)}</p><p class="small muted">${(u.dependencies||t?.prerequisites||[]).length} prerequisites · ${esc(u.headingConfidence||u.confidence||'Source heading')} · ${t?(t.reviewed?'Reviewed':'Needs review'):'Add as a draft before scheduling'}</p></details></div><div class="unit-actions"><span class="${statusClass(status)}">${status==='catalog'?'Available':status==='draft'?'Needs review':statusLabel(status)}</span>${t?`<button class="text-button" data-edit="${esc(t.id)}">Review →</button>`:`<button class="text-button" data-stage-unit="${esc(u.id)}">Add draft →</button>`}${link?`<a class="text-button" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Source ↗</a>`:''}</div></article>`;
 };
 return `<div class="page-heading compact resource-heading"><div><button class="text-button" data-resource-back>← All resources</button><h1>${esc(r.name)}</h1><p class="subtitle">${esc(resourceSemesters(s,r,catalog))}${r.enabled===false?' · Suspended':''} · ${tasks.filter(t=>done.has(t.id)).length} completed</p></div><details class="more-actions"><summary>Resource options</summary><div><p class="small muted">${esc(r.edition||'Edition unconfirmed')}</p><button class="text-button" data-resource-edit="${esc(r.id)}">Edit resource</button><button class="text-button" data-resource-toggle="${esc(r.id)}">${r.enabled===false?'Enable resource':'Suspend resource'}</button>${missingAll?`<p class="small muted">Add available chapters as review drafts. This does not activate or complete work.</p><button class="secondary" data-resource-stage-all="${esc(r.id)}">Stage missing ${missingAll} ${missingAll===1?'unit':'units'}</button>`:''}</div></details></div><div class="library-toolbar"><input id="search" type="search" aria-label="Search this resource" placeholder="Search chapters or tasks…" value="${esc(search)}">${statusPicker(filter)}${search||semester||filter!=='all'?'<button class="text-button" data-library-clear>Clear filters</button>':''}</div>${semester?`<p class="muted small">Showing S${esc(semester)}. Clear filters to browse every semester.</p>`:''}<section class="resource-contents"><div class="resource-contents-heading"><h2>Chapters & tasks</h2><small>${visible.length+standalone.length} shown</small></div>${visible.map(u=>row(u,match(u))).join('')}${standalone.length?`<h3 class="section-title">Your additional tasks</h3>${standalone.map(t=>row(stateUnits.get(t.unitId)||{},t)).join('')}`:''}${!visible.length&&!standalone.length?'<div class="empty"><p>No chapters match these filters.</p><button class="secondary" data-library-clear>Clear filters</button></div>':''}</section>`;
}
export function renderCurriculumView(s,{search='',filter='all',semester='',resource='',catalog,resourceDetail=''}){
 const done=completed(s),selectedResource=resourceDetail||resource;
 if(selectedResource){const r=s.resources.find(x=>x.id===selectedResource)||(catalog?.resources||[]).find(x=>x.id===selectedResource);if(r)return renderResourceDetail(s,r,{catalog,search,semester,filter,done});}
 const resourceMap=new Map([...(catalog?.resources||[]),...s.resources].map(r=>[r.id,r]));
 const groups=[...resourceMap.values()].filter(r=>(!semester||[...s.tasks.filter(t=>t.resourceId===r.id),...(catalog?.units||[]).filter(u=>u.resourceId===r.id)].some(x=>x.semester===Number(semester)))&&resourceMatchesSearch(s,r,catalog,search)&&resourceMatchesFilter(s,r,catalog,filter,done,semester)).sort((a,b)=>resourceStats(s,b.id,catalog,done,semester).active-resourceStats(s,a.id,catalog,done,semester).active||(a.order??999)-(b.order??999)||a.name.localeCompare(b.name));
 return `<div class="page-heading compact"><div><h1>Curriculum</h1><p class="subtitle">Your resources, chapters and next steps.</p></div><div class="button-row"><details class="more-actions"><summary>Add from catalog</summary><div><p class="small muted">Browse source units and import selected review drafts.</p><button class="secondary" data-action="catalog">Review catalog import</button></div></details><button class="primary" data-action="new">+ Add task</button></div></div><div class="tabs semester-tabs" role="tablist" aria-label="Curriculum semester"><button role="tab" data-semester-select="" aria-selected="${!semester}" tabindex="${!semester?0:-1}" class="${!semester?'selected':''}">All semesters</button>${s.semesters.map(sem=>`<button role="tab" data-semester-select="${sem.id}" aria-selected="${String(sem.id)===semester}" tabindex="${String(sem.id)===semester?0:-1}" class="${String(sem.id)===semester?'selected':''}">S${sem.id}</button>`).join('')}</div><div class="library-toolbar"><input id="search" type="search" aria-label="Search curriculum" placeholder="Search resources or chapters…" value="${esc(search)}">${statusPicker(filter)}${search||semester||filter!=='all'?'<button class="text-button" data-library-clear>Clear filters</button>':''}</div><p class="resource-list-note">${groups.length} ${groups.length===1?'resource':'resources'} · active resources first</p><div class="resource-list">${groups.map(r=>renderResourceCard(s,r,catalog,done,semester)).join('')||'<div class="empty"><p>No resources match these filters.</p><button class="secondary" data-library-clear>Clear filters</button></div>'}</div><details class="semester-overview"><summary>Semester dates & source information</summary><p class="muted small">${catalog?.units?.length||0} public source units. Private documents stay local. Only reviewed, active tasks enter the schedule. Future dates remain provisional.</p><div class="phase-strip">${s.semesters.map(sem=>`<div><small>${sem.confidence==='planning_assumption'?'TENTATIVE':'2026–27 PLANNING ENVELOPE'}</small>S${sem.id} · ${esc(sem.title)}<button class="text-button" data-semester-edit="${sem.id}">Edit dates</button></div>`).join('')}</div></details>`;
}

export function renderPlanningSettings(s){const strict=s.planning?.roadmap?.version>=4;return `<section class="panel planning-settings"><h2>Availability and protection</h2><p class="muted">Your semester roadmap supplies the study rhythm. Set the time actually available after classes, commute and rest. All academic and independent work shares that time; exam protection wins.</p>${strict?'':`${s.calendarSlots.map(slot=>`<div class="slot-editor"><b>${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][slot.day]}</b><label>Independent min<input name="slot-${slot.day}" type="number" min="0" max="${[0,3,5].includes(slot.day)?0:slot.day===6?180:90}" ${[0,3,5].includes(slot.day)?'readonly':''} value="${slot.minutes}"></label><label class="checkbox"><input name="fixed-${slot.day}" type="checkbox" ${slot.fixed?'checked':''}> Fixed role</label></div>`).join('')}<div class="resource-picker"><span class="resource-picker-title">Preferred subjects <small>Used as a scheduling tie-breaker; prerequisites still come first.</small></span><div class="resource-picks">${s.resources.map(r=>`<label class="resource-pick"><input type="checkbox" name="preferredResources" value="${esc(r.id)}" ${s.settings.preferredResources.includes(r.id)?'checked':''}><span><b>${esc(r.name)}</b><small>${esc(r.edition||'Edition unconfirmed')} · S${r.semester??'—'}</small></span></label>`).join('')}</div></div>`}<label>Summer weekly ceiling (minutes)<input type="number" name="summerWeeklyMinutes" min="0" max="900" value="${s.settings.summerWeeklyMinutes??(s.settings.weeklyMinutes<480?s.settings.weeklyMinutes:780)}"></label><label>Exam-prep lead days<input type="number" name="examPrepLeadDays" min="0" max="90" value="${s.settings.examPrepLeadDays}"></label><label class="checkbox"><input type="checkbox" name="pfeMode" ${s.settings.pfeMode?'checked':''}> PFE priority (pause independent study)</label><label>Recovery dates, comma-separated<input name="recoveryDays" value="${esc(s.settings.recoveryDays.join(', '))}" placeholder="2026-11-20, 2026-11-23"></label>${strict?'':`<label class="checkbox"><input name="crossDayRescue" type="checkbox" ${s.settings.crossDayRescue?'checked':''}> Allow small partials in unused slack (never replace a home-track block)</label><label>Small partial threshold (minutes)<input name="smallResidualMinutes" type="number" min="1" max="50" value="${s.settings.smallResidualMinutes??30}"></label>`}<p class="muted">Actual discretionary time shared by all study, before campus reservations:</p><div class="form-columns">${Array.from({length:7},(_,day)=>`<label>${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][day]} available min<input name="available-${day}" type="number" min="0" max="1440" value="${s.settings.discretionaryMinutes?.[day]??(day===6?s.settings.saturdayMinutes:s.settings.dailyMinutes)}"></label>`).join('')}</div><p class="muted">Campus timetable: reserve unavailable minutes from each day’s study capacity.</p><div class="form-columns">${Array.from({length:7},(_,day)=>`<label>${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][day]} unavailable min<input name="campus-${day}" type="number" min="0" max="1440" value="${s.settings.campusTimetable.find(c=>c.day===day)?.minutes||0}"></label>`).join('')}</div><button class="primary" type="submit">Save all preferences</button></section>`;}
export function taskProvenance(s,t,day){const e=explainTask(s,t,day);return `<div class="provenance"><p><b>${esc(e.confidence)}</b> · ${esc(e.source)}</p><p>Source-defined heading: ${esc(e.heading)}<br>Edition: ${esc(e.edition)}</p><p>AUTHORED action: ${esc(e.objective)}<br>ESTIMATED effort: ${t.minutes} min</p><p>Why today: ${esc(e.why)}</p><p>Completion evidence: ${esc(e.evidence)}</p><p>Prerequisites: ${e.prerequisites.map(p=>`${p.satisfied?'✓':'○'} ${esc(p.id)} · ${esc(p.heading)}`).join('; ')||'None'}</p>${e.attachment?`<p>Private local document: ${esc(e.attachment)}</p>`:''}</div>`;}
export function renderWindowEditor(t){return `<form id="event-form"><p class="eyebrow">ACADEMIC WINDOW</p><h2>${esc(t.title)}</h2><label>Window name<input name="title" value="${esc(t.title)}" required></label><label>Protection type<select name="kind">${['exam_window','exam_prep','conditional_resit','recovery','no_work','holiday','teaching','readiness'].map(k=>`<option value="${k}" ${t.kind===k?'selected':''}>${esc(k.replaceAll('_',' '))}</option>`).join('')}</select></label><p class="small muted">${esc(t.provenance||'A calendar window is separate from your personal exam timetable. Enter only dates you want to use.')}</p><label>Start date<input name="start" type="date" value="${t.start_date}" required></label><label>End date (inclusive)<input name="end" type="date" value="${t.end_date_inclusive}" required></label><label class="checkbox"><input type="checkbox" name="active" ${t.active?'checked':''}> Enable this window</label><div class="dialog-actions"><button type="button" data-close class="text-button">Cancel</button><button class="primary">Save dates</button></div></form>`;}
