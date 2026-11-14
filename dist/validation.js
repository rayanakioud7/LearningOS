export function isCivilDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const parsed=new Date(value+'T12:00:00Z');return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
}
export function validateBackup(x){
  if(!x||x.schema!==1||!Array.isArray(x.tasks)||!Array.isArray(x.events)||!Array.isArray(x.calendar)||!Array.isArray(x.overrides)||!x.settings||!Array.isArray(x.revisions))throw Error('This is not a Learning OS backup.');
  if(x.tasks.length>5000||x.events.length>100000||x.calendar.length>1000||x.overrides.length>10000)throw Error('Backup is too large.');
  const text=(v,required=false)=>typeof v==='string'&&v.length<=10000&&(!required||v.trim().length>0);
  const optionalDate=v=>!v||isCivilDate(v);
  const tasks=new Map();
  for(const t of x.tasks){
    if(!t||!text(t.id,true)||tasks.has(t.id)||!text(t.title,true)||!text(t.resource,true)||!text(t.heading,true)||!text(t.action,true)||!text(t.evidence,true)||!text(t.section??'')||!Number.isFinite(t.minutes)||t.minutes<1||t.minutes>10000||!['draft','active'].includes(t.status)||!['academic','independent'].includes(t.track)||!Array.isArray(t.prerequisites))throw Error('Invalid task in backup.');
    if(!optionalDate(t.notBefore)||!optionalDate(t.deadline)||!optionalDate(t.snoozedUntil)||t.remainingMinutes!=null&&(!Number.isFinite(t.remainingMinutes)||t.remainingMinutes<1||t.remainingMinutes>10000)||t.minimumMinutes!=null&&(!Number.isFinite(t.minimumMinutes)||t.minimumMinutes<1)||t.preferredDays!=null&&(!Array.isArray(t.preferredDays)||t.preferredDays.some(d=>!Number.isInteger(d)||d<0||d>6)))throw Error('Invalid task estimate or date.');
    if(['url','provenance'].some(k=>t[k]!=null&&!text(t[k]))||t.order!=null&&!Number.isFinite(t.order)||t.archived!=null&&typeof t.archived!=='boolean')throw Error('Invalid task metadata.');
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
  return x;
}
