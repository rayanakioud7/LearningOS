import {elapsed,completed} from './engine.js';
import {validateBackup} from './validation.js';
export function prepareTransfer(state,now=Date.now()){
  const next=structuredClone(state);if(next.timer){next.timer.accumulatedMs=elapsed(next.timer,now);next.timer.running=false;next.timer.startedAt=now;}
  next.exportedAt=new Date(now).toISOString();return validateBackup(next);
}
export function prepareRestore(backup,currentRevision,now=Date.now()){
  const next=structuredClone(validateBackup(backup));next.revision=currentRevision;
  if(next.timer){if(completed(next).has(next.timer.taskId)||next.tasks.find(t=>t.id===next.timer.taskId)?.archived)next.timer=null;else{next.timer.accumulatedMs=next.timer.running?Math.min(next.timer.accumulatedMs,next.timer.targetMinutes*60000):elapsed(next.timer,now);next.timer.running=false;next.timer.startedAt=now;}}
  return next;
}
