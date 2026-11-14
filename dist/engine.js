export const SCHEMA=1;
export function civilDate(now=new Date(),zone='Africa/Casablanca') {
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-');
}
export function addDays(day,n) {const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function weekday(day){return new Date(day+'T12:00:00Z').getUTCDay();}
export function completed(state) {
  const invalid=new Set(state.events.filter(e=>e.type==='void').map(e=>e.target));
  return new Set(state.events.filter(e=>!invalid.has(e.id)&&e.outcome==='completed').map(e=>e.taskId));
}
export function remaining(state,t){return t.remainingMinutes??t.minutes;}
export function isExamDay(state,day){return state.settings.examMode==='on'||(state.settings.examMode==='auto'&&state.calendar.some(e=>e.active&&['exam_window','exam_prep'].includes(e.kind)&&day>=e.start_date&&day<=e.end_date_inclusive));}
export function dayRule(state,day) {
  if(state.overrides.some(o=>o.day===day&&o.kind==='rest')) return {minutes:0,reason:'You protected this day for rest.',kind:'rest'};
  if(weekday(day)===0)return {minutes:0,reason:'Sunday is yours. No catch-up debt.',kind:'rest'};
  if(state.settings.paused)return {minutes:state.settings.dailyMinutes,reason:'Your independent roadmap is paused. ENSAM work can still take priority.',kind:'academic'};
  const ens=state.overrides.some(o=>o.day===day&&o.kind==='ensam');
  if(ens)return {minutes:state.settings.dailyMinutes,reason:'ENSAM takes priority today. Your roadmap is safe.',kind:'academic'};
  if(isExamDay(state,day))return {minutes:state.settings.dailyMinutes,reason:'Exam protection is active. Coursework or recovery comes first.',kind:'academic'};
  if(state.calendar.some(e=>e.active&&e.kind==='recovery'&&day>=e.start_date&&day<=e.end_date_inclusive))return {minutes:0,reason:'Recovery break. Your next learning step can wait.',kind:'rest'};
  return {minutes:Math.min(weekday(day)===6?state.settings.saturdayMinutes:state.settings.dailyMinutes,150*(weekday(day)!==6?1:3)),reason:'A little progress, with room to breathe.',kind:'normal'};
}
export function readyTasks(state,day,done=completed(state)) {
  const rule=dayRule(state,day);
  if(!rule.minutes)return [];
  return state.tasks.filter(t=>t.status==='active'&&!done.has(t.id)&&(!t.notBefore||t.notBefore<=day)&&(!t.snoozedUntil||t.snoozedUntil<=day)&&!t.archived&&(rule.kind!=='academic'||t.track==='academic')&&(t.prerequisites||[]).every(id=>done.has(id))).sort((a,b)=>{
    const academic=(t)=>t.track==='academic'?0:1;
    const due=(t)=>t.deadline||'9999-99-99';
    const preferred=t=>!t.preferredDays||t.preferredDays.includes(weekday(day))?0:1;
    return academic(a)-academic(b)||due(a).localeCompare(due(b))||preferred(a)-preferred(b)||(a.order??999)-(b.order??999)||a.id.localeCompare(b.id);
  });
}
export function dailyChoice(state,day) {
  const rule=dayRule(state,day),ready=readyTasks(state,day);
  const available=state.settings.weeklyMinutes-weeklyActual(state,day);
  const chosen=ready.find(t=>{const cap=rule.minutes-dailyActual(state,day,t.track);return (t.minimumMinutes||25)<=cap&&(t.track==='academic'||(available>=(t.minimumMinutes||25)&&weekday(day)!==5));});
  return {task:chosen??null,rule,blocked:ready.length&&!chosen?'Your next task needs a longer block.':null};
}
export function forecast(state,start,days=14) {
  const result=[],done=completed(state);let weeklyUsed=0,lastWeek='',minutesLeft=new Map(state.tasks.map(t=>[t.id,remaining(state,t)]));
  for(let i=0;i<days;i++){
    const day=addDays(start,i),mon=addDays(day,-((weekday(day)+6)%7));
    if(mon!==lastWeek){weeklyUsed=weeklyActual(state,day);lastWeek=mon;}
    const rule=dayRule(state,day);const ready=readyTasks(state,day,done);
    const friday=weekday(day)===5;
    const task=ready.find(t=>(!friday||t.track==='academic')&&(t.minimumMinutes||25)<=rule.minutes&&(t.track==='academic'||weeklyUsed<state.settings.weeklyMinutes));
    if(!task){result.push({day,kind:rule.kind,reason:friday?'Overflow or rest':rule.reason,task:null});continue;}
    const dailyLeft=Math.max(0,rule.minutes-dailyActual(state,day,task.track));
    const cap=task.track==='academic'?dailyLeft:Math.min(dailyLeft,state.settings.weeklyMinutes-weeklyUsed);
    if(cap<(task.minimumMinutes||25)){result.push({day,kind:'buffer',reason:'Weekly capacity protected',task:null});continue;}
    const minutes=Math.min(minutesLeft.get(task.id),cap);
    if(task.track!=='academic')weeklyUsed+=minutes;
    minutesLeft.set(task.id,minutesLeft.get(task.id)-minutes);
    result.push({day,kind:'proposed',task,minutes,reason:task.track==='academic'?'Coursework first':'Proposed; adjusts to your progress'});
    if(minutesLeft.get(task.id)<=0)done.add(task.id); // forecast only; never persists completion
  }return result;
}
export function recordOutcome(state,event) {
  if(!['completed','partial','ensam','skipped'].includes(event.outcome))throw new Error('Choose a session outcome.');
  if(state.events.some(e=>e.id===event.id))return state;
  const task=state.tasks.find(t=>t.id===event.taskId);if(!task)throw new Error('Task no longer exists.');
  const next=structuredClone(state);next.events.push({...event,type:'session',taskSnapshot:{resource:task.resource,section:task.section,heading:task.heading,action:task.action,evidence:task.evidence,track:task.track},minutes:Math.max(0,Number(event.minutes)||0)});
  if(event.outcome==='ensam'&&!next.overrides.some(o=>o.day===event.day&&o.kind==='ensam'))next.overrides.push({id:event.id+'-override',day:event.day,kind:'ensam'});
  if(event.outcome==='skipped')next.tasks.find(t=>t.id===event.taskId).snoozedUntil=addDays(event.day,1);
  if(event.outcome==='partial'&&Number.isFinite(event.remainingMinutes)&&event.remainingMinutes>=1)next.tasks.find(t=>t.id===event.taskId).remainingMinutes=event.remainingMinutes;
  next.timer=null;return next;
}
export function elapsed(timer,now=Date.now()) {if(!timer)return 0;const raw=Math.max(0,(timer.accumulatedMs||0)+(timer.running?Math.max(0,now-timer.startedAt):0));return Math.min(raw,timer.targetMinutes?timer.targetMinutes*60000:Infinity);}
export function weeklyActual(state,day){
  const mon=addDays(day,-((weekday(day)+6)%7)),end=addDays(mon,6),voided=new Set(state.events.filter(e=>e.type==='void').map(e=>e.target));
  return state.events.filter(e=>e.type==='session'&&!voided.has(e.id)&&e.day>=mon&&e.day<=end&&['partial','completed'].includes(e.outcome)&&(e.taskSnapshot?.track||state.tasks.find(t=>t.id===e.taskId)?.track)==='independent').reduce((n,e)=>n+e.minutes,0);
}
export function dailyActual(state,day,track){const voided=new Set(state.events.filter(e=>e.type==='void').map(e=>e.target));return state.events.filter(e=>e.type==='session'&&!voided.has(e.id)&&e.day===day&&['completed','partial'].includes(e.outcome)&&(e.taskSnapshot?.track||state.tasks.find(t=>t.id===e.taskId)?.track)===track).reduce((n,e)=>n+e.minutes,0);}
export function deadlineRisks(state,day){
  const done=completed(state),required=state.tasks.filter(t=>t.status==='active'&&!t.archived&&t.track==='academic'&&t.deadline&&!done.has(t.id)),result=[];
  for(const t of required){let available=0;const end=t.deadline<addDays(day,365)?t.deadline:addDays(day,365);for(let d=day;d<=end;d=addDays(d,1))available+=dayRule(state,d).minutes;const dueWork=required.filter(x=>x.deadline<=t.deadline).reduce((n,x)=>n+remaining(state,x),0);if(t.deadline<day||dueWork>available)result.push({id:t.id,title:t.heading,shortfall:Math.max(0,dueWork-available),overdue:t.deadline<day});}
  return result;
}
export function validateBackup(x) {
  if(!x||x.schema!==SCHEMA||!Array.isArray(x.tasks)||!Array.isArray(x.events)||!Array.isArray(x.calendar)||!Array.isArray(x.overrides)||!x.settings||!Array.isArray(x.revisions))throw new Error('This is not a Learning OS backup.');
  if(x.tasks.length>5000||x.events.length>100000)throw new Error('Backup is too large.');
  const ids=new Set();
  for(const t of x.tasks){if(typeof t.id!=='string'||ids.has(t.id)||typeof t.title!=='string'||!t.title.trim()||!Number.isFinite(t.minutes)||t.minutes<1||t.minutes>10000||!['draft','active'].includes(t.status)||!['academic','independent'].includes(t.track)||!Array.isArray(t.prerequisites))throw new Error('Invalid task in backup.');ids.add(t.id);}
  const dates=/^\d{4}-\d{2}-\d{2}$/;
  for(const t of x.tasks){if(t.prerequisites.some(id=>!ids.has(id))||(t.notBefore&&!dates.test(t.notBefore))||(t.deadline&&!dates.test(t.deadline)))throw new Error('Invalid task dependency or date.');}
  const visit=(id,trail=new Set())=>{if(trail.has(id))throw new Error('Prerequisite cycle found.');const t=x.tasks.find(t=>t.id===id);for(const p of t.prerequisites)visit(p,new Set([...trail,id]));};for(const id of ids)visit(id);
  const eventIds=new Set();for(const e of x.events){if(typeof e.id!=='string'||eventIds.has(e.id)||!['session','void'].includes(e.type))throw new Error('Invalid session history.');eventIds.add(e.id);if(e.type==='session'&&(!ids.has(e.taskId)||!['completed','partial','ensam','skipped'].includes(e.outcome)||!Number.isFinite(e.minutes)||e.minutes<0||!dates.test(e.day)))throw new Error('Invalid study session.');}
  if(!Number.isFinite(x.settings.weeklyMinutes)||x.settings.weeklyMinutes<0||x.settings.weeklyMinutes>1800||!Number.isFinite(x.settings.focusMinutes)||x.settings.focusMinutes<1||x.settings.focusMinutes>120||!Number.isFinite(x.settings.breakMinutes)||x.settings.breakMinutes<1||x.settings.breakMinutes>30||!['auto','on','off'].includes(x.settings.examMode))throw new Error('Invalid settings.');
  for(const k of ['dailyMinutes','saturdayMinutes'])if(!Number.isFinite(x.settings[k])||x.settings[k]<25||x.settings[k]>480)throw new Error('Invalid capacity.');
  try{civilDate(new Date(),x.settings.timezone);}catch{throw new Error('Invalid timezone.');}
  for(const c of x.calendar)if(!dates.test(c.start_date)||!dates.test(c.end_date_inclusive)||c.start_date>c.end_date_inclusive)throw new Error('Invalid academic calendar.');
  return x;
}
