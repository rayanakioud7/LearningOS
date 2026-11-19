import {chooseRefresher,startAfterRefresher,renderRefresher,refresherLLMContext} from './refresher.js';
import {synchronizeCurriculum} from './automatic-curriculum.js';
import {renderRestorePreview} from './transfer-view.js';
import {renderOutcomeForm} from './outcome-view.js';
import {findInPlan} from './find.js';
import {renderSettingsView} from './settings-view.js';
import {parseNavigation,navigationHash} from './navigation.js';
import {toggleFocus} from './session.js';
import {updateRoadmapChoices,choicesFor} from './roadmap.js';
import {renderHistoryView} from './history-view.js';
import {navigateDate,HORIZON,calendarKeyDate} from './calendar-view.js';
import {effortFor} from './effort.js';
import {isCivilDate} from './validation.js';
import {previewImport,applyImport,migrateState,reviseTask,addLocalTask,setResourceEnabled,reviseResource,reconcileAttempts} from './curriculum.js';
import {pinToday,explainTask,semesterFor} from './planner.js';
import {renderCalendarView,renderCurriculumView,renderPlanningSettings,taskProvenance,renderWindowEditor} from './views.js';
import {openDatabase,readSaved,saveChange,migrateDatabase,refreshPlanningDatabase,refreshCurriculumDatabase} from './storage.js';
import {prepareTransfer,prepareRestore} from './backup.js';
import {renderTodayView} from './today.js';
import {studyDate,addDays,completed,dailyChoice,dayRule,forecast,recordOutcome,elapsed,validateBackup,deadlineRisks,taskIsInFocus} from './engine.js';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={today:'◉',calendar:'▦',roadmap:'⌘',history:'↶',settings:'⚙'};
let hasMigrationPoint=false,toastTimer;
let hasRestorePoint=false,catalog,planning,calendarMode='Month',calendarStart='',semesterFilter='',resourceFilter='',curriculumResource='';
let state,db,view='today',search='',filter='all',lastDate='',offlineReady=false;
let historySearch='',historyMonth='',historyPageIndex=0;
let lastRoute='',swRegistration,reloadForUpdate=false,reloading=false;
function applyRoute(route){view=route.view;if(view==='history'){historySearch=route.historySearch;historyMonth=route.historyMonth;historyPageIndex=route.historyPage;}if(view==='calendar'){calendarMode=route.calendarMode;calendarStart=route.calendarStart;}if(view==='roadmap'){semesterFilter=route.semesterFilter;curriculumResource=route.curriculumResource;resourceFilter='';filter=route.filter;search=route.search;}}
applyRoute(parseNavigation(location.hash));
const uid=()=>crypto.randomUUID();
function today(){return studyDate(new Date(),state.settings.timezone);}
function pretty(day,opts={weekday:'long',month:'short',day:'numeric'}){return new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',...opts}).format(new Date(day+'T12:00:00Z'));}
function safeLink(link){try{const u=new URL(link);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
function toast(t){clearTimeout(toastTimer);$('#toast').textContent=t;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),5000);}
function modal(html){const d=$('#modal');d.innerHTML=html;if(!d.open)d.showModal();d.setAttribute('aria-label',d.querySelector('h2')?.textContent||'Study dialog');d.querySelector('[data-close]')?.addEventListener('click',()=>d.close());}
function fatal(message){$('#app').innerHTML=`<div class="fatal"><h1>Your study space could not open</h1><p>${esc(message)}</p><p>Your existing data has not been replaced. Try a regular browser window with storage enabled.</p><button onclick="location.reload()">Try again</button></div>`;}
function openDB(){return openDatabase();}
function readDB(){return readSaved(db);}
async function commit(change,options={}){
  try{
    state=await saveChange(db,state.revision,s=>{const next=change(s);return next?.schema===2?pinToday(next,studyDate(new Date(),next.settings.timezone)):next;},state,options);
    if(options.preservePrevious)hasRestorePoint=true;channel.postMessage('changed');render();return true;
  }catch(error){toast(error.message||'Could not save. Your previous data is safe.');return false;}
}
const channel=new BroadcastChannel('ensam-state');channel.onmessage=async()=>{try{state=await readDB();hasRestorePoint=Boolean(await readSaved(db,'restore-point'));render();toast('Updated from your other tab.');}catch(error){toast('Could not refresh from the other tab. Reload before making changes.');}};
async function boot(){
  try{
    [catalog,planning]=await Promise.all(['./catalog.json','./planning.json'].map(url=>fetch(url).then(r=>{if(!r.ok)throw Error('The curriculum catalog could not load. Reopen online once to update the offline app.');return r.json();})));
    db=await openDB();state=await readDB();
    if(!state){state=await fetch('./seed.json').then(r=>r.json());state=await saveChange(db,state.revision,x=>x,state);}
    validateBackup(state);if(state.schema===1)state=await migrateDatabase(db,catalog,planning);
    if(state.schema===2&&state.planning?.policyVersion!==planning.policyVersion){
      state=await refreshPlanningDatabase(db,planning);
    }
    state=await refreshCurriculumDatabase(db,catalog);
    hasRestorePoint=Boolean(await readSaved(db,'restore-point'));hasMigrationPoint=Boolean(await readSaved(db,'migration-v1'));
    const pinned=pinToday(state,today());if(JSON.stringify(pinned.pinnedDay)!==JSON.stringify(state.pinnedDay))state=await saveChange(db,state.revision,()=>pinned);
    render({routeMode:'replace'});registerOffline();
    navigator.storage?.persist?.().catch(()=>{});
  }catch(e){fatal(e.message);}
}
function nav(){
 const paths={today:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5v4l3 2',calendar:'M5 5h14v15H5zM8 3v4m8-4v4M5 10h14',roadmap:'M4 4h6v16H4zM14 4h6v16h-6z',history:'M4 11a8 8 0 1 1 2 7M4 5v6h6m2-3v5l3 2',settings:'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6'};
 const icon=id=>`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[id]}"></path></svg>`;
 return `<aside class="sidebar"><a class="brand" data-view="today" href="#today" aria-label="Learning OS home"><span class="brand-mark">≡</span><span>learning<span class="brand-serif">os</span></span></a><nav aria-label="Main navigation">${[['today','Today'],['calendar','Calendar'],['roadmap','Curriculum'],['history','Study log'],['settings','Settings']].map(([id,label])=>`<button data-view="${id}" aria-label="${label}" class="nav-item ${view===id?'active':''}" ${view===id?'aria-current="page"':''}>${icon(id)}<span class="nav-label">${label}</span></button>`).join('')}</nav><div class="nav-tools">${state.timer&&view!=='today'?'<button class="text-button return-focus" data-view="today">Back to focus <span id="nav-timer"></span></button>':''}<button class="find-trigger" data-action="find" aria-label="Search tasks and resources"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m16 16 5 5"></path></svg><span>Search</span><kbd>Ctrl K</kbd></button></div></aside>`;
}
let libraryReturn=null;
function openResource(id,query=''){
 if(view==='roadmap'&&!curriculumResource)libraryReturn={search,filter,semesterFilter};
 view='roadmap';curriculumResource=id;resourceFilter='';search=query;filter='all';render();window.scrollTo(0,0);
}
function openFind(){
 if(!state)return;
 if($('#modal').open){if($('#quick-find'))$('#modal').close();else toast('Finish or close the open form before searching.');return;}
 const destinations=[['today','Today','Return to your next task'],['calendar','Calendar','Browse your study plan'],['roadmap','Curriculum','Browse resources and chapters'],['history','Study log','Find past attempts'],['settings','Settings','Preferences and backups']];
 modal(`<div class="find-heading"><h2>Find your next step</h2><button class="text-button" data-close aria-label="Close search">Esc</button></div><label class="find-input-label">Search<input id="quick-find" type="search" placeholder="A chapter, task, resource or page…" autocomplete="off"></label><div id="find-results"></div><p class="find-help">↑ ↓ to move · Enter to open · Esc to close</p>`);
 const input=$('#quick-find'),container=$('#find-results');
 function show(){
  const query=input.value.trim(),results=findInPlan(state,catalog,query,7),pages=destinations.filter(x=>!query||x[1].toLowerCase().includes(query.toLowerCase()));
  container.innerHTML=`${query?'':'<p class="find-section-label">Tasks & resources</p>'}${results.map((r,i)=>`<button class="find-result" data-find-result="${i}"><span><b>${esc(r.title)}</b><small>${esc(r.detail)}</small></span><span class="find-kind">${esc(r.kind)}</span></button>`).join('')}${pages.length?`<p class="find-section-label">Go to</p>${pages.map(([id,label,help])=>`<button class="find-result" data-find-page="${id}"><span><b>${label}</b><small>${help}</small></span><span aria-hidden="true">↗</span></button>`).join('')}`:''}${!results.length&&!pages.length?'<p class="empty">No matches. Try a section number, topic or resource name.</p>':''}`;
  container.querySelectorAll('[data-find-result]').forEach(b=>b.onclick=()=>{const result=results[Number(b.dataset.findResult)];$('#modal').close();if(!result.route.curriculumResource&&result.taskId)editTask(result.taskId);else{libraryReturn=null;semesterFilter='';openResource(result.route.curriculumResource,result.route.search||'');document.querySelector('h1')?.focus({preventScroll:true});}});
  container.querySelectorAll('[data-find-page]').forEach(b=>b.onclick=()=>{$('#modal').close();view=b.dataset.findPage;render();document.querySelector('.nav-item.active')?.focus({preventScroll:true});});
 }
 input.oninput=show;
 $('#modal').addEventListener('keydown',e=>{
  if(!['ArrowDown','ArrowUp','Enter'].includes(e.key))return;
  const buttons=[...container.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);
  if(e.key==='Enter'){if(document.activeElement===input&&buttons[0]){e.preventDefault();buttons[0].click();}return;}
  if(!buttons.length)return;e.preventDefault();
  if(e.key==='ArrowUp'&&index===0)input.focus();else if(index<0)buttons[e.key==='ArrowDown'?0:buttons.length-1].focus();else buttons[(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();
 },{signal:findAbort.signal});
 $('#modal').addEventListener('close',()=>findAbort.abort(),{once:true});
 show();input.focus();
}
let findAbort=new AbortController();
document.addEventListener('invalid',e=>{let parent=e.target.closest('details');while(parent){parent.open=true;parent=parent.parentElement?.closest('details');}},true);
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();findAbort.abort();findAbort=new AbortController();openFind();}});
function render({routeMode='push'}={}){if(!state)return;const previousView=document.body.dataset.view,scroll=window.scrollY,active=document.activeElement,focusId=active?.id,selection=active&&'selectionStart' in active?[active.selectionStart,active.selectionEnd]:null;const hash=navigationHash({view,calendarMode,calendarStart,semesterFilter,curriculumResource:curriculumResource||resourceFilter,filter,search,historySearch,historyMonth,historyPage:historyPageIndex});if(routeMode!=='none'&&hash!==location.hash)history[routeMode==='replace'?'replaceState':'pushState'](null,'',hash);lastRoute=location.hash;document.body.dataset.view=view;lastDate=today();$('#app').innerHTML=`${nav()}<main data-revision="${state.revision}"><header class="topbar"><span><b>${({today:'Today',calendar:'Calendar',roadmap:'Curriculum',history:'Study log',settings:'Settings'})[view]}</b></span><div class="top-right"><span class="connection">${navigator.onLine?'Saved in this browser':'Offline'}</span></div></header><div class="content">${({today:renderToday,calendar:renderCalendar,roadmap:renderRoadmap,history:renderHistory,settings:renderSettings})[view]()}</div><footer>Learn with intention. Leave room for life.<span id="storage-status">${esc(state.settings.timezone)} · ${offlineReady?'Offline ready':'Local storage active'}</span></footer></main>`;document.querySelector('h1')?.setAttribute('tabindex','-1');bind();tick();if(previousView===view){window.scrollTo(0,scroll);const target=focusId&&document.getElementById(focusId);if(target){target.focus({preventScroll:true});if(selection&&selection[0]!=null&&target.setSelectionRange)target.setSelectionRange(...selection);}}else window.scrollTo(0,0);}
function renderToday(){return renderTodayView(state,today());}
function renderCalendar(){return renderCalendarView(state,today(),calendarMode,catalog,calendarStart||today());}
function renderRoadmap(){return renderCurriculumView(state,{search,filter,semester:semesterFilter,resource:resourceFilter,resourceDetail:curriculumResource,catalog});}
function renderHistory(){return renderHistoryView(state,{search:historySearch,month:historyMonth,page:historyPageIndex});}
function renderSettings(){return renderSettingsView(state,{hasRestorePoint,hasMigrationPoint});}
function tick(){if(!state)return;const timer=state.timer,spent=elapsed(timer),limit=(timer?.targetMinutes||Number($('.quiet-clock')?.dataset.focusMinutes)||state.settings.focusMinutes)*60000,left=Math.max(0,Math.ceil((limit-spent)/1000));document.title=timer?.running?String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0')+' · Focus · LearningOS':'ENSAM · Learning OS';if($('#nav-timer'))$('#nav-timer').textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0')+(timer?.running?'':' · paused');if($('#timer-value'))$('#timer-value').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;if(timer&&left===0&&$('#timer-label')){$('#timer-label').textContent='FOCUS COMPLETE · REVIEW YOUR SESSION';const b=$('.timer-controls .primary');if(b){b.textContent='Review session';b.dataset.action='finish';}}if($('#break-countdown')){const b=Math.max(0,Math.ceil((state.breakUntil-Date.now())/1000));$('#break-countdown').textContent=String(Math.floor(b/60)).padStart(2,'0')+':'+String(b%60).padStart(2,'0');if(b===0)render();}
 const day=today();
 if(day!==lastDate&&!timer){lastDate=day;commit(s=>s);}
}
async function timerToggle(){
 const day=today(),target=dailyChoice(state,day).task,q=chooseRefresher(state,target,day);
 if(state.timer||!q){await commit(s=>toggleFocus(s,day,{id:uid()}));return;}
 const expected=state.revision;let starting=false;modal(renderRefresher(q));
 const start=async()=>{
  if(starting)return;
  if(state.revision!==expected||today()!==day){$('#modal').close();toast('Your session changed. Start the current task again.');return;}
  starting=true;const saved=await commit(s=>startAfterRefresher(s,day,target.id,q.id,{id:uid()}));
  if(saved)$('#modal').close();else starting=false;
 };
 $('#refresher-start').onclick=start;$('#refresher-skip').onclick=start;
 $('#refresher-copy').onclick=async()=>{try{await navigator.clipboard.writeText(refresherLLMContext(q,target));toast('Study context copied. Paste it into your LLM.');}catch{toast('Could not copy. You can select the question and paste it into your LLM.');}};
}
async function finishDialog(presetOutcome=''){
 const day=state.timer?.day??today();
 const task=state.timer?state.tasks.find(t=>t.id===state.timer.taskId):dailyChoice(state,day).task;
 if(!task)return;
 if(state.timer?.running){
  const saved=await commit(s=>{s.timer.accumulatedMs=elapsed(s.timer);s.timer.running=false;return s;});
  if(!saved)return;
 }
 const timerId=state.timer?.id,id=timerId||uid();
 modal(renderOutcomeForm(task,{selectedOutcome:presetOutcome,activeMinutes:elapsed(state.timer)/60000}));
 const form=$('#outcome-form');
 form.addEventListener('change',()=>{
  const value=form.querySelector('input[name=outcome]:checked')?.value;
  $('#completion-evidence').hidden=value!=='completed';
  $('#partial-estimate').hidden=value!=='partial';
  form.elements.namedItem('remaining').disabled=value!=='partial';
 });
 form.onsubmit=async e=>{
  e.preventDefault();
  const fields=new FormData(form),outcome=fields.get('outcome'),remaining=fields.get('remaining');
  if(await commit(s=>{
   if(s.timer?.id!==timerId)throw Error('Your session changed. Open the current session to save it.');
   const minutes=elapsed(s.timer)/60000;
   const event={id,taskId:task.id,day,at:new Date().toISOString(),minutes,outcome,note:fields.get('note'),remainingMinutes:outcome==='partial'&&remaining?Number(remaining):undefined};
   const next=recordOutcome(s,event);
   if(['completed','partial'].includes(outcome)&&minutes>=1)next.breakUntil=Date.now()+s.settings.breakMinutes*60000;
   return next;
  })){
   $('#modal').close();
   toast('Session saved. Your roadmap has adapted.');
  }
 };
}
function editTask(id,preset={}){if(id&&!state.tasks.some(t=>t.id===id)){const unit=catalog.units.find(u=>'catalog:'+u.id===id);if(unit){stageUnits([unit.id]);toast('Source task added to your active curriculum.');}else toast('This task is no longer in your saved plan.');return;}const editRevision=state.revision;const t=state.tasks.find(t=>t.id===id)||{id:uid(),resource:'ENSAM',section:'',heading:'',action:'',evidence:'',minutes:50,minimumMinutes:25,track:'academic',status:'active',prerequisites:[],order:0,...preset};modal(`<form id="task-form"><p class="eyebrow">${id?'TASK DETAILS':'MAKE IT ACTIONABLE'}</p><h2>${id?'Task details':'Add a learning task'}</h2>${id?`<details class="editor-source"><summary>Source & scheduling explanation</summary>${taskProvenance(state,t,today())}</details>`:''}<div class="form-columns"><label>Resource or module<input name="resource" value="${esc(t.resource)}" maxlength="250" required></label><label>Section / chapter<input name="section" value="${esc(t.section)}" maxlength="100" placeholder="§3.1.1 or TD2 · Exercise 3"></label></div><label>Source heading<input name="heading" value="${esc(t.heading)}" maxlength="500" required></label><label>Action<input name="action" value="${esc(t.action)}" maxlength="1000" placeholder="Solve, derive, implement, or explain…" required></label><label>Done when…<textarea name="evidence" maxlength="2000" required>${esc(t.evidence)}</textarea></label><div class="form-columns"><label>Estimated minutes<input name="minutes" type="number" step="any" min="1" max="10000" value="${t.minutes}" required></label><label>Priority / track<select name="track"><option value="academic" ${t.track==='academic'?'selected':''}>ENSAM requirement</option><option value="independent" ${t.track==='independent'?'selected':''}>Independent study</option></select></label></div><details class="editor-advanced"><summary>Scheduling & source details</summary><div class="form-columns"><label>Start no earlier than<input name="notBefore" type="date" value="${esc(t.notBefore)}"></label><label>Target / deadline date (optional)<input name="deadline" type="date" value="${esc(t.deadline)}"></label></div><div class="form-columns"><label>Deadline classification<select name="deadlineType"><option value="unknown" ${!t.deadlineType||t.deadlineType==='unknown'?'selected':''}>Unknown / soft target</option><option value="personal" ${t.deadlineType==='personal'?'selected':''}>Personal preparation target</option><option value="teacher" ${t.deadlineType==='teacher'?'selected':''}>Confirmed teacher deadline</option></select></label><label>Revised remaining minutes<input name="remainingMinutes" type="number" step="any" min="1" max="10000" value="${t.remainingMinutes??(id?t.minutes:'')}"></label></div><p class="small muted">${id?`${effortFor(state,t).initialEstimateMinutes} min initial estimate · ${Math.round(effortFor(state,t).timeSpentMinutes)} min recorded · `:''}Remaining effort is an independent estimate. A hard deadline also requires the current assignment confirmation in these details.</p><label class="checkbox"><input name="archived" type="checkbox" ${t.archived?'checked':''}> Suspend this task (keep history and dependencies)</label><div class="form-columns"><label>Semester<select name="semester">${state.semesters.map(sem=>`<option value="${sem.id}" ${(t.semester||1)===sem.id?'selected':''}>S${sem.id} · ${esc(sem.title)}</option>`).join('')}</select></label><label>Priority<select name="priority">${['P0','P1','P2','P3'].map(p=>`<option ${p===(t.priority||(t.track==='academic'?'P0':'P1'))?'selected':''}>${p}</option>`).join('')}</select></label><label>Preferred weekdays<select name="preferredDays" multiple size="3">${[1,2,3,4,5,6,0].map(d=>`<option value="${d}" ${(t.preferredDays||[]).includes(d)?'selected':''}>${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d]}</option>`).join('')}</select></label><label>Order<input name="order" type="number" value="${t.order||0}"></label><label class="checkbox"><input name="teacherConfirmed" type="checkbox" ${t.teacherConfirmed?'checked':''}> Current teacher material confirmed</label><label class="checkbox"><input name="assignmentConfirmed" type="checkbox" ${t.assignmentConfirmed?'checked':''}> Specific current assignment confirmed</label></div><label>Private local-file locator (text only)<input name="localLocator" value="${esc(t.localLocator||'')}" placeholder="Optional local reference; never uploaded"></label><label>Source link<input name="url" type="url" value="${esc(safeLink(t.url))}" placeholder="https://…"></label><label>Prerequisites <small>Hold Ctrl / Cmd to select more than one</small><select name="prerequisites" multiple size="4">${state.tasks.filter(x=>x.id!==t.id).map(x=>`<option value="${esc(x.id)}" ${(t.prerequisites||[]).includes(x.id)?'selected':''}>${esc(x.resource+' '+x.section+' · '+x.heading+(x.archived?' [suspended]':''))}</option>`).join('')}</select></label></details><label>Status<select name="status"><option value="active" ${t.status==='active'?'selected':''}>Active — include in schedule</option><option value="draft" ${t.status==='draft'?'selected':''}>Draft — keep out of schedule</option></select></label>${id?`<button type="button" class="secondary" id="attach-document">Attach private document locally</button>${state.attachments.filter(a=>a.unitId===t.unitId).map(a=>`<button type="button" class="text-button" data-download-attachment="${esc(a.id)}">Open ${esc(a.name)}</button>`).join('')}`:''}<p class="small muted">${esc(t.provenance||'Your authored task. Estimates are adjustable.')} Editing keeps previous revisions and study history. Saving a completed task creates a new follow-up, preserving its original completion.</p><div class="dialog-actions">${id?'<button type="button" class="text-button danger" id="archive-task">Archive task</button>':''}<button type="button" class="text-button" data-close>Cancel</button><button class="primary">Save task</button></div></form>`);$('#task-form').onsubmit=async e=>{e.preventDefault();const taskForm=new FormData(e.target);const f=Object.fromEntries(taskForm);if(state.revision!==editRevision){toast('Your plan changed while this editor was open. Reopen the task to keep the latest changes.');return;}if(taskIsInFocus(state,id)){toast('Finish the active session before editing this task.');return;}const next={...t,...f,preferredDays:taskForm.getAll('preferredDays').map(Number),archived:taskForm.has('archived'),semester:Number(f.semester),priority:f.priority,order:Number(f.order),teacherConfirmed:taskForm.has('teacherConfirmed'),assignmentConfirmed:taskForm.has('assignmentConfirmed'),deadlineConfirmed:f.deadlineType==='teacher',reviewed:true,prerequisites:taskForm.getAll('prerequisites'),minutes:Number(f.minutes),minimumMinutes:Math.min(t.minimumMinutes??25,Number(f.minutes)),remainingMinutes:f.remainingMinutes?Number(f.remainingMinutes):t.remainingMinutes,title:f.resource+' '+f.section+' '+f.heading+' — '+f.action};if(await commit(s=>id?reviseTask(s,id,next,{newId:uid()}):addLocalTask(s,next))){$('#modal').close();toast('Curriculum saved. Session history kept.');}};$('#attach-document')?.addEventListener('click',()=>attachDocument(t.unitId));document.querySelectorAll('[data-download-attachment]').forEach(b=>b.onclick=()=>downloadAttachment(b.dataset.downloadAttachment));$('#archive-task')?.addEventListener('click',async()=>{if(taskIsInFocus(state,id)){toast('Finish the session before archiving its task.');return;}if(await commit(s=>{return reviseTask(s,id,{archived:true},{newId:uid()});})){$('#modal').close();toast('Task archived; history preserved.');}});}
function adjustDay(day){modal(`<p class="eyebrow">${esc(pretty(day))}</p><h2>Make room.</h2><p class="muted">Change this day without losing any learning.</p><div class="day-options"><button class="secondary" data-kind="ensam">⌘ ENSAM takes priority</button><button class="secondary" data-kind="rest">☾ Protect a rest day</button><button class="text-button" data-kind="normal">Use normal availability</button></div><button class="text-button" data-close>Close</button>`);document.querySelectorAll('#modal [data-kind]').forEach(b=>b.onclick=async()=>{if(state.timer?.running){toast('Pause and finish your session before changing today.');return;}if(await commit(s=>{if(s.pinnedDay?.day===day)s.pinnedDay=null;s.sameDayTrack=null;s.overrides=s.overrides.filter(o=>o.day!==day);if(b.dataset.kind!=='normal')s.overrides.push({id:uid(),day,kind:b.dataset.kind});return s;})){$('#modal').close();toast('Availability updated. No catch-up debt.');}});}
function editEvent(id){
 const expected=state.revision,t=state.calendar.find(c=>c.id===id)||{id:uid(),title:'Academic commitment',start_date:today(),end_date_inclusive:today(),kind:'exam_window',active:true};
 modal(renderWindowEditor(t));
 $('#event-form').onsubmit=async e=>{
  e.preventDefault();if(state.revision!==expected){toast('Your plan changed. Reopen this calendar editor.');return;}
  const f=new FormData(e.target);if(f.get('start')>f.get('end')){toast('End date must follow the start date.');return;}
  if(await commit(s=>{const old=s.calendar.find(x=>x.id===id),next={...t,title:f.get('title'),kind:f.get('kind'),start_date:f.get('start'),end_date_inclusive:f.get('end'),active:f.has('active'),confidence:'user_confirmed',individual_exam_times_known:false,provenance:'Dates edited by you; prior revision retained.'};s.calendar=old?s.calendar.map(x=>x.id===id?next:x):[...s.calendar,next];s.revisions.push({id:uid(),author:'You',at:new Date().toISOString(),old:old?structuredClone(old):null,new:structuredClone(next)});return s;}))$('#modal').close();
 };
}
async function exportBackup(){
  try{
    if(state.timer?.running){const saved=await commit(s=>{s.timer.accumulatedMs=elapsed(s.timer);s.timer.running=false;return s;});if(!saved)return;}
    const snapshot=prepareTransfer(state),blob=new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}),a=document.createElement('a'),url=URL.createObjectURL(blob);
    a.href=url;a.download='learning-os-backup-'+snapshot.exportedAt.replace(/[:.]/g,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(state.timer?'Backup exported with your focus timer paused.':'Backup exported. Keep one device as your current study space.');
  }catch(error){toast(error.message||'Could not export this backup.');}
}
function importBackup(){
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
 input.onchange=async()=>{try{
  const file=input.files?.[0];if(!file)return;if(file.size>15000000)throw Error('Backup is too large.');
  const raw=validateBackup(JSON.parse(await file.text())),next=synchronizeCurriculum(raw.schema===1?migrateState(raw,catalog,planning):raw,catalog);
  let previewRevision;
  function showPreview(){
   previewRevision=state.revision;modal(renderRestorePreview(next,state,{fileName:file.name}));
   $('#pre-export').onclick=exportBackup;
   $('#restore').onclick=async()=>{
    if(state.revision!==previewRevision){showPreview();toast('This browser changed. Review the refreshed comparison before restoring.');return;}
    if(state.timer){toast('Save your current session before replacing this study space.');return;}
    if(await commit(s=>prepareRestore(next,s.revision),{preservePrevious:true})){$('#modal').close();toast(next.timer?'Restored. Resume your paused focus session when ready.':'Backup restored. A local recovery copy is available in Settings.');}
   };
  }
  showPreview();
 }catch(error){toast(error.message||'This backup could not be read.');}};
 input.click();
}

async function recoverBackup(){
  try{
    const saved=await readSaved(db,'restore-point');if(!saved){toast('No previous restore point is available.');return;}
    validateBackup(saved.state);const recoveryRevision=state.revision;
    modal(`<p class="eyebrow">LOCAL RECOVERY COPY</p><h2>Return to before your last restore?</h2><p class="muted">${saved.state.tasks.length} tasks · ${saved.state.events.filter(e=>e.type==='session').length} sessions. This replaces your current plan. Export current work first if you want to keep it.</p><div class="dialog-actions"><button class="text-button" data-close>Cancel</button><button class="secondary" id="recover-export">Export current</button><button class="primary" id="recover-confirm">Recover previous plan</button></div>`);
    $('#recover-export').onclick=exportBackup;
    $('#recover-confirm').onclick=async()=>{
      if(state.revision!==recoveryRevision){await recoverBackup();toast('Your plan changed. Review the refreshed recovery copy before replacing it.');return;}
      if(state.timer){toast('Save your current session before recovering another plan.');return;}
      if(await commit(s=>prepareRestore(synchronizeCurriculum(saved.state.schema===1?migrateState(saved.state,catalog,planning):saved.state,catalog),s.revision),{preservePrevious:true})){$('#modal').close();toast('Previous plan recovered. Your replaced plan is now the recovery copy.');}
    };
  }catch(error){toast(error.message||'The recovery copy could not be loaded.');}
}

function importNote(){modal(`<form id="note-form"><p class="eyebrow">BRING YOUR PROGRESS WITH YOU</p><h2>Review an Obsidian note</h2><p class="muted">Paste a relevant note or choose its Markdown file. It stays in this browser. Review its headings, then choose your next task.</p><label>Markdown file<input id="note-file" type="file" accept=".md,.txt"></label><label>Note content<textarea id="note-text" rows="6" maxlength="200000" placeholder="# Matrix Transformations…"></textarea></label><div id="note-headings"></div><div class="dialog-actions"><button type="button" data-close class="text-button">Close</button><button class="primary">Inspect headings</button></div></form>`);$('#note-file').onchange=async e=>{if(!e.target.files?.[0])return;if(e.target.files[0].size>200000){toast('Choose a note under 200 KB.');return;}$('#note-text').value=await e.target.files[0].text();};$('#note-form').onsubmit=e=>{e.preventDefault();const headings=$('#note-text').value.split('\n').filter(l=>/^#{1,4} /.test(l)).slice(0,20);$('#note-headings').innerHTML=`<p class="small muted">${headings.length} headings found. Notes do not automatically mark material completed.</p><ul class="note-headings">${headings.map(h=>`<li>${esc(h.replace(/^#+ /,''))}</li>`).join('')}</ul><button type="button" id="from-note" class="secondary">Add a task from this note</button>`;$('#from-note').onclick=()=>{$('#modal').close();editTask(null,{resource:'Obsidian note',heading:headings[0]?.replace(/^#+ /,'')||'',provenance:'Manually imported note heading. Progress requires your confirmation.'});};};}
function bind(){bindCurriculumControls();document.querySelectorAll('[data-calendar-open]').forEach(b=>b.onclick=()=>{view='calendar';calendarStart=b.dataset.calendarOpen;calendarMode='Day';render();});$('#status-filter')?.addEventListener('change',e=>{filter=e.target.value;render();});document.querySelectorAll('[data-library-clear]').forEach(b=>b.onclick=()=>{search='';filter='all';semesterFilter='';render();});$('#calendar-more-mode')?.addEventListener('change',e=>{if(e.target.value){calendarMode=e.target.value;render();}});document.querySelectorAll('[data-outcome]').forEach(b=>b.onclick=()=>finishDialog(b.dataset.outcome));document.querySelectorAll('button[data-view],a[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;render();document.querySelector('.nav-item.active')?.focus({preventScroll:true});window.scrollTo(0,0);});document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editTask(b.dataset.edit));document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;render();});$('#search')?.addEventListener('input',e=>{const pos=e.target.selectionStart;search=e.target.value;render();$('#search').focus();$('#search').setSelectionRange(pos,pos);});document.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>adjustDay(b.dataset.day));document.querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>editEvent(b.dataset.event));document.querySelectorAll('[data-undo]').forEach(b=>b.onclick=()=>{modal(`<h2>Correct this session?</h2><p class="muted">The original stays in your log. Its completion credit will be removed; a follow-up task may become ready again.</p><div class="dialog-actions"><button class="text-button" data-close>Cancel</button><button class="primary" id="confirm-undo">Correct outcome</button></div>`);$('#confirm-undo').onclick=async()=>{if(await commit(s=>{s.events.push({id:uid(),type:'void',target:b.dataset.undo,at:new Date().toISOString()});return s;}))$('#modal').close();};});
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=async()=>{const a=b.dataset.action;if(a==='find'){findAbort.abort();findAbort=new AbortController();openFind();}if(a==='recover-migration')recoverMigration();if(a==='catalog')catalogDialog();if(a==='reconcile')reconcileDialog();if(a==='new-window')editEvent();if(a==='timer')timerToggle();if(a==='end-break')await commit(s=>{s.breakUntil=null;return s;});if(a==='finish')finishDialog();if(a==='new')editTask();if(a==='availability')adjustDay(today());if(a==='export')exportBackup();if(a==='import')importBackup();if(a==='recover')recoverBackup();if(a==='note')importNote();if(a==='early'){const t=forecast(state,today(),14).find(p=>p.task)?.task;if(t)await commit(s=>{s.revisions.push({id:uid(),at:new Date().toISOString(),task:structuredClone(s.tasks.find(x=>x.id===t.id))});s.tasks.find(x=>x.id===t.id).notBefore=today();s.pinnedDay={day:today(),taskId:t.id,userOverride:true,reason:'You chose Begin early.'};return s;});}});
  $('#settings-form')?.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.target);if(state.timer){toast('Finish the active session before changing focus settings.');return;}const saved=await commit(s=>{const previousAvailability=s.settings.discretionaryMinutes||Array.from({length:7},(_,d)=>d===6?s.settings.saturdayMinutes:s.settings.dailyMinutes);for(const k of ['focusMinutes','breakMinutes','dailyMinutes','saturdayMinutes'])s.settings[k]=Number(f.get(k));s.settings.weeklyMinutes=Number(f.get('weeklyHours'))*60;s.settings.summerWeeklyMinutes=Number(f.get('summerWeeklyMinutes'));s.settings.examMode=f.get('examMode');s.settings.timezone=f.get('timezone');s.settings.paused=f.has('paused');s.settings.preSessionRefreshers=f.has('preSessionRefreshers');s.settings.pfeMode=f.has('pfeMode');s.settings.recoveryDays=String(f.get('recoveryDays')).split(',').map(x=>x.trim()).filter(Boolean);if(e.target.querySelector('[name=preferredResources]'))s.settings.preferredResources=f.getAll('preferredResources');const available=Array.from({length:7},(_,day)=>Number(f.get('available-'+day)));if(s.settings.discretionaryMinutes||available.some((n,d)=>n!==previousAvailability[d]))s.settings.discretionaryMinutes=available;if(f.has('smallResidualMinutes'))s.settings.smallResidualMinutes=Number(f.get('smallResidualMinutes'));if(e.target.elements.namedItem('crossDayRescue'))s.settings.crossDayRescue=f.has('crossDayRescue');s.settings.campusTimetable=Array.from({length:7},(_,day)=>({day,minutes:Number(f.get('campus-'+day))})).filter(c=>c.minutes>0);const lead=Number(f.get('examPrepLeadDays')),leadChanged=lead!==s.settings.examPrepLeadDays;s.settings.examPrepLeadDays=lead;if(leadChanged)for(const w of s.calendar.filter(w=>w.kind==='exam_window'&&w.active)){const prep=s.calendar.find(x=>x.id==='prep:'+w.id)||(w.id==='exams-autumn'?s.calendar.find(x=>x.id==='exam-prep'):null);if(prep){prep.start_date=addDays(w.start_date,-Math.max(1,lead));prep.end_date_inclusive=addDays(w.start_date,-1);prep.active=lead>0;}else if(lead>0)s.calendar.push({id:'prep:'+w.id,title:'Suggested preparation · '+w.title,kind:'exam_prep',active:true,start_date:addDays(w.start_date,-lead),end_date_inclusive:addDays(w.start_date,-1),confidence:'authored_recommendation'});}for(const slot of s.calendarSlots)if(f.has('slot-'+slot.day)){slot.minutes=Number(f.get('slot-'+slot.day));slot.fixed=f.has('fixed-'+slot.day);}validateBackup(s);return s;});if(saved)toast('Your preferences are saved.');});
}
function updateConnection(){const connection=$('.connection');if(connection)connection.textContent=navigator.onLine?'Saved in this browser':'Offline';const status=$('#storage-status');if(status)status.textContent=state.settings.timezone+' · '+(offlineReady?'Offline ready':'Local storage active');}
function registerOffline(){
 if(!('serviceWorker' in navigator))return;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloadForUpdate&&!reloading){reloading=true;location.reload();}});
 navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{
  swRegistration=reg;const notify=()=>{if(reg.waiting&&navigator.serviceWorker.controller)$('#update-notice').hidden=false;};notify();
  reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',notify));return navigator.serviceWorker.ready;
 }).then(()=>{offlineReady=true;updateConnection();}).catch(()=>{});
 $('#apply-update').onclick=async()=>{if(state.timer?.running&&!await commit(s=>{s.timer.accumulatedMs=elapsed(s.timer);s.timer.running=false;return s;}))return;reloadForUpdate=true;if(swRegistration?.waiting)swRegistration.waiting.postMessage({type:'SKIP_WAITING'});else location.reload();};
}
window.addEventListener('online',()=>{updateConnection();swRegistration?.update().catch(()=>{});});window.addEventListener('offline',updateConnection);
const restoreRoute=()=>{if(location.hash===lastRoute||!state)return;applyRoute(parseNavigation(location.hash));render({routeMode:'none'});};window.addEventListener('popstate',restoreRoute);window.addEventListener('hashchange',restoreRoute);
setInterval(tick,1000);boot();
async function stageUnits(ids){
 const preview=previewImport(state,catalog),byId=new Map(preview.rows.map(r=>[r.unit.id,r])),chosen=new Set();
 const add=id=>{const row=byId.get(id);if(!row||row.kind!=='add'||chosen.has(id))return;chosen.add(id);for(const dep of row.unit.dependencies||[])add(dep);};
 ids.forEach(add);
 if(!chosen.size){toast('Those units are already staged or need individual review.');return;}
 if(await commit(s=>applyImport(s,catalog,[...chosen])))toast(`${chosen.size} source ${chosen.size===1?'unit':'units'} staged as review drafts.`);
}
function bindCurriculumControls(){
 $('#history-search')?.addEventListener('input',e=>{historySearch=e.target.value;historyPageIndex=0;render({routeMode:'replace'});});
 $('#history-month')?.addEventListener('change',e=>{historyMonth=e.target.value;historyPageIndex=0;render();});
 document.querySelector('[data-history-clear]')?.addEventListener('click',()=>{historySearch='';historyMonth='';historyPageIndex=0;render();});
 document.querySelectorAll('[data-history-page]').forEach(b=>b.onclick=()=>{historyPageIndex=Number(b.dataset.historyPage);render();document.getElementById('history-search')?.focus({preventScroll:true});});

 $('#roadmap-choice-form')?.addEventListener('submit',async e=>{
  e.preventDefault();const f=new FormData(e.target),day=e.target.dataset.date;
  if(state.timer){toast('Finish the current session before changing roadmap choices.');return;}
  const previous=choicesFor(state),patch={summer1Enabled:f.has('summer1Enabled')};
  for(const key of ['mitTrialContinues','systemsSupportNeeded','capstoneTheoryNeeded'])if(e.target.elements.namedItem(key))patch[key]=f.has(key);
  for(const key of ['geronTopic','mathClinicUnitId','capstoneBranch','elective'])if(f.has(key))patch[key]=f.get(key);
  const gates={...previous.gates};e.target.querySelectorAll('input[name=gate]').forEach(x=>gates[x.value]=x.checked);patch.gates=gates;
  if(f.has('daySupport')){patch.daySupports={...previous.daySupports};if(f.get('daySupport'))patch.daySupports[day]=f.get('daySupport');else delete patch.daySupports[day];}
  if(e.target.elements.namedItem('noEnsamWork'))patch.noEnsamDays=[...(previous.noEnsamDays||[]).filter(d=>d!==day),...(f.has('noEnsamWork')?[day]:[])];
  if(await commit(s=>{const next=updateRoadmapChoices(s,patch);
   next.overrides=next.overrides.filter(o=>!(o.day===day&&o.kind==='ensam'));if(f.has('examPeak'))next.overrides.push({id:uid(),day,kind:'ensam'});return next;
  }))toast('Roadmap choices saved; study history preserved.');
 });

 document.querySelectorAll('[data-resource-edit]').forEach(b=>b.onclick=()=>{const expected=state.revision,r=state.resources.find(r=>r.id===b.dataset.resourceEdit)||catalog.resources.find(r=>r.id===b.dataset.resourceEdit);if(!r){toast('Resource no longer exists.');return;}modal(`<form id="resource-form"><h2>Edit resource</h2><label>Name<input name="name" value="${esc(r.name)}" required></label><label>Edition<input name="edition" value="${esc(r.edition)}"></label><label>Source URL<input type="url" name="url" value="${esc(safeLink(r.url))}"></label><div class="form-columns"><label>Display order<input type="number" name="order" min="0" max="999" value="${r.order??99}"></label><label>Scheduling preference (lower first)<input type="number" name="priority" min="0" max="999" value="${r.priority??9}"></label></div><p class="muted">Changing edition requires reviewing the affected headings. Existing session snapshots keep their original source.</p><div class="dialog-actions"><button data-close type="button" class="text-button">Cancel</button><button class="primary">Save resource</button></div></form>`);$('#resource-form').onsubmit=async e=>{e.preventDefault();if(state.revision!==expected){toast('Your plan changed. Reopen this resource editor.');return;}const f=new FormData(e.target);if(await commit(s=>reviseResource(s,r.id,{name:f.get('name'),edition:f.get('edition'),url:f.get('url'),order:Number(f.get('order')),priority:Number(f.get('priority'))},{fallback:r})))$('#modal').close();};});

 document.querySelectorAll('[data-calendar-mode]').forEach(b=>b.onclick=()=>{calendarMode=b.dataset.calendarMode;render();});
 const dateInput=$('#calendar-start');
 // Do not rerender a native date input while the user is typing its year.
 const goToDate=()=>{if(!dateInput?.checkValidity()||!isCivilDate(dateInput.value)){dateInput?.reportValidity();return;}calendarStart=dateInput.value;if(['Year','3-Year','Semester'].includes(calendarMode))calendarMode='Month';render();};
 $('#calendar-date-form')?.addEventListener('submit',e=>{e.preventDefault();goToDate();});
 $('#calendar-jump')?.addEventListener('change',e=>{if(!e.target.value)return;calendarStart=e.target.value;calendarMode=e.target.selectedOptions[0]?.dataset.semester?'Semester':'Month';render();});
 document.querySelectorAll('[data-calendar-step]').forEach(b=>b.onclick=()=>{const next=navigateDate(calendarStart||today(),calendarMode,Number(b.dataset.calendarStep),state.semesters);const first=state.semesters[0]?.start||'1900-01-01';calendarStart=next>HORIZON?HORIZON:next<first?first:next;render();});
 document.querySelector('[data-calendar-today]')?.addEventListener('click',()=>{calendarStart=today();render();});
 document.querySelectorAll('[data-calendar-date]').forEach(b=>b.onclick=()=>{calendarStart=b.dataset.calendarDate;if(['Year','3-Year','Semester'].includes(calendarMode))calendarMode='Day';render();document.querySelector('.calendar-detail')?.scrollIntoView({block:'nearest'});});
 document.querySelectorAll('.calendar-cell').forEach(b=>b.addEventListener('keydown',e=>{const next=calendarKeyDate(b.dataset.calendarDate,e.key);if(!next)return;e.preventDefault();if(next<'1900-01-01'||next>HORIZON)return;calendarStart=next;render();document.querySelector(`.calendar-cell[data-calendar-date="${next}"]:not(.outside-month)`)?.focus({preventScroll:true});}));
 document.querySelectorAll('[data-calendar-month]').forEach(b=>b.onclick=()=>{calendarStart=b.dataset.calendarMonth;calendarMode='Month';render();});
 document.querySelectorAll('[data-semester-select]').forEach(b=>{b.onclick=()=>{semesterFilter=b.dataset.semesterSelect;render();document.querySelector(`[data-semester-select="${semesterFilter}"]`)?.focus();};b.onkeydown=e=>{const buttons=[...document.querySelectorAll('[data-semester-select]')],index=buttons.indexOf(b);const next=e.key==='ArrowRight'?buttons[(index+1)%buttons.length]:e.key==='ArrowLeft'?buttons[(index+buttons.length-1)%buttons.length]:e.key==='Home'?buttons[0]:e.key==='End'?buttons.at(-1):null;if(next){e.preventDefault();next.click();}};});
 $('#semester-filter')?.addEventListener('change',e=>{semesterFilter=e.target.value;render();});
 $('#resource-filter')?.addEventListener('change',e=>{resourceFilter=e.target.value;curriculumResource=e.target.value;render();});
 document.querySelectorAll('[data-resource-view]').forEach(b=>b.onclick=()=>{openResource(b.dataset.resourceView);});
 document.querySelectorAll('[data-resource-back]').forEach(b=>b.onclick=()=>{curriculumResource='';resourceFilter='';search=libraryReturn?.search||'';filter=libraryReturn?.filter||'all';semesterFilter=libraryReturn?.semesterFilter||'';libraryReturn=null;render();window.scrollTo(0,0);});
 document.querySelectorAll('[data-stage-unit]').forEach(b=>b.onclick=()=>stageUnits([b.dataset.stageUnit]));
 document.querySelectorAll('[data-resource-stage-all]').forEach(b=>b.onclick=()=>{const preview=previewImport(state,catalog);stageUnits(preview.rows.filter(r=>r.kind==='add'&&r.unit.resourceId===b.dataset.resourceStageAll).map(r=>r.unit.id));});
 document.querySelectorAll('[data-resource-toggle]').forEach(b=>b.onclick=()=>commit(s=>setResourceEnabled(s,b.dataset.resourceToggle,!(s.resources.find(r=>r.id===b.dataset.resourceToggle)||catalog.resources.find(r=>r.id===b.dataset.resourceToggle)).enabled,catalog.resources.find(r=>r.id===b.dataset.resourceToggle))));
 document.querySelectorAll('[data-source-unit]').forEach(b=>b.onclick=()=>{const u=catalog.units.find(u=>u.id===b.dataset.sourceUnit)||state.units.find(u=>u.id===b.dataset.sourceUnit);if(!u){toast('The source unit is no longer available.');return;}modal(`<h2>${esc(u.heading)}</h2><p>${esc(u.unitRef)} · ${esc(u.headingConfidence||u.confidence)}</p><p class="muted">${esc(u.sourceProvenance||u.source)}. This is a provisional source unit, not a dated assignment. Actions are authored and durations estimated.</p>${safeLink(u.link)?`<a href="${esc(safeLink(u.link))}" target="_blank" rel="noopener noreferrer">Public source ↗</a>`:''}<div class="dialog-actions"><button data-close class="secondary">Close</button></div>`);});
 document.querySelectorAll('[data-semester-edit]').forEach(b=>b.onclick=()=>{const expected=state.revision,sem=state.semesters.find(x=>x.id===Number(b.dataset.semesterEdit));modal(`<form id="semester-form"><h2>S${sem.id} · ${esc(sem.title)}</h2><p class="muted">Editing future windows does not confirm exam dates or complete any work.</p><label>Title<input name="title" value="${esc(sem.title)}" required></label><label>Start<input name="start" type="date" value="${sem.start}" required></label><label>End<input name="end" type="date" value="${sem.end}" required></label><div class="dialog-actions"><button type="button" data-close class="text-button">Cancel</button><button class="primary">Save semester</button></div></form>`);$('#semester-form').onsubmit=async e=>{e.preventDefault();if(state.revision!==expected){toast('Your plan changed. Reopen this semester editor.');return;}const f=new FormData(e.target);if(await commit(s=>{const old=structuredClone(s.semesters.find(x=>x.id===sem.id)),next={...old,title:f.get('title'),start:f.get('start'),end:f.get('end'),confidence:'user_confirmed'};s.semesters=s.semesters.map(x=>x.id===sem.id?next:x);s.revisions.push({id:uid(),author:'You',at:new Date().toISOString(),old,new:next});return s;}))$('#modal').close();};});
}
function catalogDialog(raw=catalog){
 try{
 const preview=previewImport(state,raw),expected=state.revision;
 modal(`<form id="catalog-form"><p class="eyebrow">CURRICULUM IMPORT PREVIEW</p><h2>Review the route.</h2><p>${preview.counts.add} new units · ${preview.counts.duplicate} duplicates kept · ${preview.counts.renamed} renamed · ${preview.counts.conflict} conflicts</p><p class="muted">Existing completions, timers and task IDs stay intact. A §3.1 rollup is separate from §3.1.1. Renames and edition conflicts require individual review.</p><label>Load another catalog locally<input id="catalog-file" type="file" accept=".json,application/json"></label><div class="button-row"><button type="button" class="text-button" id="select-all">Select new units</button><button type="button" class="text-button" id="select-none">Clear selection</button></div><div class="import-list">${preview.rows.map(r=>`<label class="import-unit"><input type="checkbox" name="unit" value="${esc(r.unit.id)}" ${r.kind==='add'?'checked':'disabled'}><span><b>S${r.unit.semester} · ${esc(r.unit.unitRef)} · ${esc(r.unit.heading)}</b><small>${esc(r.kind)} · ${esc(r.unit.headingConfidence)} · ${r.unit.estimatedMinutes} estimated min${r.unit.branch?' · OPTIONAL BRANCH':''}${r.diff?' · '+esc(JSON.stringify(r.diff)):''}</small></span></label>`).join('')}</div><label class="checkbox"><input name="reviewed" type="checkbox"> I reviewed the selected headings, actions and estimates</label><label class="checkbox"><input name="activate" type="checkbox"> Activate selected units now (requires review; optional branches and academic placeholders need individual review)</label><p class="small muted">Unchecked review imports research drafts. Private documents can be attached locally from each task’s editor. Historical materials never become current assignments by import alone.</p><div class="dialog-actions"><button type="button" data-close class="text-button">Cancel</button><button class="primary">Import selected units</button></div></form>`);
 $('#select-all').onclick=()=>document.querySelectorAll('input[name=unit]:not(:disabled)').forEach(x=>x.checked=true);$('#select-none').onclick=()=>document.querySelectorAll('input[name=unit]').forEach(x=>x.checked=false);
 $('#catalog-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>2000000)throw Error('Choose a catalog under 2 MB.');catalogDialog(JSON.parse(await file.text()));}catch(e){toast(e.message);}};
 $('#catalog-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);if(state.revision!==expected){toast('Your plan changed. Reopen the preview before importing.');return;}if(await commit(s=>applyImport(s,raw,f.getAll('unit'),{activate:f.has('activate'),reviewed:f.has('reviewed')}))){$('#modal').close();view='roadmap';filter='draft';render();toast('Selected units imported; history preserved.');}};
 }catch(e){toast(e.message);}
}
function attachDocument(unitId){const input=document.createElement('input');input.type='file';input.accept='.pdf,.txt,.md,.png,.jpg,.jpeg';input.onchange=async()=>{try{const file=input.files?.[0];if(!file)return;if(file.size>8000000)throw Error('Choose a document under 8 MB.');const bytes=new Uint8Array(await file.arrayBuffer());let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));const data=btoa(text);if(await commit(s=>{s.attachments.push({id:uid(),unitId,name:file.name,type:file.type,data,private:true});return s;})){const task=state.tasks.find(t=>t.unitId===unitId);if(task)editTask(task.id);toast('Private document attached locally; included only in your personal backup.');}}catch(e){toast(e.message);}};input.click();}
function downloadAttachment(id){const a=state.attachments.find(a=>a.id===id);if(!a)return;const bytes=Uint8Array.from(atob(a.data),c=>c.charCodeAt(0)),url=URL.createObjectURL(new Blob([bytes],{type:'application/octet-stream'})),link=document.createElement('a');link.href=url;link.download=a.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function reconcileDialog(){const input=document.createElement('input');input.type='file';input.accept='.json';input.onchange=async()=>{try{const file=input.files[0];if(file.size>15000000)throw Error('Backup too large.');const raw=validateBackup(JSON.parse(await file.text())),incoming=raw.schema===1?migrateState(raw,catalog,planning):raw;const merged=reconcileAttempts(state,incoming),count=merged.events.length-state.events.length,expected=state.revision;modal(`<h2>Reconcile ${count} additional attempts?</h2><p class="muted">Only compatible immutable attempts are appended. Curriculum, timer and current completion facts stay in place. Conflicting attempt IDs and missing tasks are rejected.</p><div class="dialog-actions"><button data-close class="text-button">Cancel</button><button id="merge-attempts" class="primary">Append attempts</button></div>`);$('#merge-attempts').onclick=async()=>{if(state.revision!==expected){toast('Your plan changed. Reopen reconciliation.');return;}if(await commit(s=>reconcileAttempts(s,incoming)))$('#modal').close();};}catch(e){toast(e.message);}};input.click();}

async function recoverMigration(){const point=await readSaved(db,'migration-v1');if(!point)return;modal(`<h2>Recover the pre-upgrade plan?</h2><p class="muted">${point.state.events.length} historical events · ${point.state.tasks.length} tasks. The original upgrade snapshot stays available. Your current plan is saved as a recovery copy.</p><div class="dialog-actions"><button data-close class="text-button">Cancel</button><button class="primary" id="recover-upgrade">Recover plan</button></div>`);$('#recover-upgrade').onclick=async()=>{if(state.timer){toast('Save your current session before recovering a plan.');return;}if(await commit(s=>prepareRestore(migrateState(point.state,catalog,planning),s.revision),{preservePrevious:true}))$('#modal').close();};}
