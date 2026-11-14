export function isCivilDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const parsed=new Date(value+'T12:00:00Z');return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
}
export function validateBackup(x){
  if(!x||![1,2].includes(x.schema)||!Array.isArray(x.tasks)||!Array.isArray(x.events)||!Array.isArray(x.calendar)||!Array.isArray(x.overrides)||!x.settings||!Array.isArray(x.revisions)||!Array.isArray(x.checkpoints)||!Number.isInteger(x.revision)||x.revision<0)throw Error('This is not a Learning OS backup.');
  if(x.revisions.length>50000||x.checkpoints.length>1000||x.tasks.length>5000||x.events.length>100000||x.calendar.length>1000||x.overrides.length>10000)throw Error('Backup is too large.');
  const text=(v,required=false)=>typeof v==='string'&&v.length<=10000&&(!required||v.trim().length>0);
  const optionalDate=v=>!v||isCivilDate(v);
  const tasks=new Map();
  for(const t of x.tasks){
    if(!t||!text(t.id,true)||tasks.has(t.id)||!text(t.title,true)||!text(t.resource,true)||!text(t.heading,true)||!text(t.action,true)||!text(t.evidence,true)||!text(t.section??'')||!Number.isFinite(t.minutes)||t.minutes<1||t.minutes>10000||!['draft','active'].includes(t.status)||!['academic','independent'].includes(t.track)||!Array.isArray(t.prerequisites))throw Error('Invalid task in backup.');
    if(!optionalDate(t.notBefore)||!optionalDate(t.deadline)||!optionalDate(t.snoozedUntil)||t.remainingMinutes!=null&&(!Number.isFinite(t.remainingMinutes)||t.remainingMinutes<1||t.remainingMinutes>10000)||t.minimumMinutes!=null&&(!Number.isFinite(t.minimumMinutes)||t.minimumMinutes<1)||t.preferredDays!=null&&(!Array.isArray(t.preferredDays)||t.preferredDays.some(d=>!Number.isInteger(d)||d<0||d>6)))throw Error('Invalid task estimate or date.');
    if(['url','provenance'].some(k=>t[k]!=null&&!text(t[k]))||t.order!=null&&!Number.isFinite(t.order)||t.archived!=null&&typeof t.archived!=='boolean')throw Error('Invalid task metadata.');
    for(const k of ['initialEstimateMinutes'])if(t[k]!=null&&(!Number.isFinite(t[k])||t[k]<1||t[k]>10000))throw Error('Invalid initial estimate.');
    if(t.deadlineType!=null&&!['unknown','personal','teacher'].includes(t.deadlineType))throw Error('Invalid deadline classification.');
    for(const k of ['assignmentConfirmed','teacherConfirmed','deadlineConfirmed'])if(t[k]!=null&&typeof t[k]!=='boolean')throw Error('Invalid deadline confirmation.');
    tasks.set(t.id,t);
  }
  for(const t of tasks.values())if(t.prerequisites.some(id=>!tasks.has(id)))throw Error('Invalid task dependency.');
  const colours=new Map();
  for(const id of tasks.keys()){
    if(colours.get(id)===2)continue;const stack=[[id,0]];colours.set(id,1);
    while(stack.length){const frame=stack.at(-1),deps=tasks.get(frame[0]).prerequisites;
      if(frame[1]>=deps.length){colours.set(frame[0],2);stack.pop();continue;}
      const dep=deps[frame[1]++];if(colours.get(dep)===1)throw Error('Prerequisite cycle found.');if(colours.get(dep)!==2){colours.set(dep,1);stack.push([dep,0]);}
    }
  }
  const events=new Map();
  for(const e of x.events){
    if(!e||!text(e.id,true)||events.has(e.id)||!['session','void'].includes(e.type))throw Error('Invalid session history.');
    if(e.type==='session'&&(!tasks.has(e.taskId)||!['completed','partial','ensam','skipped'].includes(e.outcome)||!Number.isFinite(e.minutes)||e.minutes<0||e.minutes>10000||!isCivilDate(e.day)||e.note!=null&&!text(e.note)))throw Error('Invalid study session.');if(e.taskSnapshot!=null&&(typeof e.taskSnapshot!=='object'||Array.isArray(e.taskSnapshot)||['resource','section','heading','action','evidence'].some(k=>e.taskSnapshot[k]!=null&&!text(e.taskSnapshot[k]))||e.taskSnapshot.track!=null&&!['academic','independent'].includes(e.taskSnapshot.track)))throw Error('Invalid historical task snapshot.');events.set(e.id,e);
  }
  for(const e of events.values())if(e.type==='void'&&events.get(e.target)?.type!=='session')throw Error('A correction must reference a saved session.');
  const s=x.settings;
  if(!Number.isFinite(s.weeklyMinutes)||s.weeklyMinutes<0||s.weeklyMinutes>1800||!Number.isFinite(s.focusMinutes)||s.focusMinutes<1||s.focusMinutes>120||!Number.isFinite(s.breakMinutes)||s.breakMinutes<1||s.breakMinutes>30||!['auto','on','off'].includes(s.examMode)||typeof s.paused!=='boolean')throw Error('Invalid settings.');
  for(const k of ['dailyMinutes','saturdayMinutes'])if(!Number.isFinite(s[k])||s[k]<25||s[k]>480)throw Error('Invalid capacity.');
  try{if(typeof s.timezone!=='string')throw Error();new Intl.DateTimeFormat('en',{timeZone:s.timezone}).format(new Date());}catch{throw Error('Invalid timezone.');}
  const calendarIds=new Set();for(const c of x.calendar){if(!c||!text(c.id,true)||calendarIds.has(c.id)||!text(c.title,true)||!text(c.kind,true)||typeof c.active!=='boolean'||!isCivilDate(c.start_date)||!isCivilDate(c.end_date_inclusive)||c.start_date>c.end_date_inclusive)throw Error('Invalid academic calendar.');calendarIds.add(c.id);}
  for(const o of x.overrides)if(!o||!isCivilDate(o.day)||!['rest','ensam'].includes(o.kind))throw Error('Invalid availability override.');
  if(x.timer){const t=x.timer;if(!text(t.id,true)||!tasks.has(t.taskId)||typeof t.running!=='boolean'||!Number.isFinite(t.startedAt)||!Number.isFinite(t.accumulatedMs)||t.accumulatedMs<0||!Number.isFinite(t.targetMinutes)||t.targetMinutes<1||t.targetMinutes>120)throw Error('Invalid saved focus timer.');}
  if(x.breakUntil!=null&&!Number.isFinite(x.breakUntil))throw Error('Invalid break timer.');
  if(x.schema===2)validateV2(x);
  return x;
}

export function validateGraph(nodes,label='task'){
 const map=new Map();for(const n of nodes){if(!n?.id||map.has(n.id)||!Array.isArray(n.prerequisites))throw Error('Invalid '+label+' ID or dependency list.');map.set(n.id,n);}
 for(const n of nodes)for(const id of n.prerequisites)if(!map.has(id))throw Error('Orphan '+label+' dependency: '+n.id+' → '+id);
 const colours=new Map();for(const root of map.keys()){if(colours.get(root)===2)continue;const stack=[[root,0]];colours.set(root,1);while(stack.length){const f=stack.at(-1),deps=map.get(f[0]).prerequisites;if(f[1]>=deps.length){colours.set(f[0],2);stack.pop();continue;}const id=deps[f[1]++];if(colours.get(id)===1)throw Error('Prerequisite cycle: '+f[0]+' → '+id);if(colours.get(id)!==2){colours.set(id,1);stack.push([id,0]);}}}
}
function validateV2(s){
 for(const k of ['resources','units','semesters','calendarSlots','importBatches','attachments'])if(!Array.isArray(s[k]))throw Error('Missing curriculum model: '+k);
 if(s.resources.length>1000||s.units.length>5000||s.attachments.length>200)throw Error('Curriculum too large.');
 const resources=new Map();for(const r of s.resources){if(!r||typeof r.id!=='string'||!r.id||resources.has(r.id)||typeof r.name!=='string'||!r.name||typeof r.enabled!=='boolean'||r.url!=null&&typeof r.url!=='string'||r.source!=null&&typeof r.source!=='string'||r.edition!=null&&typeof r.edition!=='string')throw Error('Invalid resource.');for(const k of ['order','priority'])if(r[k]!=null&&(!Number.isFinite(r[k])||r[k]<0||r[k]>999))throw Error('Invalid resource order or priority.');resources.set(r.id,r);}
 validateGraph(s.units.map(u=>({id:u.id,prerequisites:u.dependencies})),'unit');
 const units=new Map(s.units.map(u=>[u.id,u]));
 for(const u of s.units)if(!resources.has(u.resourceId)||typeof u.heading!=='string'||!u.heading.trim()||typeof u.unitRef!=='string'||!Number.isInteger(u.semester)||u.semester<1||u.semester>6||u.suspended!=null&&typeof u.suspended!=='boolean')throw Error('Invalid learning unit.');
 for(const t of s.tasks)if(!resources.has(t.resourceId)||!units.has(t.unitId)||units.get(t.unitId).resourceId!==t.resourceId||!['P0','P1','P2','P3'].includes(t.priority)||typeof t.reviewed!=='boolean'||!Number.isInteger(t.semester)||t.semester<1||t.semester>6)throw Error('Invalid normalized task reference.');
 const sorted=[...s.semesters].sort((a,b)=>a.start.localeCompare(b.start));for(let i=1;i<sorted.length;i++)if(sorted[i-1].end>=sorted[i].start)throw Error('Semester windows overlap.');
 const semIds=new Set();for(const sem of s.semesters){if(!Number.isInteger(sem.id)||semIds.has(sem.id)||!isCivilDate(sem.start)||!isCivilDate(sem.end)||sem.start>sem.end||typeof sem.title!=='string')throw Error('Invalid semester window.');semIds.add(sem.id);}
 if(s.calendarSlots.length!==7||new Set(s.calendarSlots.map(x=>x.day)).size!==7)throw Error('Specify all seven weekly slots.');
 for(const slot of s.calendarSlots)if(!Number.isInteger(slot.day)||slot.day<0||slot.day>6||!Number.isFinite(slot.minutes)||slot.minutes<0||slot.minutes>([0,3,5].includes(slot.day)?0:slot.day===6?180:90)||!['rest','primary','lecture','academic','support','builder'].includes(slot.role)||typeof slot.fixed!=='boolean'||!Array.isArray(slot.resources)||slot.resources.some(id=>!resources.has(id)))throw Error('Invalid calendar slot.');
 if(s.settings.weeklyMinutes>480||s.settings.dailyMinutes>90||s.settings.saturdayMinutes>180)throw Error('Independent study hard maximum is 480 minutes weekly, 90 weekdays / 180 Saturday.');
 if(!Number.isInteger(s.settings.examPrepLeadDays)||s.settings.examPrepLeadDays<0||s.settings.examPrepLeadDays>90||typeof s.settings.pfeMode!=='boolean'||!Array.isArray(s.settings.recoveryDays)||s.settings.recoveryDays.some(d=>!isCivilDate(d))||!Array.isArray(s.settings.preferredResources)||s.settings.preferredResources.some(id=>!resources.has(id))||!Array.isArray(s.settings.campusTimetable))throw Error('Invalid planning settings.');
 if(s.settings.discretionaryMinutes!=null&&(!Array.isArray(s.settings.discretionaryMinutes)||s.settings.discretionaryMinutes.length!==7||s.settings.discretionaryMinutes.some(n=>!Number.isFinite(n)||n<0||n>1440)))throw Error('Invalid shared discretionary time.');
 if(s.settings.smallResidualMinutes!=null&&(!Number.isFinite(s.settings.smallResidualMinutes)||s.settings.smallResidualMinutes<1||s.settings.smallResidualMinutes>50))throw Error('Invalid residual threshold.');
 if(s.settings.deadlineLeadDays!=null&&(!Number.isInteger(s.settings.deadlineLeadDays)||s.settings.deadlineLeadDays<0||s.settings.deadlineLeadDays>14))throw Error('Invalid deadline lead time.');
 if(s.settings.crossDayRescue!=null&&typeof s.settings.crossDayRescue!=='boolean')throw Error('Invalid rescue preference.');
 for(const c of s.settings.campusTimetable)if(!Number.isInteger(c.day)||c.day<0||c.day>6||!Number.isFinite(c.minutes)||c.minutes<0||c.minutes>1440)throw Error('Invalid campus timetable.');
 if(s.sameDayTrack&&(!isCivilDate(s.sameDayTrack.day)||typeof s.sameDayTrack.resourceId!=='string'))throw Error('Invalid same-day continuity.');
 if(s.pinnedDay&&(!isCivilDate(s.pinnedDay.day)||!s.tasks.some(t=>t.id===s.pinnedDay.taskId)))throw Error('Invalid pinned task.');
 for(const a of s.attachments)if(typeof a.id!=='string'||typeof a.name!=='string'||a.name.length>500||!units.has(a.unitId)||typeof a.data!=='string'||a.data.length>14000000||a.data.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(a.data))throw Error('Invalid private attachment.');
 if(s.attachments.reduce((n,a)=>n+a.data.length,0)>12000000)throw Error('Local documents exceed the 12 MB backup budget.');
}
