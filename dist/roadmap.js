// Civil dates, phase templates and explicit learner choices. No forecast writes.
export function weekdayOf(day){return new Date(day+'T12:00:00Z').getUTCDay();}
export function isoWeek(day){
 const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+3-((d.getUTCDay()+6)%7));
 const first=new Date(Date.UTC(d.getUTCFullYear(),0,4,12));
 return 1+Math.round(((d-first)/86400000-3+((first.getUTCDay()+6)%7))/7);
}
export const hasLearnerRoadmap=s=>s.planning?.roadmap?.version>=4;
export function phaseFor(s,day){return s.planning?.phases?.find(p=>p.start<=day&&day<=p.end)||null;}
export const choicesFor=s=>s.settings?.roadmapChoices||{};
export const gateMet=(s,id)=>choicesFor(s).gates?.[id]===true;
export function weeklyCeiling(s,day){
 const p=phaseFor(s,day),cap=p?.weeklyIndependentMinutes??Infinity;
 if(hasLearnerRoadmap(s)&&p?.mode==='summer')return p.optional&&!choicesFor(s).summer1Enabled?0:Math.min(cap,s.settings.summerWeeklyMinutes??(s.settings.weeklyMinutes<480?s.settings.weeklyMinutes:780));
 return Math.min(cap,s.settings?.weeklyMinutes??480);
}
export function dailyIndependentCap(s,day){return blockPlan(s,day)?.filter(b=>b.track!=='academic').reduce((n,b)=>n+b.minutes,0)??(weekdayOf(day)===6?s.settings.saturdayMinutes:s.settings.dailyMinutes);}
export function supportIssue(s,day,support){
 const missing=(support.requires||[]).filter(id=>!gateMet(s,id));if(missing.length)return 'Confirm prerequisite gate: '+missing.join(', ')+'.';
 if(support.requiresSystemsBranch&&(!choicesFor(s).capstoneBranch||!choicesFor(s).systemsSupportNeeded))return 'Choose one capstone branch and confirm that it needs systems support.';
 if(support.maxPerMonth){
  const days=new Set(Object.entries(choicesFor(s).daySupports||{}).filter(([d,id])=>d.slice(0,7)===day.slice(0,7)&&id===support.id).map(([d])=>d));
  const voided=new Set(s.events.filter(e=>e.type==='void').map(e=>e.target));
  for(const e of s.events)if(e.type==='session'&&!voided.has(e.id)&&e.outcome!=='ensam'&&e.minutes>0&&e.day.slice(0,7)===day.slice(0,7)&&e.taskSnapshot?.roadmapSupportId===support.id)days.add(e.day);
  days.delete(day);if(days.size>=support.maxPerMonth)return 'This month already has its optional GPU Thursday. Return to Prince synthesis.';
 }
 return '';
}
export function roadmapDay(s,day){
 const phase=phaseFor(s,day);if(!hasLearnerRoadmap(s)||!phase)return null;
 const options=choicesFor(s),parity=isoWeek(day)%2?'odd':'even';
 const base=(s.planning.weeklyBlocks?.[phase.id]?.[weekdayOf(day)]||[]).filter(b=>!b.weekParity||b.weekParity===parity);
 let blocks=base.map(b=>({...b,resources:[...b.resources],kind:b.track==='academic'?'academic':'primary',available:true}));
 if(phase.optional&&!options.summer1Enabled)for(const b of blocks)if(b.track!=='rest'){b.available=false;b.unavailableReason='Optional Summer 1 is not enabled; shown as a scenario only.';}
 for(const b of blocks){
  if(b.trialReviewDate&&day>=b.trialReviewDate&&!options.mitTrialContinues){b.available=false;b.unavailableReason='Two-week MIT trial ended. Compare against Stewart Chapter 15 before choosing to continue.';}
  if(b.requiresTopic&&(!options.geronTopic?.trim()||!options.mathClinicUnitId)){b.available=false;b.unavailableReason='Choose the current question raised by Géron and one matching CS229/MML reference; no parallel lecture course is scheduled.';}
  if(b.requiresBranch&&!options.capstoneBranch){b.available=false;b.unavailableReason='Choose ONE capstone branch A, B or C before scheduling capstone work.';}
  if(b.practiceAlternation)b.description+=' This '+parity+' ISO week: '+(parity==='odd'?'probability simulation.':'arrays, broadcasting and plots.');
 }
 // A fallback requires both the explicit no-work declaration and no ready ENSAM work (checked by planner).
 if(phase.id==='S1'&&weekdayOf(day)===3&&options.noEnsamDays?.includes(day))blocks=[{id:'dsa-fallback',title:'Goodrich / NeetCode · only because no ENSAM work is available',resources:['dsa'],minutes:60,minMinutes:60,maxMinutes:90,track:'independent',kind:'primary',description:'Bounded fallback practice; any current ENSAM work or exam protection wins.',doneWhen:'One tested function.',available:true,fallback:true}];
 const selected=options.daySupports?.[day];
 if(selected){
  const host=blocks.find(b=>b.supports?.some(x=>x.id===selected));
  const support=host?.supports.find(x=>x.id===selected);
  if(support){const issue=supportIssue(s,day,support);if(issue)host.supportNotice=issue;else if(host.available){host.resources=[...support.resources];host.scope=support.scope||support.id;host.title=support.title;host.description=support.description||host.description;host.supportId=support.id;host.links=[{title:support.title,url:support.url}];}}
 }
 return {phase,blocks,parity,week:isoWeek(day),notes:s.planning.roadmap.phaseNotes?.[phase.id]||[]};
}
export function blockPlan(s,day){
 if(hasLearnerRoadmap(s))return roadmapDay(s,day)?.blocks||[];
 const p=phaseFor(s,day),blocks=s.planning?.weeklyBlocks?.[p?.id]?.[weekdayOf(day)];
 return blocks?.map((b,i)=>({...b,resources:[...b.resources],minutes:b.minutes??0,kind:i===0?'primary':'secondary'}))||null;
}
function chapter(t){const m=String(t.section||'').match(/(?:chapter|ch\.?|lecture|session)\s*([0-9]+)/i)||t.unitId?.match(/(?:ch-|lecture-)(\d+)/);return m?Number(m[1]):null;}
export function taskFitsBlock(s,t,b,day){
 if(!b?.available)return false;
 if(t.track==='academic')return b.track==='academic';
 if(!b.resources.includes(t.resourceId)&&!(b.fallback&&/neet.?code/i.test(t.resource||'')))return false;
 const n=chapter(t),id=t.unitId||t.id,scope=b.scope,phase=phaseFor(s,day);
 if(t.track==='academic')return b.track==='academic';
 if(b.track!=='independent')return false;
 if(/pca/i.test(t.heading+' '+t.action)&&!gateMet(s,'svd'))return false;
 if(phase?.id==='S5'&&/kernel implementation|implement.*kernel|cuda kernel/i.test(t.heading+' '+t.action)&&(!gateMet(s,'cpu-correctness')||!gateMet(s,'measured-bottleneck')))return false;
 if(scope==='svd'&&!gateMet(s,'linear-foundations'))return false;
 if(scope==='mit-double-integrals')return !/session/i.test(t.section)||!n||n>=47&&n<=55;
 if(scope==='s1-builder')return t.semester===1&&!/sql|query/i.test(t.heading+' '+t.action);
 if(scope==='numerical-builder')return t.semester===2&&!/summer|polish|numerical-and-classical-ml-m[45]/i.test(id);
 if(scope==='summer1-builder')return id==='builder:summer1-polish';
 if(scope==='ml-builder')return t.semester===3;
 if(scope==='minitorch-builder')return t.semester===4&&!/summer2-release/.test(id);
 if(scope==='summer2-release')return id==='builder:summer2-release';
 if(scope==='capstone-builder')return t.semester===5;
 if(scope==='mml-part1')return n!=null&&n<=7;
 if(scope==='math-clinic')return (t.unitId===choicesFor(s).mathClinicUnitId||t.id===choicesFor(s).mathClinicUnitId)&&(t.resourceId==='mml'?n>=8:t.resourceId==='cs229'&&(n>=1&&n<=9||n>=12&&n<=15||n===16&&/first half/i.test(t.section+' '+t.heading+' '+t.action)));
 if(scope==='geron-s3')return n!=null&&n>=1&&n<=11;
 if(scope==='geron-part1')return n!=null&&n>=1&&n<=8;
 if(scope==='wasserman-6-10')return n!=null&&n>=6&&n<=10;
 if(scope==='udl-foundations')return n!=null&&n<=11;
 if(scope==='udl-transformers')return n!=null&&n>=12&&(n===12||choicesFor(s).capstoneTheoryNeeded===true);
 if(scope==='raschka-2-5')return n!=null&&n>=2&&n<=5;
 if(scope==='micrograd')return gateMet(s,'ml-evaluation')&&/micrograd|lecture.1/i.test(t.heading+' '+t.section+' '+id);
 if(scope==='gpt-onramp')return /gpt|tokeniz/i.test(t.heading+' '+t.action);
 if(scope==='git')return /git|version.control/i.test(t.heading+' '+t.action);
 return true;
}
// Upgrade only planning metadata. Stored task IDs, estimates, attempts and
// academic dates stay authoritative; the normal save revision guards still apply.
export function applyPlanningUpdate(state,planning,at=new Date().toISOString()){
 if(state.schema!==2||state.planning?.policyVersion===planning.policyVersion)return state;
 const next=structuredClone(state),old=next.planning;next.planning=structuredClone(planning);
 next.revisions.push({id:'planning:'+planning.policyVersion+':'+next.revisions.length,author:'You',at,old:{planning:old},new:{policyVersion:planning.policyVersion},reason:'Apply the learner’s 14 November 2026 roadmap; preserve tasks, history, availability and academic dates.'});
 // Ordinary pins follow the newly requested weekday role; explicit early-start pins and in-flight timers stay intact.
 if(!next.timer&&!next.pinnedDay?.userOverride){next.pinnedDay=null;next.sameDayTrack=null;}
 return next;
}
export function updateRoadmapChoices(s,patch,at=new Date().toISOString()){
 const next=structuredClone(s),old=choicesFor(next);next.settings.roadmapChoices={...old,...structuredClone(patch)};
 next.revisions.push({id:'roadmap-choice:'+next.revisions.length,author:'You',at,old:structuredClone(old),new:structuredClone(next.settings.roadmapChoices),reason:'Explicit roadmap gate, scope or optional-session choice. No study completion inferred.'});
 if(!next.timer&&!next.pinnedDay?.userOverride){next.pinnedDay=null;next.sameDayTrack=null;}
 return next;
}
export function phaseLabel(p){return p?`${p.id} · ${p.title||p.mode}`:'—';}
