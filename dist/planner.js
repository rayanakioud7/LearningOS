import {previewImport,applyImport} from './curriculum.js';
import {addDays,weekday,completed,remaining,weeklyActual,dailyActual,minimumBlock} from './engine.js';
export function semesterFor(s,day){return s.semesters?.find(x=>x.start<=day&&x.end>=day)||null;}
export function windowsOn(s,day){return s.calendar.filter(w=>w.active&&w.start_date<=day&&w.end_date_inclusive>=day);}
export function ruleV2(s,day){
 const wd=weekday(day),slot=s.calendarSlots.find(x=>x.day===wd),overrides=s.overrides.filter(o=>o.day===day),windows=windowsOn(s,day),sem=semesterFor(s,day);
 const academicMinutes=Math.max(0,(wd===6?s.settings.saturdayMinutes:s.settings.dailyMinutes)-(s.settings.campusTimetable.find(c=>c.day===wd)?.minutes||0));
 if(overrides.some(o=>o.kind==='rest')||s.settings.recoveryDays.includes(day))return {minutes:0,independentMinutes:0,kind:'rest',reason:'Protected recovery day.'};
 if(overrides.some(o=>o.kind==='ensam'))return {minutes:academicMinutes,independentMinutes:0,kind:'academic',reason:'Your ENSAM override protects unfinished independent work.'};
 if(wd===0||slot.role==='rest')return {minutes:0,independentMinutes:0,kind:'rest',reason:'Rest. No missed-work debt.'};
 const protectedWindow=windows.some(w=>['exam_window','exam_prep','conditional_resit'].includes(w.kind));
 if(s.settings.paused||s.settings.pfeMode||sem?.id===6||s.settings.examMode==='on'||s.settings.examMode==='auto'&&protectedWindow)return {minutes:academicMinutes,independentMinutes:0,kind:'academic',reason:sem?.id===6||s.settings.pfeMode?'PFE priority; independent work is paused.':'Exam or ENSAM protection. Independent tasks remain unfinished.'};
 if(windows.some(w=>w.kind==='recovery'))return {minutes:0,independentMinutes:0,kind:'rest',reason:'Academic recovery window.'};
 if(slot.role==='academic'||wd===3||wd===5)return {minutes:academicMinutes,independentMinutes:0,kind:'academic',reason:wd===3?'Academic placeholder · add or activate your current ENSAM assignment.':'ENSAM overflow or rest.'};
 const cap=wd===6?Math.min(180,s.settings.saturdayMinutes):Math.min(90,s.settings.dailyMinutes);
 return {minutes:academicMinutes,independentMinutes:Math.max(0,Math.min(slot.minutes,cap)-(s.settings.campusTimetable.find(c=>c.day===wd)?.minutes||0)),kind:'normal',reason:s.planning.weeklySlots['S'+(sem?.id||1)]?.[ ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][wd] ]||'Flexible independent study',slot};
}
function resourceAllowed(s,t,day,rule){
 if(t.track==='academic')return !t.hypothetical||semesterFor(s,day)?.id===6||[3,5].includes(weekday(day));if(rule.kind!=='normal'||!rule.independentMinutes)return false;
 const slot=s.calendarSlots.find(x=>x.day===weekday(day)),sem=semesterFor(s,day);
 const allowed=slot.resources.length?slot.resources:s.planning.weeklyResources['S'+(sem?.id||1)]?.[weekday(day)]||[];
 return !slot.fixed||allowed.includes(t.resourceId);
}
export function readyV2(s,day,done=completed(s),{relaxRole=false}={}){
 const rule=ruleV2(s,day),sem=semesterFor(s,day)||[...s.semesters].reverse().find(x=>x.start<=day);if(!rule.minutes&& !rule.independentMinutes)return [];
 const lastResource=[...s.events].reverse().find(e=>e.type==='session'&&e.minutes>0)?.taskSnapshot?.resourceId;
 const recent=[...s.events].reverse().find(e=>e.type==='session'&&e.outcome==='partial'&&!done.has(e.taskId));
 return s.tasks.filter(t=>(!s.sameDayTrack||s.sameDayTrack.day!==day||t.track==='academic'||(t.primaryTrack||t.resourceId)===s.sameDayTrack.resourceId)&&(!t.hypothetical||t.semester===(sem?.id||1))&&(t.semester<=(sem?.id||1)||t.track==='academic'&&t.deadline&&t.deadline<=addDays(day,14))&&t.status==='active'&&t.reviewed&&!t.archived&&!done.has(t.id)&&(!t.notBefore||t.notBefore<=day)&&(!t.snoozedUntil||t.snoozedUntil<=day)&&s.resources.find(r=>r.id===t.resourceId)?.enabled!==false&&!s.units.find(u=>u.id===t.unitId)?.suspended&&(t.prerequisites||[]).every(id=>done.has(id))&&(relaxRole&&t.track==='independent'&&rule.kind==='normal'||resourceAllowed(s,t,day,rule))).sort((a,b)=>{
 const academic=t=>t.track==='academic'?0:1,deadline=t=>t.deadline||'9999',priority=t=>Number((t.priority||'P1')[1]),relevance=t=>t.semester===(sem?.id||1)?0:1,partial=t=>t.id===recent?.taskId?0:1,preferred=t=>s.settings.preferredResources.includes(t.resourceId)?0:1,resourcePriority=t=>s.resources.find(r=>r.id===t.resourceId)?.priority??9,continuity=t=>t.resourceId===lastResource?0:1,dayPreference=t=>!t.preferredDays?.length||t.preferredDays.includes(weekday(day))?0:1;
 return academic(a)-academic(b)||deadline(a).localeCompare(deadline(b))||priority(a)-priority(b)||relevance(a)-relevance(b)||partial(a)-partial(b)||resourcePriority(a)-resourcePriority(b)||continuity(a)-continuity(b)||preferred(a)-preferred(b)||dayPreference(a)-dayPreference(b)||(a.order??999)-(b.order??999)||remaining(s,a)-remaining(s,b)||a.id.localeCompare(b.id);
 });
}
function capFor(s,t,day,rule,weeklyUsed){const daily=(t.track==='academic'?rule.minutes:rule.independentMinutes)-dailyActual(s,day,t.track);return Math.max(0,t.track==='academic'?daily:Math.min(daily,Math.min(480,s.settings.weeklyMinutes)-weeklyUsed));}
export function choiceV2(s,day,done=completed(s),weeklyUsed=weeklyActual(s,day),usePin=true){
 const rule=ruleV2(s,day),ready=readyV2(s,day,done),available=t=>minimumBlock(s,t)<=capFor(s,t,day,rule,weeklyUsed);
 const pin=usePin&&s.pinnedDay?.day===day&&!done.has(s.pinnedDay.taskId)?s.tasks.find(t=>t.id===s.pinnedDay.taskId):null;
 const hard=ready.find(t=>t.track==='academic'&&t.deadline&&t.deadline<=addDays(day,1)&&available(t));
 let task,why;
 if(hard&&pin?.track!=='academic'){task=hard;why='A new hard academic deadline takes priority over the pinned task.';}
 else if(pin&&(resourceAllowed(s,pin,day,rule)||pin.userOverride&&rule.kind==='normal')&&!pin.archived&&pin.status==='active'&&pin.reviewed&&s.resources.find(r=>r.id===pin.resourceId)?.enabled!==false&&!s.units.find(u=>u.id===pin.unitId)?.suspended&&pin.prerequisites.every(id=>done.has(id))&&available(pin)){task=pin;why='Pinned for today; curriculum changes apply to later days.';}
 else {task=ready.find(available);why=task?.remainingMinutes<task?.minutes?'Continue partially finished work within today’s '+rule.reason:task?.track==='academic'&&task?.deadline?'Academic deadline '+task.deadline+' takes priority; prerequisites are ready.':rule.reason;}
 return {task:task||null,rule,reason:why,blocked:task?null:rule.kind==='academic'?rule.reason:'No reviewed, activated task fits this slot. Request activation in Curriculum or rest.'};
}
export function pinToday(s,day){const next=structuredClone(s);if(next.pinnedDay?.day===day)return next;if(next.sameDayTrack?.day!==day)next.sameDayTrack=null;const task=next.timer?next.tasks.find(t=>t.id===next.timer.taskId):choiceV2(next,day).task;next.pinnedDay=task?{day,taskId:task.id,reason:'Selected from explicit current progress.'}:null;return next;}
export function nextOnTrack(s,day,task){if(ruleV2(s,day).kind!=='normal')return null;return readyV2(s,day,completed(s),{relaxRole:true}).find(t=>t.track==='independent'&&(t.primaryTrack||t.resourceId)===(task.primaryTrack||task.resourceId)&&minimumBlock(s,t)<=capFor(s,t,day,ruleV2(s,day),weeklyActual(s,day)))||null;}
export function planRange(s,start,days=14,{staged=false,anchor=start}={}){
 const sim=structuredClone(s),done=completed(sim),result=[],left=new Map(sim.tasks.map(t=>[t.id,remaining(sim,t)]));let week='',used=0;
 for(let i=0;i<days;i++){
  const day=addDays(start,i),monday=addDays(day,-((weekday(day)+6)%7));if(monday!==week){week=monday;used=weeklyActual(s,day);}
  // Only a simulation may make reviewed drafts available beyond the actionable band.
  if(staged&&day>=addDays(anchor,14))for(const t of sim.tasks)if(t.status==='draft'&&t.reviewed&&!t.branch){t.status='active';t.hypothetical=true;}
  const choice=choiceV2(sim,day,done,used,i===0),t=choice.task,cap=t?capFor(s,t,day,choice.rule,used):0;
  if(!t){result.push({day,kind:choice.rule.kind,task:null,reason:choice.blocked||choice.reason,minutes:0,band:day<addDays(anchor,14)?'actionable':'tentative'});continue;}
  const minutes=Math.min(left.get(t.id),cap);if(minutes<=0){done.add(t.id);continue;}
  if(t.track==='independent')used+=minutes;left.set(t.id,left.get(t.id)-minutes);
  result.push({day,kind:'proposed',task:structuredClone(t),minutes,reason:choice.reason,band:day<addDays(anchor,14)?'actionable':'tentative',confidence:day<addDays(anchor,14)?'activated; projected allocation, completion unconfirmed':'tentative',notActivated:s.tasks.find(x=>x.id===t.id)?.status!=='active'});
  if(left.get(t.id)<=0)done.add(t.id);else t.remainingMinutes=left.get(t.id);
 }
 return result;
}
export function project(s,start,end='2029-06-30',catalog){
 const days=Math.floor((new Date(end+'T12:00Z')-new Date(start+'T12:00Z'))/86400000)+1;if(days<1||days>1500)throw Error('Projection must be between 1 and 1500 civil days.');
 let sim=structuredClone(s);
 if(catalog){
  // Work only in a simulation copy. Resolve duplicate headings to existing unit IDs.
  const compatible=catalog.resources.filter(r=>!s.resources.some(x=>x.id===r.id&&x.edition&&r.edition&&x.edition!==r.edition));
  const allowed=new Set(compatible.map(r=>r.id));const raw={...catalog,resources:compatible,units:catalog.units.filter(u=>allowed.has(u.resourceId))};
  // A skipped edition may also remove a dependency; leave that branch out of this scenario.
  let ids=new Set(raw.units.map(u=>u.id));let changed=true;while(changed){const next=raw.units.filter(u=>u.dependencies.every(id=>ids.has(id)||sim.units.some(x=>x.id===id)));changed=next.length!==raw.units.length;raw.units=next;ids=new Set(next.map(u=>u.id));}
  const preview=previewImport(sim,raw);sim=applyImport(sim,raw,preview.rows.filter(r=>r.kind==='add').map(r=>r.unit.id));
 }
 const done=completed(sim),left=new Map(sim.tasks.map(t=>[t.id,remaining(sim,t)])),rows=[];let week='',used=0;
 for(let i=0;i<days;i++){
  const day=addDays(start,i),mon=addDays(day,-((weekday(day)+6)%7));if(mon!==week){week=mon;used=weeklyActual(s,day);}
  const band=i<14?'actionable':i<42?'tentative':'scenario',sem=semesterFor(s,day);
  for(const t of sim.tasks)if(t.status==='draft'&&!t.branch&&(i>=42||i>=14&&t.reviewed)){t.status='active';t.reviewed=true;t.hypothetical=true;}
  const choice=choiceV2(sim,day,done,used,i===0),task=choice.task,unit=task&&sim.units.find(u=>u.id===task.unitId),rule=choice.rule;
  const minutes=task?Math.min(left.get(task.id),capFor(s,task,day,rule,used)):0;
  const original=s.tasks.find(t=>t.id===task?.id),notActivated=Boolean(task&&(!original||original.status!=='active'));
  const confidence=band==='actionable'?'activated · projected allocation; completion unconfirmed':band==='tentative'?'tentative · assumes earlier learning outcomes':sem?.confidence==='planning_assumption'?'estimated future dates · NOT AN ACADEMIC COMMITMENT':'hypothetical source sequence · NOT AN ASSIGNMENT';
  rows.push({day,kind:task?'proposed':rule.kind,task:task&&band!=='scenario'?structuredClone(task):null,unit:task&&band==='scenario'?{id:unit.id,heading:unit.heading,unitRef:unit.unitRef,resourceId:unit.resourceId,resource:task.resource,confidence:unit.confidence}:null,track:task?.track,minutes,semester:sem?.id,band,confidence,notActivated,reason:band==='scenario'&&task?'PROVISIONAL · '+(notActivated?'NOT ACTIVATED · ':'')+(unit.kind==='academic_module'?'Module placeholder; teacher sequence unknown':'Source heading; authored action and estimated effort'):choice.blocked||choice.reason,windows:windowsOn(s,day)});
  if(task){if(task.track==='independent')used+=minutes;left.set(task.id,left.get(task.id)-minutes);if(left.get(task.id)<=0)done.add(task.id);else task.remainingMinutes=left.get(task.id);}
 }
 return rows;
}
export function explainTask(s,t,day){
 const done=completed(s),voided=new Set(s.events.filter(e=>e.type==='void').map(e=>e.target)),fact=s.events.find(e=>e.type==='session'&&e.taskId===t.id&&e.outcome==='completed'&&!voided.has(e.id)),snapshot=fact?.taskSnapshot;
 const u=snapshot?.sourceSnapshot||s.units.find(u=>u.id===t.unitId),r=snapshot?.resourceSnapshot||(fact?{edition:'Historical edition not recorded'}:s.resources.find(r=>r.id===t.resourceId));
 return {heading:u?.sourceHeading||u?.heading||snapshot?.heading||t.heading,objective:snapshot?.action||t.action,why:fact?'Completed evidence is retained; changes create a follow-up.':choiceV2(s,day).task?.id===t.id?choiceV2(s,day).reason:'Review task; not selected for this slot.',prerequisites:t.prerequisites.map(id=>({id,heading:s.tasks.find(t=>t.id===id)?.heading,satisfied:done.has(id)})),evidence:snapshot?.evidence||t.evidence,source:u?.source||t.provenance,confidence:u?.confidence||t.confidence||'user_authored',edition:r?.edition||'unconfirmed',url:snapshot?.url||t.url,estimate:'ESTIMATED duration · AUTHORED learning action',attachment:s.attachments.find(a=>a.unitId===t.unitId)?.name||t.localLocator};
}
