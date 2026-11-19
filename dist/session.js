import {dailyChoice,elapsed} from './engine.js';
export function toggleFocus(state,day,{id,now=Date.now()}={}){
 const next=structuredClone(state);
 if(next.timer){next.timer.accumulatedMs=elapsed(next.timer,now);next.timer.running=!next.timer.running;next.timer.startedAt=now;return next;}
 const choice=dailyChoice(state,day),task=choice.task;
 if(!task||!Number.isFinite(choice.allocationMinutes)||choice.allocationMinutes<1)throw Error(choice.blocked||'No study time is available for this task.');
 if(!id)throw Error('A unique focus session ID is required.');
 next.timer={id,day,taskId:task.id,taskSnapshot:{...structuredClone(task),resourceSnapshot:structuredClone(state.resources.find(r=>r.id===task.resourceId)),sourceSnapshot:structuredClone(state.units.find(u=>u.id===task.unitId))},startedAt:now,createdAt:new Date(now).toISOString(),accumulatedMs:0,running:true,targetMinutes:Math.min(state.settings.focusMinutes,choice.allocationMinutes)};
 return next;
}
