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
export function minimumBlock(state,t){return Math.min(t.minimumMinutes||25,remaining(state,t));}
export function isExamDay(state,day){return state.settings.examMode==='on'||(state.settings.examMode==='auto'&&state.calendar.some(e=>e.active&&['exam_window','exam_prep'].includes(e.kind)&&day>=e.start_date&&day<=e.end_date_inclusive));}
export function dayRule(state,day) {
  if(state.overrides.some(o=>o.day===day&&o.kind==='rest')) return {minutes:0,reason:'You protected this day for rest.',kind:'rest'};
  if(state.overrides.some(o=>o.day===day&&o.kind==='ensam'))return {minutes:state.settings.dailyMinutes,reason:'ENSAM takes priority today. Your roadmap is safe.',kind:'academic'};
  if(weekday(day)===0)return {minutes:0,reason:'Sunday is yours. No catch-up debt.',kind:'rest'};
  if(state.settings.paused)return {minutes:state.settings.dailyMinutes,reason:'Your independent roadmap is paused. ENSAM work can still take priority.',kind:'academic'};
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
  const chosen=ready.find(t=>{const cap=rule.minutes-dailyActual(state,day,t.track);return minimumBlock(state,t)<=cap&&(t.track==='academic'||(available>=minimumBlock(state,t)&&weekday(day)!==5));});
  let blocked=null;if(ready.length&&!chosen)blocked=available<=0?'Your self-study ceiling is reached. The next step can wait.':'Your next task needs more time than is available today.';else if(!ready.length&&rule.kind==='normal'&&state.tasks.some(t=>t.status==='active'&&!t.archived&&!completed(state).has(t.id)))blocked='Your active tasks are waiting for a start date or prerequisite. Review Curriculum to choose the next step.';
  return {task:chosen??null,rule,blocked};
}
export function forecast(state,start,days=14) {
  const result=[],done=completed(state);let weeklyUsed=0,lastWeek='',minutesLeft=new Map(state.tasks.map(t=>[t.id,remaining(state,t)]));
  for(let i=0;i<days;i++){
    const day=addDays(start,i),mon=addDays(day,-((weekday(day)+6)%7));
    if(mon!==lastWeek){weeklyUsed=weeklyActual(state,day);lastWeek=mon;}
    const rule=dayRule(state,day);const ready=readyTasks(state,day,done);
    const friday=weekday(day)===5;
    const task=ready.find(t=>(!friday||t.track==='academic')&&minimumBlock(state,t)<=rule.minutes&&(t.track==='academic'||weeklyUsed<state.settings.weeklyMinutes));
    if(!task){result.push({day,kind:rule.kind,reason:friday?'Overflow or rest':rule.reason,task:null});continue;}
    const dailyLeft=Math.max(0,rule.minutes-dailyActual(state,day,task.track));
    const cap=task.track==='academic'?dailyLeft:Math.min(dailyLeft,state.settings.weeklyMinutes-weeklyUsed);
    if(cap<minimumBlock(state,task)){result.push({day,kind:'buffer',reason:'Weekly capacity protected',task:null});continue;}
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
  const done=completed(state),tasks=new Map(state.tasks.map(t=>[t.id,t]));
  const required=state.tasks.filter(t=>t.status==='active'&&!t.archived&&t.track==='academic'&&t.deadline&&!done.has(t.id)),result=[];
  for(const task of required){
    const workload=new Set();
    const collect=id=>{const pending=[id];while(pending.length){const next=pending.pop();if(done.has(next)||workload.has(next))continue;const t=tasks.get(next);if(!t)continue;workload.add(next);pending.push(...(t.prerequisites||[]));}};
    required.filter(t=>t.deadline<=task.deadline).forEach(t=>collect(t.id));
    const dueWork=[...workload].reduce((n,id)=>n+remaining(state,tasks.get(id)),0);
    let available=0;const end=task.deadline<addDays(day,365)?task.deadline:addDays(day,365);
    for(let d=day;d<=end;d=addDays(d,1))available+=Math.max(0,dayRule(state,d).minutes-dailyActual(state,d,'academic'));
    const blocked=[...workload].some(id=>{const t=tasks.get(id);return t.archived||t.status!=='active'||t.notBefore>task.deadline;});
    if(task.deadline<day||dueWork>available||blocked)result.push({id:task.id,title:task.heading,shortfall:Math.max(0,dueWork-available),overdue:task.deadline<day,blockedPrerequisite:blocked});
  }return result;
}

export {validateBackup} from './validation.js';
