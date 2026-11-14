import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {migrateState,addLocalTask,reviseTask} from '../dist/curriculum.js';
import {dailyChoice,recordOutcome,completed,deadlineRisks,forecast} from '../dist/engine.js';
import {project,pinToday,ruleV2,phaseFor,blockPlan,weeklyCeiling} from '../dist/planner.js';
const read=n=>JSON.parse(readFileSync(new URL('../dist/'+n,import.meta.url)));
const catalog=read('catalog.json'),planning=read('planning.json');
const seed=()=>migrateState(read('seed.json'),catalog,planning,'2026-11-14T00:00:00Z');
function academic(s,extra={}) {return addLocalTask(s,{...s.tasks[0],id:'networks',resource:'Synthetic networks',heading:'Synthetic networks exercise',title:'Synthetic networks exercise',track:'academic',priority:'P0',minutes:120,notBefore:'',deadline:'2026-11-15',prerequisites:[],...extra});}
const attempt=(id,extra={})=>({id,taskId:'networks',day:'2026-11-16',minutes:25,outcome:'partial',...extra});
test('120 initial / 75 spent / explicit 200 remaining survives metadata editing and backup roundtrip',()=>{
 let s=academic(seed());for(let i=0;i<3;i++)s=recordOutcome(s,attempt('part-'+i,{remainingMinutes:i===2?200:undefined}));
 const events=structuredClone(s.events);s=reviseTask(s,'networks',{heading:'Edited heading',remainingMinutes:undefined});
 assert.equal(s.tasks.at(-1).remainingMinutes,200);assert.equal(s.tasks.at(-1).initialEstimateMinutes,120);
 assert.equal(s.events.reduce((n,e)=>n+e.minutes,0),75);assert.deepEqual(s.events,events);assert.equal(completed(s).size,0);
 assert.deepEqual(JSON.parse(JSON.stringify(s)).events,JSON.parse(JSON.stringify(events)));
});
test('a legacy P0 date is soft: keeps Monday and Tuesday home subjects and does not create deadline risk',()=>{
 const s=academic(seed());assert.equal(dailyChoice(s,'2026-11-16').task.resourceId,'ila');assert.equal(dailyChoice(s,'2026-11-17').task.resourceId,'mit1802');assert.deepEqual(deadlineRisks(s,'2026-11-16'),[]);
});
test('only explicit confirmed teacher deadline preempts pinned independent task',()=>{
 const s=academic(pinToday(seed(),'2026-11-16'),{assignmentConfirmed:true,deadlineType:'teacher'});
 assert.equal(dailyChoice(s,'2026-11-16').task.id,'networks');assert.match(dailyChoice(s,'2026-11-16').reason,/hard academic/);
 assert.ok(deadlineRisks(s,'2026-11-16').some(r=>r.overdue));
 s.tasks.at(-1).assignmentConfirmed=false;assert.equal(dailyChoice(s,'2026-11-16').task.id,'ila-311');
});
test('academic focused minutes consume the same evening capacity as independent study',()=>{
 let s=academic(seed());s=recordOutcome(s,attempt('academics',{minutes:70,remainingMinutes:200}));
 assert.equal(forecast(s,'2026-11-16',1)[0].task,null);
});
test('pin never bypasses a new start date, snooze, resource suspension or protected day',()=>{
 for(const patch of [{notBefore:'2026-11-23'},{snoozedUntil:'2026-11-23'},{archived:true}]){
  const s=pinToday(seed(),'2026-11-16');Object.assign(s.tasks[0],patch);assert.notEqual(dailyChoice(s,'2026-11-16').task?.id,'ila-311');
 }
});
test('hard deadline risk includes inactive prerequisites and remaining shared time',()=>{
 let s=academic(seed(),{deadline:'2026-11-16',assignmentConfirmed:true,deadlineType:'teacher',prerequisites:['ila-311'],minutes:80});s.tasks[0].reviewed=false;
 const risks=deadlineRisks(s,'2026-11-16');assert.ok(risks[0].blockedPrerequisite);assert.ok(risks[0].shortfall>0);
});
test('invalid projection dates fail calmly rather than silently returning empty rows',()=>{
 assert.throws(()=>project(seed(),'2026-02-30','2029-06-30',catalog),/date/i);
});
test('forecast keeps Sunday and recovery empty and never writes simulated completion',()=>{
 const s=academic(seed(),{assignmentConfirmed:true,deadlineType:'teacher'});const original=structuredClone(s);
 const rows=project(s,'2026-11-14','2029-06-30',catalog);assert.equal(rows.length,960);
 for(const r of rows.filter(r=>new Date(r.day+'T12:00Z').getUTCDay()===0))assert.equal(r.minutes,0);
 assert.deepEqual(s,original);assert.equal(completed(s).size,0);
});
test('S2 Monday continues ILA after completion without adding a Data Science block',()=>{
 let s=seed(),dataName=catalog.resources.find(r=>r.id==='vanderplas-2e').name;
 s=addLocalTask(s,{...s.tasks[0],id:'ds-local',resource:dataName,section:'Ch 13',heading:'Pandas objects',title:dataName+' Ch 13 · Pandas objects',action:'Reproduce one pandas example.',evidence:'A checked notebook cell and a short explanation.',minutes:60,minimumMinutes:25,track:'independent',priority:'P2',semester:2,status:'active',prerequisites:[],order:0,preferredDays:[1],notBefore:'',deadline:''});
 const day='2027-03-01',first=dailyChoice(s,day).task;
 assert.equal(first.resourceId,'ila');
 s=recordOutcome(s,{id:'ila-finish',taskId:first.id,day,minutes:30,outcome:'completed'});
 const after=dailyChoice(s,day);
 assert.notEqual(after.task.id,'ds-local');
 assert.equal(after.task.resourceId,'ila');
 assert.equal(s.sameDayTrack.day,day);assert.equal(s.sameDayTrack.resourceId,'ila');
});
test('partials return to their home track and never add another resource to the strict weekday plan',()=>{
 let s=seed();s=recordOutcome(s,{id:'carry',taskId:'ila-311',day:'2026-11-16',minutes:25,outcome:'partial',remainingMinutes:45});
 assert.equal(dailyChoice(s,'2026-11-17').task.resourceId,'mit1802');assert.equal(dailyChoice(s,'2026-11-23').task.id,'ila-311');
 s.tasks.filter(t=>t.resourceId==='mit1802').forEach(t=>t.archived=true);s.tasks[0].remainingMinutes=10;
 assert.equal(dailyChoice(s,'2026-11-17').task,null);s.settings.crossDayRescue=true;
 assert.equal(dailyChoice(s,'2026-11-17').task,null);assert.equal(forecast(s,'2026-11-17',1)[0].minutes,0);
 s.tasks[0].remainingMinutes=20;assert.equal(dailyChoice(s,'2026-11-17').task,null,'15 min slack cannot fit 20');
});
test('exact holidays and program bounds win over urgency and an ENSAM override',()=>{
 const s=academic(seed(),{assignmentConfirmed:true,deadlineType:'teacher'});s.calendar.push({id:'holiday',title:'No work',kind:'no_work',active:true,start_date:'2026-11-16',end_date_inclusive:'2026-11-16'});s.overrides.push({day:'2026-11-16',kind:'ensam'});
 assert.equal(dailyChoice(s,'2026-11-16').task,null);assert.equal(dailyChoice(s,'2029-07-01').task,null);
});
test('unknown academic placeholders are never fabricated as long-range assignments',()=>{
 const rows=project(seed(),'2026-11-14','2029-06-30',catalog);assert.ok(!rows.some(p=>p.unit?.resourceId==='ensam'));assert.ok(rows.filter(p=>p.semester===6).every(p=>['rest','academic'].includes(p.kind)));
});
test('shared budget and weekly ceiling hold under randomized academic interruptions',()=>{
 let rng=79;const random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<80;i++){
  let s=academic(seed());const spent=Math.floor(random()*90);s.settings.discretionaryMinutes=[90,90,90,90,90,90,180];s.settings.weeklyMinutes=Math.floor(random()*481);
  s=recordOutcome(s,attempt('work',{minutes:spent,remainingMinutes:200}));const row=forecast(s,'2026-11-16',1)[0];assert.ok(row.minutes+spent<=90);if(row.task?.track==='independent')assert.ok(row.minutes<=s.settings.weeklyMinutes);
 }
});
test('confirmed urgency follows dependencies without granting their completion',()=>{
 let s=academic(pinToday(seed(),'2026-11-17'),{deadline:'2026-11-17',assignmentConfirmed:true,deadlineType:'teacher',prerequisites:['ila-311'],minutes:20});
 assert.equal(dailyChoice(s,'2026-11-17').task.id,'ila-311');assert.match(dailyChoice(s,'2026-11-17').reason,/Prerequisite/);assert.equal(completed(s).size,0);
 s.tasks[0].notBefore='2026-11-18';assert.ok(deadlineRisks(s,'2026-11-17')[0].shortfall>=55);
});
test('deadline feasibility does not spend days before a task can start',()=>{
 const s=academic(seed(),{deadline:'2026-11-18',notBefore:'2026-11-18',assignmentConfirmed:true,deadlineType:'teacher',minutes:120});
 assert.equal(deadlineRisks(s,'2026-11-16')[0].shortfall,30);
});
test('idempotent retries do not append duplicate attempts; conflicting IDs are rejected',()=>{
 const s=academic(seed()),event=attempt('retry'),next=recordOutcome(s,event);assert.equal(recordOutcome(next,event),next);assert.throws(()=>recordOutcome(next,{...event,minutes:90}),/Conflicting immutable/);assert.equal(next.events.length,1);
});
test('an explicit early-start pin can relax the weekday role but not dependencies or activation',()=>{
 const s=seed();s.tasks[0].notBefore='2026-11-14';s.pinnedDay={day:'2026-11-14',taskId:'ila-311',userOverride:true};
 assert.equal(dailyChoice(s,'2026-11-14').task.id,'ila-311');s.tasks[0].reviewed=false;assert.notEqual(dailyChoice(s,'2026-11-14').task?.id,'ila-311');
});
test('editing a pinned task into a future semester invalidates its selection',()=>{
 const s=pinToday(seed(),'2026-11-16');s.tasks[0].semester=4;assert.notEqual(dailyChoice(s,'2026-11-16').task?.id,'ila-311');
});
test('weekly allocation shows past facts and agrees with Today on a current-day pin',async()=>{
 const {allocateWeek,selectNext}=await import('../dist/planner.js');let s=seed();s.tasks[0].notBefore='';s.pinnedDay={day:'2026-11-17',taskId:'ila-311',userOverride:true};
 const rows=allocateWeek(s,'2026-11-17');assert.equal(rows[0].band,'actual');assert.equal(rows[0].minutes,0);assert.equal(rows[1].task.id,selectNext(s,'2026-11-17').task.id);
});
test('S2 Thursday schedules only the VanderPlas block',()=>{
 let s=seed();
 s=addLocalTask(s,{...s.tasks[0],id:'stat-thu',title:'Conditional probability',resource:'Harvard Stat 110 — Probability',section:'Lecture 4',heading:'Conditional probability',action:'Work one worked example.',evidence:'Handwritten derivation and the solved example.',minutes:60,minimumMinutes:25,track:'independent',priority:'P1',semester:2,status:'active',reviewed:true,prerequisites:[],order:0,notBefore:'',deadline:''});
 s=addLocalTask(s,{...s.tasks[0],id:'ds-thu',title:'Pandas objects',resource:'VanderPlas — Python Data Science Handbook (2nd edition)',section:'Ch 4',heading:'Pandas objects',action:'Reproduce one pandas example.',evidence:'A checked notebook cell.',minutes:60,minimumMinutes:25,track:'independent',priority:'P1',semester:2,status:'active',reviewed:true,prerequisites:[],order:0,notBefore:'',deadline:''});
 const rows=project(s,'2027-03-04','2027-03-04');
 assert.equal(rows.length,1);
 const row=rows[0];
 assert.equal(row.day,'2027-03-04');
 assert.equal(row.blocks.length,1);
 assert.equal(row.blocks[0].kind,'primary');assert.equal(row.blocks[0].task.resourceId,'vanderplas-2e');assert.equal(row.blocks[0].minutes,60);
 assert.equal(row.task.resourceId,'vanderplas-2e');assert.equal(row.minutes,60);
});
test('Friday has no prescribed independent block in S2',()=>{
 const rows=project(seed(),'2027-02-05','2027-02-05');
 assert.equal(rows[0].task,null);assert.equal(rows[0].minutes,0);
});
test('the weekly independent ceiling is the lower of the roadmap phase budget and the user setting',()=>{
 let s=seed();s.settings.weeklyMinutes=300;
 s=addLocalTask(s,{...s.tasks[0],id:'ceil-1',resource:'Interactive Linear Algebra',heading:'Week ceiling task',semester:1,status:'active',reviewed:true,minutes:1000,minimumMinutes:25,prerequisites:[],order:0,notBefore:'',deadline:'',track:'independent'});
 const rows=project(s,'2026-11-16','2026-11-22');
 let total=0;for(const r of rows)if(r.track==='independent')total+=r.minutes;
 assert.ok(total<=s.settings.weeklyMinutes);
});
test('phaseFor and blockPlan map dates to roadmap phases and templates',()=>{
 const s=seed();
 assert.equal(phaseFor(s,'2026-11-16').id,'S1');
 assert.equal(phaseFor(s,'2027-01-20').id,'Winter');
 assert.equal(phaseFor(s,'2027-07-20').id,'Summer1');
 assert.equal(phaseFor(s,'2028-10-03').id,'S5');
 assert.equal(phaseFor(s,'2029-03-01').id,'S6');
 assert.equal(phaseFor(s,'2026-01-05'),null);
 assert.equal(phaseFor(s,'2029-07-01'),null);
 const thu=blockPlan(s,'2027-03-04');
 assert.equal(thu.length,1);assert.deepEqual(thu[0].resources,['vanderplas-2e','vanderplas']);assert.equal(thu[0].minutes,60);
 assert.equal(blockPlan(s,'2027-03-05')[0].track,'academic');
 assert.equal(weeklyCeiling(s,'2027-07-20'),0);s.settings.roadmapChoices={summer1Enabled:true};assert.equal(weeklyCeiling(s,'2027-07-20'),780);
 s.settings.weeklyMinutes=300;assert.equal(weeklyCeiling(s,'2027-07-20'),300);
});
test('January stays academic; S2 uses its targets and optional summer uses its own timeboxes',()=>{
 const s=seed();assert.equal(ruleV2(s,'2027-01-12').independentMinutes,0);assert.equal(ruleV2(s,'2027-01-16').independentMinutes,0);assert.equal(ruleV2(s,'2027-03-02').independentMinutes,90);
 s.settings.roadmapChoices={summer1Enabled:true};assert.equal(ruleV2(s,'2027-07-13').independentMinutes,120);assert.equal(ruleV2(s,'2027-07-17').independentMinutes,240);
});
