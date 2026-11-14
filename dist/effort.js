// Effort is an estimate. Time spent is derived from retained, uncorrected events.
export function activeAttempts(state) {
  const voided=new Set(state.events.filter(e=>e.type==='void').map(e=>e.target));
  return state.events.filter(e=>e.type==='session'&&!voided.has(e.id));
}
export function effortFor(state,task) {
  const attempts=activeAttempts(state).filter(e=>e.taskId===task.id);
  const first=state.events.find(e=>e.type==='session'&&e.taskId===task.id&&e.taskSnapshot?.minutes);
  return {
    initialEstimateMinutes:task.initialEstimateMinutes??first?.taskSnapshot?.initialEstimateMinutes??first?.taskSnapshot?.minutes??task.minutes,
    timeSpentMinutes:attempts.reduce((n,e)=>n+e.minutes,0),
    remainingEstimateMinutes:task.remainingMinutes??task.minutes,
    completed:attempts.some(e=>e.outcome==='completed'),
    remainingEstimateSource:task.remainingEstimateSource||'legacy or user estimate'
  };
}
export function groupAttempts(state) {
  const groups=new Map(),voided=new Set(state.events.filter(e=>e.type==='void').map(e=>e.target));
  for(const e of state.events.filter(e=>e.type==='session')) {
    const key=JSON.stringify([e.day,e.taskId]);
    if(!groups.has(key))groups.set(key,{day:e.day,taskId:e.taskId,attempts:[],minutes:0,completed:false});
    const g=groups.get(key);g.attempts.push({...e,voided:voided.has(e.id)});
    if(!voided.has(e.id)){g.minutes+=e.minutes;g.completed ||= e.outcome==='completed';}
  }
  return [...groups.values()].sort((a,b)=>b.day.localeCompare(a.day)||a.taskId.localeCompare(b.taskId));
}
export function isHardDeadline(task) {
  return task.track==='academic'&&task.assignmentConfirmed===true&&Boolean(task.deadline)&&
    (task.deadlineType==='teacher'||task.deadlineConfirmed===true);
}
