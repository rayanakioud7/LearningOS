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
function renderResourceCard(s,r,catalog,done,semester){
 const stats=resourceStats(s,r.id,catalog,done,semester),total=stats.tasks.length+stats.missing;
 return `<article class="resource-card ${r.enabled===false?'is-suspended':''}"><div class="resource-card-head"><div><span class="tiny-label">${esc(resourceSemesters(s,r,catalog))} · ${r.enabled===false?'SUSPENDED':'ENABLED'}</span><h3>${esc(r.name)}</h3><p>${esc(r.edition||'Edition unconfirmed')}</p></div><span class="resource-progress-number">${stats.completed}/${Math.max(stats.tasks.length,total)} <small>done</small></span></div><div class="resource-card-meta"><span>${stats.active} active</span><span>${stats.draft} draft</span><span>${stats.missing} catalog ${stats.missing===1?'unit':'units'} not staged</span><span>${stats.units.length} source ${stats.units.length===1?'unit':'units'}</span></div><div class="resource-card-actions"><button class="secondary" data-resource-view="${esc(r.id)}">View contents →</button><button class="text-button" data-resource-edit="${esc(r.id)}">Edit resource</button><button class="text-button" data-resource-toggle="${esc(r.id)}">${r.enabled===false?'Enable resource':'Suspend resource'}</button></div></article>`;
}
function renderResourceDetail(s,r,{catalog,search='',semester='',done}){
 const catalogUnits=(catalog?.units||[]).filter(u=>u.resourceId===r.id);
 const stateUnits=new Map(s.units.map(u=>[u.id,u]));
 const tasks=s.tasks.filter(t=>t.resourceId===r.id);
 const taskByUnit=new Map(tasks.map(t=>[t.unitId,t]));
 const taskByKey=new Map();
 for(const t of tasks){const u=stateUnits.get(t.unitId);if(u)taskByKey.set(unitKey(t.resourceId,u.unitRef),t);}
 const shown=new Set();
 const matchedCatalogUnit=u=>taskByUnit.get(u.id)||taskByKey.get(unitKey(r.id,u.unitRef));
 const term=String(search||'').toLowerCase().trim();
 for(const u of catalogUnits){const t=matchedCatalogUnit(u);if(t)shown.add(t.id);}
 const visibleUnits=catalogUnits.filter(u=>{
  if(semester&&u.semester!==Number(semester))return false;
  return !term||`${u.unitRef} ${u.heading} ${u.activity}`.toLowerCase().includes(term);
 }).sort((a,b)=>a.semester-b.semester||naturalOrder.compare(String(a.order??a.unitRef),String(b.order??b.unitRef)));
 const standalone=tasks.filter(t=>!shown.has(t.id)).filter(t=>{
  if(semester&&t.semester!==Number(semester))return false;
  return !term||`${t.section} ${t.heading} ${t.action}`.toLowerCase().includes(term);
 }).sort((a,b)=>(a.order??999)-(b.order??999)||a.id.localeCompare(b.id));
 const missing=visibleUnits.filter(u=>!matchedCatalogUnit(u)).length;
 const missingAll=catalogUnits.filter(u=>!matchedCatalogUnit(u)).length;
 const completed=tasks.filter(t=>done.has(t.id)).length;
 const unitRow=(u,t)=>{
  const status=t?resourceTaskState(s,r.id,t,done):'catalog';
  const ref=u.unitRef||u.section||'Source unit';
  const heading=t?.heading||u.heading||'Untitled unit';
  const activity=t?.action||u.activity||'Review this source unit and author a concrete next action.';
  const evidence=t?.evidence||u.completionEvidence||'Evidence is confirmed by you after the work is done.';
  const minutes=t?.remainingMinutes??t?.minutes??u.estimatedMinutes;
  const link=sourceLink(u.link||t?.url);
  const dependencies=(u.dependencies||t?.prerequisites||[]).length;
  return `<article class="unit-row ${status}"><span class="unit-mark" aria-hidden="true">${statusMark(status)}</span><div class="unit-copy"><span class="tiny-label">S${u.semester||t?.semester||'—'} · ${esc(ref)} · ${esc(u.headingConfidence||u.confidence||'source unit')}${u.branch?' · OPTIONAL BRANCH':''}</span><h3>${esc(heading)}</h3><p>${esc(activity)}</p><small>${minutes?`${Math.round(minutes*10)/10} min estimate · `:''}${dependencies} ${dependencies===1?'prerequisite':'prerequisites'} · ${t?(t.reviewed?'reviewed':'needs review'):'not staged'}<br>${esc(evidence)}</small></div><div class="unit-actions"><span class="${statusClass(status)}">${statusLabel(status)}</span>${t?`<button class="text-button" data-edit="${esc(t.id)}">Review →</button>`:`<button class="text-button" data-stage-unit="${esc(u.id)}">Stage unit →</button>`}${link?`<a class="text-button" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Source ↗</a>`:''}</div></article>`;
 };
 const taskRow=t=>{
  const status=resourceTaskState(s,r.id,t,done),u=stateUnits.get(t.unitId);
  return `<article class="unit-row ${status}"><span class="unit-mark" aria-hidden="true">${statusMark(status)}</span><div class="unit-copy"><span class="tiny-label">S${t.semester} · ${esc(t.section||'Imported task')} · IMPORTED ${t.status==='draft'?'DRAFT':'TASK'}</span><h3>${esc(t.heading)}</h3><p>${esc(t.action)}</p><small>${t.minutes} min estimate · ${t.prerequisites.length} ${t.prerequisites.length===1?'prerequisite':'prerequisites'} · ${t.reviewed?'reviewed':'needs review'}<br>${esc(t.evidence||u?.completionEvidence||'')}</small></div><div class="unit-actions"><span class="${statusClass(status)}">${statusLabel(status)}</span><button class="text-button" data-edit="${esc(t.id)}">Review →</button>${sourceLink(t.url)?`<a class="text-button" href="${esc(sourceLink(t.url))}" target="_blank" rel="noopener noreferrer">Source ↗</a>`:''}</div></article>`;
 };
 return `<div class="page-heading compact"><div><button class="text-button" data-resource-back>← All resources</button><p class="eyebrow">RESOURCE CONTENTS</p><h1>${esc(r.name)}</h1><p class="subtitle">${esc(r.edition||'Edition unconfirmed')} · ${resourceSemesters(s,r,catalog)} · ${r.enabled===false?'suspended':'enabled'}</p></div><div class="button-row"><button class="secondary" data-resource-edit="${esc(r.id)}">Edit resource</button><button class="text-button" data-resource-toggle="${esc(r.id)}">${r.enabled===false?'Enable resource':'Suspend resource'}</button></div></div><div class="resource-detail-stats"><div><b>${catalogUnits.length}</b><span>source units</span></div><div><b>${tasks.length}</b><span>staged tasks</span></div><div><b>${completed}</b><span>completed</span></div><div><b>${missing}</b><span>not staged</span></div></div>${missingAll?`<div class="resource-stage-bar"><p>${missingAll} source ${missingAll===1?'unit is':'units are'} available to stage. Staging creates review drafts; it does not activate or complete work.</p><button class="secondary" data-resource-stage-all="${esc(r.id)}">Stage missing ${missingAll} ${missingAll===1?'unit':'units'}</button></div>`:''}<div class="library-toolbar resource-detail-toolbar"><input id="search" aria-label="Search this resource" placeholder="Search chapters or headings…" value="${esc(search)}"><div class="tabs"><span class="status-legend">● active · ◔ draft · ✓ complete</span></div></div>${semester?`<p class="muted small">Showing S${esc(semester)} only. Clear the semester filter to see the complete resource.</p>`:''}<section class="resource-contents"><div class="resource-contents-heading"><h2>Source units and staged tasks</h2><small>${visibleUnits.length} source ${visibleUnits.length===1?'unit':'units'} · ${standalone.length} imported ${standalone.length===1?'task':'tasks'} outside the catalog</small></div>${visibleUnits.map(u=>unitRow(u,matchedCatalogUnit(u))).join('')}${standalone.length?`<h3 class="section-title">Imported tasks outside the catalog</h3>${standalone.map(taskRow).join('')}`:''}${!visibleUnits.length&&!standalone.length?'<p class="empty">No matching chapters. Clear the search or semester filter.</p>':''}</section>`;
}
export function renderCurriculumView(s,{search='',filter='active',semester='',resource='',catalog,resourceDetail=''}){
 const done=completed(s);
 const selectedResource=resourceDetail||resource;
 if(selectedResource){
  const r=s.resources.find(x=>x.id===selectedResource)||(catalog?.resources||[]).find(x=>x.id===selectedResource);
  if(r)return renderResourceDetail(s,r,{catalog,search,semester,done});
 }
 const resourceMap=new Map([...(catalog?.resources||[]),...s.resources].map(r=>[r.id,r]));
 const groups=[...resourceMap.values()].filter(r=>(!resource||r.id===resource)&&(!semester||[...s.tasks.filter(t=>t.resourceId===r.id),...(catalog?.units||[]).filter(u=>u.resourceId===r.id)].some(x=>x.semester===Number(semester)))&&resourceMatchesSearch(s,r,catalog,search)&&resourceMatchesFilter(s,r,catalog,filter,done,semester)).sort((a,b)=>(a.order??999)-(b.order??999)||(a.priority??9)-(b.priority??9)||a.name.localeCompare(b.name));
 return `<div class="page-heading compact"><div><p class="eyebrow">YOUR LIVING CURRICULUM</p><h1>A steady <em>direction.</em></h1><p class="subtitle">Open a resource to see every source unit, then stage only what you are ready to study.</p></div><div class="button-row"><button class="secondary" data-action="catalog">Review catalog import</button><button class="primary" data-action="new">+ Add ENSAM course / task</button></div></div><div class="tabs semester-tabs" role="tablist" aria-label="Curriculum semester"><button role="tab" data-semester-select="" aria-selected="${!semester}" tabindex="${!semester?0:-1}" class="${!semester?'selected':''}">All</button>${s.semesters.map(sem=>`<button role="tab" data-semester-select="${sem.id}" aria-selected="${String(sem.id)===semester}" tabindex="${String(sem.id)===semester?0:-1}" class="${String(sem.id)===semester?'selected':''}">S${sem.id}</button>`).join('')}</div><details class="semester-overview"><summary>Six-semester overview and date assumptions</summary><div class="phase-strip">${s.semesters.map(sem=>`<div><small>${sem.confidence==='planning_assumption'?'TENTATIVE':'2026–27 PLANNING ENVELOPE'}</small>S${sem.id} · ${esc(sem.title)}<button class="text-button" data-semester-edit="${sem.id}">Edit dates</button></div>`).join('')}</div></details><p class="muted small">${catalog?.units?.length||0} public catalog units available for review. ${s.archiveRegistry.length} private archive references contain no filenames or documents. A resource with “catalog units not staged” is not empty — open it to see the chapters. Only reviewed + activated tasks are actionable.</p><div class="library-toolbar"><div class="tabs">${['active','draft','completed','suspended','catalog','all'].map(x=>`<button data-filter="${x}" class="${filter===x?'selected':''}">${x==='draft'?'Draft':x==='catalog'?'Catalog':x}</button>`).join('')}</div><input id="search" aria-label="Search curriculum" placeholder="Search topics, chapters or resources…" value="${esc(search)}"></div><div class="form-columns"><label>Semester<select id="semester-filter"><option value="">All semesters</option>${s.semesters.map(x=>`<option value="${x.id}" ${String(x.id)===semester?'selected':''}>S${x.id} · ${esc(x.title)}</option>`).join('')}</select></label><label>Resource<select id="resource-filter"><option value="">All resources</option>${[...resourceMap.values()].sort((a,b)=>a.name.localeCompare(b.name)).map(r=>`<option value="${esc(r.id)}" ${r.id===resource?'selected':''}>${esc(r.name)}</option>`).join('')}</select></label></div><p class="resource-list-note">${groups.length} resources match · click <b>View contents</b> to browse the full table of contents.</p><div class="resource-list">${groups.map(r=>renderResourceCard(s,r,catalog,done,semester)).join('')||'<p class="empty">No resources match this filter. Try “All”, clear the semester filter, or review the catalog import.</p>'}</div>`;
}

export function renderPlanningSettings(s){const strict=s.planning?.roadmap?.version>=4;return `<section class="panel planning-settings"><h2>Availability and protection</h2><p class="muted">Your semester roadmap supplies the study rhythm. Set the time actually available after classes, commute and rest. All academic and independent work shares that time; exam protection wins.</p>${strict?'':`${s.calendarSlots.map(slot=>`<div class="slot-editor"><b>${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][slot.day]}</b><label>Independent min<input name="slot-${slot.day}" type="number" min="0" max="${[0,3,5].includes(slot.day)?0:slot.day===6?180:90}" ${[0,3,5].includes(slot.day)?'readonly':''} value="${slot.minutes}"></label><label class="checkbox"><input name="fixed-${slot.day}" type="checkbox" ${slot.fixed?'checked':''}> Fixed role</label></div>`).join('')}<div class="resource-picker"><span class="resource-picker-title">Preferred subjects <small>Used as a scheduling tie-breaker; prerequisites still come first.</small></span><div class="resource-picks">${s.resources.map(r=>`<label class="resource-pick"><input type="checkbox" name="preferredResources" value="${esc(r.id)}" ${s.settings.preferredResources.includes(r.id)?'checked':''}><span><b>${esc(r.name)}</b><small>${esc(r.edition||'Edition unconfirmed')} · S${r.semester??'—'}</small></span></label>`).join('')}</div></div>`}<label>Summer weekly ceiling (minutes)<input type="number" name="summerWeeklyMinutes" min="0" max="900" value="${s.settings.summerWeeklyMinutes??(s.settings.weeklyMinutes<480?s.settings.weeklyMinutes:780)}"></label><label>Exam-prep lead days<input type="number" name="examPrepLeadDays" min="0" max="90" value="${s.settings.examPrepLeadDays}"></label><label class="checkbox"><input type="checkbox" name="pfeMode" ${s.settings.pfeMode?'checked':''}> PFE priority (pause independent study)</label><label>Recovery dates, comma-separated<input name="recoveryDays" value="${esc(s.settings.recoveryDays.join(', '))}" placeholder="2026-11-20, 2026-11-23"></label>${strict?'':`<label class="checkbox"><input name="crossDayRescue" type="checkbox" ${s.settings.crossDayRescue?'checked':''}> Allow small partials in unused slack (never replace a home-track block)</label><label>Small partial threshold (minutes)<input name="smallResidualMinutes" type="number" min="1" max="50" value="${s.settings.smallResidualMinutes??30}"></label>`}<p class="muted">Actual discretionary time shared by all study, before campus reservations:</p><div class="form-columns">${Array.from({length:7},(_,day)=>`<label>${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][day]} available min<input name="available-${day}" type="number" min="0" max="1440" value="${s.settings.discretionaryMinutes?.[day]??(day===6?s.settings.saturdayMinutes:s.settings.dailyMinutes)}"></label>`).join('')}</div><p class="muted">Campus timetable: reserve unavailable minutes from each day’s study capacity.</p><div class="form-columns">${Array.from({length:7},(_,day)=>`<label>${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][day]} unavailable min<input name="campus-${day}" type="number" min="0" max="1440" value="${s.settings.campusTimetable.find(c=>c.day===day)?.minutes||0}"></label>`).join('')}</div><button class="primary" type="submit">Save all preferences</button></section>`;}
export function taskProvenance(s,t,day){const e=explainTask(s,t,day);return `<div class="provenance"><p><b>${esc(e.confidence)}</b> · ${esc(e.source)}</p><p>Source-defined heading: ${esc(e.heading)}<br>Edition: ${esc(e.edition)}</p><p>AUTHORED action: ${esc(e.objective)}<br>ESTIMATED effort: ${t.minutes} min</p><p>Why today: ${esc(e.why)}</p><p>Completion evidence: ${esc(e.evidence)}</p><p>Prerequisites: ${e.prerequisites.map(p=>`${p.satisfied?'✓':'○'} ${esc(p.id)} · ${esc(p.heading)}`).join('; ')||'None'}</p>${e.attachment?`<p>Private local document: ${esc(e.attachment)}</p>`:''}</div>`;}
export function renderWindowEditor(t){return `<form id="event-form"><p class="eyebrow">ACADEMIC WINDOW</p><h2>${esc(t.title)}</h2><label>Window name<input name="title" value="${esc(t.title)}" required></label><label>Protection type<select name="kind">${['exam_window','exam_prep','conditional_resit','recovery','no_work','holiday','teaching','readiness'].map(k=>`<option value="${k}" ${t.kind===k?'selected':''}>${esc(k.replaceAll('_',' '))}</option>`).join('')}</select></label><p class="small muted">${esc(t.provenance||'A calendar window is separate from your personal exam timetable. Enter only dates you want to use.')}</p><label>Start date<input name="start" type="date" value="${t.start_date}" required></label><label>End date (inclusive)<input name="end" type="date" value="${t.end_date_inclusive}" required></label><label class="checkbox"><input type="checkbox" name="active" ${t.active?'checked':''}> Enable this window</label><div class="dialog-actions"><button type="button" data-close class="text-button">Cancel</button><button class="primary">Save dates</button></div></form>`;}
