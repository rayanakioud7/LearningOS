import {isCivilDate} from './validation.js';
import {activeAttempts,isHardDeadline} from './effort.js';
import {previewImport,applyImport} from './curriculum.js';
import {addDays,weekday,completed,remaining,weeklyActual,dailyActual,minimumBlock} from './engine.js';
import {phaseFor,weeklyCeiling,blockPlan} from './roadmap.js';
export const SCHEDULING_POLICY_VERSION=2;
export function semesterFor(s,day){return s.semesters?.find(x=>x.start<=day&&x.end>=day)||null;}
const policySemester=(s,day)=>semesterFor(s,day)||[...s.semesters].sort((a,b)=>b.start.localeCompare(a.start)).find(x=>x.start<=day)||null;
export function windowsOn(s,day){return s.calendar.filter(w=>w.active&&w.start_date<=day&&w.end_date_inclusive>=day);}
export function ruleV2(s,day){
 if(!isCivilDate(day))throw Error('Invalid civil date.');
 const wd=weekday(day),slot=s.calendarSlots.find(x=>x.day===wd),overrides=s.overrides.filter(o=>o.day===day),windows=windowsOn(s,day),sem=policySemester(s,day);
 if(day>'2029-06-30'||day<(s.semesters[0]?.start||'1900-01-01'))return {minutes:0,independentMinutes:0,kind:'rest',reason:'Outside the configured program dates.'};
 const academicMinutes=Math.max(0,(s.settings.discretionaryMinutes?.[wd]??(wd===6?s.settings.saturdayMinutes:s.settings.dailyMinutes))-(s.settings.campusTimetable.find(c=>c.day===wd)?.minutes||0));
 if(overrides.some(o=>o.kind==='rest')||s.settings.recoveryDays.includes(day)||windows.some(w=>['no_work','holiday'].includes(w.kind)))return {minutes:0,independentMinutes:0,kind:'rest',reason:'Protected recovery day.'};
 if(overrides.some(o=>o.kind==='ensam'))return {minutes:academicMinutes,independentMinutes:0,kind:'academic',reason:'Your ENSAM override protects unfinished independent work.'};
 if(wd===0||slot.role==='rest')return {minutes:0,independentMinutes:0,kind:'rest',reason:'Rest. No missed-work debt.'};
 const protectedWindow=windows.some(w=>['exam_window','exam_prep','conditional_resit'].includes(w.kind));
 if(s.settings.paused||s.settings.pfeMode||sem?.id===6||s.settings.examMode==='on'||s.settings.examMode==='auto'&&protectedWindow)return {minutes:academicMinutes,independentMinutes:0,kind:'academic',reason:sem?.id===6||s.settings.pfeMode?'PFE priority; independent work is paused.':'Exam or ENSAM protection. Independent tasks remain unfinished.'};
 if(windows.some(w=>w.kind==='recovery'))return {minutes:0,independentMinutes:0,kind:'rest',reason:'Academic recovery window.'};
 if(slot.role==='academic'||wd===3||wd===5)return {minutes:academicMinutes,independentMinutes:0,kind:'academic',reason:wd===3?'Academic placeholder · add or activate your current ENSAM assignment.':'ENSAM overflow or rest.'};
 const phase=phaseFor(s,day);
 const dayCap=wd===6?Math.min(180,phase?.saturdayMinutes??s.settings.saturdayMinutes):(phase?.dailyIndependentMinutes??s.settings.dailyMinutes);
 return {minutes:academicMinutes,independentMinutes:Math.max(0,Math.min(slot.minutes,dayCap)-(s.settings.campusTimetable.find(c=>c.day===wd)?.minutes||0)),kind:'normal',reason:(phase?.mode&&phase.mode!=='teaching'?`${phase.mode} · `:'')+s.planning.weeklySlots['S'+(sem?.id||1)]?.[ ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][wd] ]||'Flexible independent study',slot,phase:phase?.id};
}
function primaryResourcesFor(s,day){
 const slot=s.calendarSlots.find(x=>x.day===weekday(day)),sem=policySemester(s,day),semester='S'+(sem?.id||1);
 return slot.resources.length?slot.resources:s.planning.weeklyResources?.[semester]?.[weekday(day)]||[];
}
function weeklyResourcesFor(s,day){
 const sem=policySemester(s,day),semester='S'+(sem?.id||1),weekdayIndex=weekday(day);
 const primary=primaryResourcesFor(s,day);
 const secondary=s.planning.weeklySecondary?.[semester]?.[weekdayIndex]||[];
 const continuation=s.sameDayTrack?.day===day?[s.sameDayTrack.resourceId]:[];
 return [...new Set([...primary,...secondary,...continuation])];
}
export function secondaryResources(s,day){
 const sem=policySemester(s,day),semester='S'+(sem?.id||1),weekdayIndex=weekday(day);
 return s.planning.weeklySecondary?.[semester]?.[weekdayIndex]||[];
}
function resourceAllowed(s,t,day,rule){
 if(t.track==='academic')return (rule.kind==='academic'||isHardDeadline(t)&&t.deadline<=addDays(day,s.settings.deadlineLeadDays??2))&&(!t.hypothetical||semesterFor(s,day)?.id===6||[3,5].includes(weekday(day))); if(rule.kind!=='normal'||!rule.independentMinutes)return false;
 const slot=s.calendarSlots.find(x=>x.day===weekday(day));
 const allowed=weeklyResourcesFor(s,day);
 return !slot.fixed||allowed.includes(t.resourceId)||t.resourceId==='vanderplas-2e'&&allowed.includes('vanderplas');
}
function urgentWork(s,day,done){
 const result=new Map(),tasks=new Map(s.tasks.map(t=>[t.id,t]));
 for(const t of s.tasks.filter(t=>isHardDeadline(t)&&t.status==='active'&&!t.archived&&!done.has(t.id)&&t.deadline<=addDays(day,s.settings.deadlineLeadDays??2))){
  const pending=[t.id],seen=new Set();while(pending.length){const id=pending.pop();if(done.has(id)||seen.has(id))continue;seen.add(id);if(!result.has(id)||result.get(id)>t.deadline)result.set(id,t.deadline);pending.push(...(tasks.get(id)?.prerequisites||[]));}
 }
 return result;
}
export function readyV2(s,day,done=completed(s),{relaxRole=false}={}){
 const rule=ruleV2(s,day),sem=semesterFor(s,day)||[...s.semesters].reverse().find(x=>x.start<=day);if(!rule.minutes&& !rule.independentMinutes)return [];
 const urgency=urgentWork(s,day,done),attempts=activeAttempts(s);
 const lastResource=[...attempts].reverse().find(e=>e.type==='session'&&e.minutes>0)?.taskSnapshot?.resourceId;
 const recent=[...attempts].reverse().find(e=>e.type==='session'&&e.outcome==='partial'&&!done.has(e.taskId));
 return s.tasks.filter(t=>(!s.sameDayTrack||s.sameDayTrack.day!==day||t.track==='academic'||urgency.has(t.id)||(t.primaryTrack||t.resourceId)===s.sameDayTrack.resourceId)&&(!t.hypothetical||t.semester===(sem?.id||1))&&(t.semester<=(sem?.id||1)||isHardDeadline(t)&&t.deadline<=addDays(day,14))&&(!t.hypothetical||t.track!=='academic')&&t.status==='active'&&t.reviewed&&!t.archived&&!done.has(t.id)&&(!t.notBefore||t.notBefore<=day)&&(!t.snoozedUntil||t.snoozedUntil<=day)&&s.resources.find(r=>r.id===t.resourceId)?.enabled!==false&&!s.units.find(u=>u.id===t.unitId)?.suspended&&(t.prerequisites||[]).every(id=>done.has(id))&&(urgency.has(t.id)&&(t.track==='academic'||rule.kind==='normal')||relaxRole&&t.track==='independent'&&rule.kind==='normal'||resourceAllowed(s,t,day,rule))).sort((a,b)=>{
 const academic=t=>urgency.has(t.id)?0:1,deadline=t=>urgency.get(t.id)||(isHardDeadline(t)?t.deadline:'9999'),priority=t=>Number((t.priority||'P1')[1]),relevance=t=>t.semester===(sem?.id||1)?0:1,partial=t=>t.id===recent?.taskId?0:1,preferred=t=>s.settings.preferredResources.includes(t.resourceId)?0:1,resourcePriority=t=>s.resources.find(r=>r.id===t.resourceId)?.priority??9,continuity=t=>t.resourceId===lastResource?0:1,dayPreference=t=>!t.preferredDays?.length||t.preferredDays.includes(weekday(day))?0:1;
 return academic(a)-academic(b)||deadline(a).localeCompare(deadline(b))||priority(a)-priority(b)||relevance(a)-relevance(b)||partial(a)-partial(b)||resourcePriority(a)-resourcePriority(b)||continuity(a)-continuity(b)||preferred(a)-preferred(b)||dayPreference(a)-dayPreference(b)||(a.order??999)-(b.order??999)||remaining(s,a)-remaining(s,b)||a.id.localeCompare(b.id);
 });
}
export function capFor(s,t,day,rule=ruleV2(s,day),weeklyUsed=weeklyActual(s,day)){
 const shared=rule.minutes-dailyActual(s,day,'academic')-dailyActual(s,day,'independent');
 const target=rule.independentMinutes-dailyActual(s,day,'independent');
 return Math.max(0,t.track==='academic'?shared:Math.min(shared,target,weeklyCeiling(s,day)-weeklyUsed));
}
export function choiceV2(s,day,done=completed(s),weeklyUsed=weeklyActual(s,day),usePin=true,diagnostics=true){
 const rule=ruleV2(s,day),ready=readyV2(s,day,done),available=t=>minimumBlock(s,t)<=capFor(s,t,day,rule,weeklyUsed);
 const pin=usePin&&s.pinnedDay?.day===day&&!done.has(s.pinnedDay.taskId)?s.tasks.find(t=>t.id===s.pinnedDay.taskId):null;
 const urgency=urgentWork(s,day,done),hard=ready.find(t=>urgency.has(t.id)&&available(t));
 let task,why;
 if(hard&&hard.id!==pin?.id){task=hard;why=isHardDeadline(hard)?'A confirmed hard academic deadline takes priority over the pinned task.':'Prerequisite for a confirmed hard academic deadline takes priority.';}
 else if(pin&&pin.semester<=(semesterFor(s,day)?.id||[...s.semesters].reverse().find(x=>x.start<=day)?.id||1)&&(!pin.notBefore||pin.notBefore<=day)&&(!pin.snoozedUntil||pin.snoozedUntil<=day)&&(!s.sameDayTrack||s.sameDayTrack.day!==day||pin.track==='academic'||(pin.primaryTrack||pin.resourceId)===s.sameDayTrack.resourceId)&&(resourceAllowed(s,pin,day,rule)||s.pinnedDay?.userOverride&&rule.kind==='normal')&&!pin.archived&&pin.status==='active'&&pin.reviewed&&s.resources.find(r=>r.id===pin.resourceId)?.enabled!==false&&!s.units.find(u=>u.id===pin.unitId)?.suspended&&pin.prerequisites.every(id=>done.has(id))&&available(pin)){task=pin;why='Pinned for today; curriculum changes apply to later days.';}
 else {task=ready.find(available);why=task?.remainingMinutes<task?.minutes?'Continue partially finished work within today’s '+rule.reason:task&&isHardDeadline(task)?'Confirmed academic deadline '+task.deadline+' takes priority; prerequisites are ready.':rule.reason;}
 let rescueMinutes=0;
 if(!task&&s.settings.crossDayRescue&&rule.kind==='normal'){
  const partials=new Set(activeAttempts(s).filter(e=>e.outcome==='partial'&&!done.has(e.taskId)).map(e=>e.taskId));
  const slack=Math.max(0,Math.min(rule.minutes-dailyActual(s,day,'academic')-Math.max(rule.independentMinutes,dailyActual(s,day,'independent')),s.settings.weeklyMinutes-weeklyUsed));
  task=readyV2(s,day,done,{relaxRole:true}).find(t=>t.track==='independent'&&partials.has(t.id)&&remaining(s,t)<=(s.settings.smallResidualMinutes??30)&&remaining(s,t)<=slack);
  if(task){rescueMinutes=remaining(s,task);why='Small partial resumed in unused slack; the full home-track block remains reserved.';}
 }
 const waiting=diagnostics?backlogWarnings(s,day):[];
 return {task:task||null,rule,reason:why,rescueMinutes,unplacedReadyTasks:ready.filter(t=>t.id!==task?.id).map(t=>t.id),warnings:waiting,blocked:task?null:rule.kind==='rest'?rule.reason:ready.length?'The remaining shared time or weekly ceiling cannot fit a ready task. No extra work is owed.':rule.kind==='academic'?rule.reason+' No confirmed coursework is ready; this is not assumed free time.':'No reviewed, activated task fits this weekday role, start date and prerequisites. Review Curriculum or rest.'};
}
export function pinToday(s,day){const next=structuredClone(s);if(next.pinnedDay?.day===day)return next;if(next.sameDayTrack?.day!==day)next.sameDayTrack=null;const task=next.timer?next.tasks.find(t=>t.id===next.timer.taskId):choiceV2(next,day).task;next.pinnedDay=task?{day,taskId:task.id,reason:'Selected from explicit current progress.'}:null;return next;}
export function nextOnTrack(s,day,task){if(ruleV2(s,day).kind!=='normal')return null;return readyV2(s,day,completed(s),{relaxRole:true}).find(t=>t.track==='independent'&&(t.primaryTrack||t.resourceId)===(task.primaryTrack||task.resourceId)&&minimumBlock(s,t)<=capFor(s,t,day,ruleV2(s,day),weeklyActual(s,day)))||null;}
export function nextSecondary(s,day,task){
 const rule=ruleV2(s,day);if(rule.kind!=='normal'||!rule.independentMinutes)return null;
 if(!primaryResourcesFor(s,day).includes(task.primaryTrack||task.resourceId))return null;
 const secondary=secondaryResources(s,day),used=weeklyActual(s,day);
 return readyV2(s,day,completed(s)).find(t=>secondary.includes(t.primaryTrack||t.resourceId)&&minimumBlock(s,t)<=capFor(s,t,day,rule,used))||null;
}
export function planRange(s,start,days=14,{staged=false,anchor=start}={}){
 if(!isCivilDate(start)||!isCivilDate(anchor)||!Number.isInteger(days)||days<1||days>1500)throw Error('Invalid date range.');
 const sim=structuredClone(s),done=completed(sim),result=[],left=new Map(sim.tasks.map(t=>[t.id,remaining(sim,t)]));let week='',used=0;
 for(let i=0;i<days;i++){
  const day=addDays(start,i),monday=addDays(day,-((weekday(day)+6)%7));if(monday!==week){week=monday;used=weeklyActual(s,day);}
  // Only a simulation may make reviewed drafts available beyond the actionable band.
  if(day<anchor){result.push(historicalDay(s,day));continue;}
  if(staged&&day>=addDays(anchor,14))for(const t of sim.tasks)if(t.status==='draft'&&t.reviewed&&!t.branch){t.status='active';t.hypothetical=true;}
  const choice=choiceV2(sim,day,done,used,day===anchor,false),t=choice.task,cap=t?(choice.rescueMinutes||capFor(s,t,day,choice.rule,used)):0;
  if(!t){result.push({day,kind:choice.rule.kind,task:null,reason:choice.blocked||choice.reason,minutes:0,band:day<addDays(anchor,14)?'actionable':'tentative'});continue;}
  const minutes=Math.min(left.get(t.id),cap);if(minutes<=0){done.add(t.id);continue;}
  if(t.track==='independent')used+=minutes;left.set(t.id,left.get(t.id)-minutes);
  result.push({day,kind:'proposed',task:structuredClone(t),minutes,reason:choice.reason,band:day<addDays(anchor,14)?'actionable':'tentative',confidence:day<addDays(anchor,14)?'activated; projected allocation, completion unconfirmed':'tentative',notActivated:s.tasks.find(x=>x.id===t.id)?.status!=='active'});
  if(left.get(t.id)<=0)done.add(t.id);else t.remainingMinutes=left.get(t.id);
 }
 return result;
}
export function project(s,start,end='2029-06-30',catalog,{anchor=start}={}){
 if(!isCivilDate(start)||!isCivilDate(end)||!isCivilDate(anchor))throw Error('Invalid projection date.');
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
  if(day<anchor){rows.push(historicalDay(s,day));continue;}
  const offset=Math.round((new Date(day+'T12:00Z')-new Date(anchor+'T12:00Z'))/86400000);
  const band=offset<14?'actionable':offset<42?'tentative':'scenario',sem=semesterFor(s,day);
  for(const t of sim.tasks)if(t.status==='draft'&&!t.branch&&t.track!=='academic'&&(offset>=42||offset>=14&&t.reviewed)){t.status='active';t.reviewed=true;t.hypothetical=true;}
  const choice=choiceV2(sim,day,done,used,day===anchor,false),rule=choice.rule;
  const plan=blockPlan(sim,day);
  let dayUsed=0,weeklyRemaining=weeklyCeiling(sim,day)-used,rowBlocks=[];
  if(rule.kind==='normal'){
    const pin=s.pinnedDay?.day===day?sim.tasks.find(t=>t.id===s.pinnedDay.taskId):null;
    if(pin&&!done.has(pin.id)&&(!pin.notBefore||pin.notBefore<=day)&&(!pin.snoozedUntil||pin.snoozedUntil<=day)&&(pin.prerequisites||[]).every(id=>done.has(id))){
      const pinCap=Math.max(0,Math.min(rule.independentMinutes-dayUsed,weeklyRemaining));
      if(minimumBlock(sim,pin)<=pinCap){
        const minutes=Math.min(left.get(pin.id),pinCap);
        rowBlocks.push({task:structuredClone(pin),minutes,kind:'primary',resources:[pin.resourceId]});
        dayUsed+=minutes;weeklyRemaining-=minutes;
        if(pin.track==='independent')used+=minutes;
        left.set(pin.id,left.get(pin.id)-minutes);
        if(left.get(pin.id)<=0)done.add(pin.id);else pin.remainingMinutes=left.get(pin.id);
      }
    }
  }
  if(plan&&rule.kind==='normal'){
    const independentMinutes=Math.max(0,rule.independentMinutes-dailyActual(sim,day,'independent'));
    for(const block of plan){
      const cap=Math.max(0,Math.min(block.minutes,independentMinutes-dayUsed,weeklyRemaining));
      let bt=null;
      if(cap>0){
        const ready=readyV2(sim,day,done).filter(u=>block.resources.includes(u.resourceId)||block.resources.includes(u.primaryTrack||u.resourceId));
        bt=ready.find(u=>minimumBlock(sim,u)<=cap);
      }
      if(bt){
        const minutes=Math.min(left.get(bt.id),cap);
        if(minutes<=0)continue;
        rowBlocks.push({task:structuredClone(bt),minutes,kind:block.kind,resources:block.resources});
        dayUsed+=minutes;weeklyRemaining-=minutes;
        if(bt.track==='independent')used+=minutes;
        left.set(bt.id,left.get(bt.id)-minutes);
        if(left.get(bt.id)<=0)done.add(bt.id);else bt.remainingMinutes=left.get(bt.id);
      }
    }
  }
  const task=rowBlocks[0]?.task||null,unit=task&&sim.units.find(u=>u.id===task.unitId);
  const total=rowBlocks.reduce((n,b)=>n+b.minutes,0);
  const original=s.tasks.find(t=>t.id===task?.id),notActivated=Boolean(task&&(!original||original.status!=='active'));
  const confidence=band==='actionable'?'activated · projected allocation; completion unconfirmed':band==='tentative'?'tentative · assumes earlier learning outcomes':sem?.confidence==='planning_assumption'?'estimated future dates · NOT AN ACADEMIC COMMITMENT':'hypothetical source sequence · NOT AN ASSIGNMENT';
  if(!task){
    rows.push({day,kind:rule.kind,task:null,unit:null,reason:plan?'No ready unit for today’s block.':(choice.blocked||choice.reason),minutes:0,band,confidence,notActivated:false,semester:sem?.id,track:null,windows:windowsOn(s,day)});continue;
  }
  rows.push({day,kind:'proposed',task:band!=='scenario'?structuredClone(task):null,unit:band==='scenario'?{id:unit.id,heading:unit.heading,unitRef:unit.unitRef,resourceId:unit.resourceId,resource:task.resource,confidence:unit.confidence}:null,blocks:rowBlocks,track:task.track,minutes:total,semester:sem?.id,band,confidence,notActivated,reason:undefined,windows:windowsOn(s,day)});
 }
 return rows;
}
export function explainTask(s,t,day){
 const done=completed(s),voided=new Set(s.events.filter(e=>e.type==='void').map(e=>e.target)),fact=s.events.find(e=>e.type==='session'&&e.taskId===t.id&&e.outcome==='completed'&&!voided.has(e.id)),snapshot=fact?.taskSnapshot;
 const selection=fact?null:choiceV2(s,day);
 const u=snapshot?.sourceSnapshot||s.units.find(u=>u.id===t.unitId),r=snapshot?.resourceSnapshot||(fact?{edition:'Historical edition not recorded'}:s.resources.find(r=>r.id===t.resourceId));
 return {warnings:selection?.warnings||[],heading:u?.sourceHeading||u?.heading||snapshot?.heading||t.heading,objective:snapshot?.action||t.action,why:fact?'Completed evidence is retained; changes create a follow-up.':selection?.task?.id===t.id?selection.reason:'Review task; not selected for this slot.',prerequisites:t.prerequisites.map(id=>({id,heading:s.tasks.find(t=>t.id===id)?.heading,satisfied:done.has(id)})),evidence:snapshot?.evidence||t.evidence,source:u?.source||t.provenance,confidence:u?.confidence||t.confidence||'user_authored',edition:r?.edition||'unconfirmed',url:snapshot?.url||t.url,estimate:'ESTIMATED duration · AUTHORED learning action',attachment:s.attachments.find(a=>a.unitId===t.unitId)?.name||t.localLocator};
}

export function historicalDay(s,day){
 const attempts=activeAttempts(s).filter(e=>e.day===day);
 return {day,band:'actual',kind:'history',task:null,unit:null,attempts,minutes:attempts.reduce((n,e)=>n+e.minutes,0),reason:attempts.length?'Recorded attempts · completion only when explicitly confirmed':'No recorded attempts',confidence:'Actual saved history; no forward simulation',windows:windowsOn(s,day)};
}
export const selectNext=choiceV2;
export function allocateWeek(s,day){const start=addDays(day,-((weekday(day)+6)%7));return project(s,start,addDays(start,6),undefined,{anchor:day});}
export const simulateRange=project;
export {phaseFor,weeklyCeiling,blockPlan};

export function backlogWarnings(s,day){
 const done=completed(s),attempts=activeAttempts(s),warnings=[];
 for(const resource of s.resources.filter(r=>r.enabled)){
  const tasks=s.tasks.filter(t=>t.resourceId===resource.id&&t.track==='independent'&&t.status==='active'&&t.reviewed&&!t.archived&&!done.has(t.id)&&(!t.notBefore||t.notBefore<=day));
  if(!tasks.length)continue;
  const last=attempts.filter(e=>e.day<=day&&(e.taskSnapshot?.resourceId||s.tasks.find(t=>t.id===e.taskId)?.resourceId)===resource.id).map(e=>e.day).sort().at(-1);
  // Count protected/missed home opportunities, rather than borrowing another subject's weekday.
  let slots=0;
  for(let i=1;i<=28;i++){const d=addDays(day,-i);if(last&&d<=last)break;const rule=ruleV2(s,d);if(rule.kind==='normal'&&tasks.some(t=>(!t.notBefore||t.notBefore<=d)&&resourceAllowed(s,t,d,rule)))slots++;}
  if(slots>=2)warnings.push({resourceId:resource.id,homeSlotsSincePractice:slots,reason:'Backlog needs review; home-track roles remain protected.'});
 }
 return warnings;
}
