import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IDBFactory} from 'fake-indexeddb';
import {openDatabase,readSaved,saveChange} from '../dist/storage.js';
import {prepareTransfer,prepareRestore} from '../dist/backup.js';
import {validateBackup,isCivilDate} from '../dist/validation.js';
import {dailyChoice,dayRule,deadlineRisks,recordOutcome,forecast,taskIsInFocus} from '../dist/engine.js';
const seed=()=>JSON.parse(readFileSync(new URL('../dist/seed.json',import.meta.url)));
async function database(run){const factory=new IDBFactory(),db=await openDatabase(factory);try{await run(db,factory);}finally{db.close();}}
async function initialize(db){return saveChange(db,0,s=>s,seed());}
test('a successful database save is durable before it is acknowledged',()=>database(async db=>{
  const original=seed(),saved=await saveChange(db,0,s=>{s.settings.dailyMinutes=50;return s;},original);
  assert.equal((await readSaved(db)).settings.dailyMinutes,50);assert.equal(saved.revision,1);assert.equal(original.settings.dailyMinutes,90);
}));
test('two concurrent tab writes cannot silently overwrite each other',()=>database(async(db,factory)=>{
  const s=await initialize(db),other=await openDatabase(factory);
  try{const results=await Promise.allSettled([saveChange(db,s.revision,x=>{x.settings.dailyMinutes=50;return x;}),saveChange(other,s.revision,x=>{x.settings.dailyMinutes=75;return x;})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);assert.equal((await readSaved(db)).revision,2);}finally{other.close();}
}));
test('invalid state aborts both the save and recovery snapshot transaction',()=>database(async db=>{
  const s=await initialize(db);await assert.rejects(saveChange(db,s.revision,x=>{x.tasks[0].title='';return x;},null,{preservePrevious:true}),/Invalid task/);
  assert.deepEqual(await readSaved(db),s);assert.equal(await readSaved(db,'restore-point'),undefined);
}));
test('a backup restore preserves the replaced plan and recovery swaps both safely',()=>database(async db=>{
  const original=await initialize(db),incoming=seed();incoming.settings.weeklyMinutes=600;
  const restored=await saveChange(db,original.revision,s=>prepareRestore(incoming,s.revision),null,{preservePrevious:true});
  assert.equal(restored.settings.weeklyMinutes,600);assert.deepEqual((await readSaved(db,'restore-point')).state,original);
  const previous=(await readSaved(db,'restore-point')).state;
  const recovered=await saveChange(db,restored.revision,s=>prepareRestore(previous,s.revision),null,{preservePrevious:true});
  assert.equal(recovered.settings.weeklyMinutes,480);assert.equal((await readSaved(db,'restore-point')).state.settings.weeklyMinutes,600);
}));
test('a reopened connection sees saved sessions and a paused timer',()=>database(async(db,factory)=>{
  let s=await initialize(db);s=await saveChange(db,s.revision,x=>{x.timer={id:'focus',taskId:'ila-311',startedAt:1000,accumulatedMs:12000,targetMinutes:25,running:false};return x;});
  const reopened=await openDatabase(factory);try{const loaded=await readSaved(reopened);assert.deepEqual(loaded.timer,s.timer);assert.equal(loaded.events.length,0);}finally{reopened.close();}
}));
test('transfer freezes active focus time without changing the source or granting mastery',()=>{
  const s=seed();s.timer={id:'transfer-session',taskId:'ila-311',startedAt:1000,accumulatedMs:0,targetMinutes:25,running:true};
  const file=prepareTransfer(s,61000),restored=prepareRestore(file,15,900000);
  assert.equal(file.timer.accumulatedMs,60000);assert.equal(file.timer.running,false);assert.equal(restored.timer.accumulatedMs,60000);assert.equal(restored.timer.running,false);assert.equal(restored.revision,15);assert.equal(s.timer.running,true);assert.equal(restored.events.length,0);
});
test('legacy running-timer imports do not count transport time as study',()=>{
  const s=seed();s.timer={id:'legacy',taskId:'ila-311',startedAt:1000,accumulatedMs:5000,targetMinutes:25,running:true};assert.equal(prepareRestore(s,0,9999999).timer.accumulatedMs,5000);
});
test('a restored timer cannot revive a task already completed in the same backup',()=>{
  let s=recordOutcome(seed(),{id:'done',taskId:'ila-311',day:'2026-11-16',minutes:25,outcome:'completed'});s.timer={id:'old',taskId:'ila-311',startedAt:1000,accumulatedMs:5000,targetMinutes:25,running:false};assert.equal(prepareRestore(s,0).timer,null);
});
test('calendar validation rejects impossible dates and accepts a leap day',()=>{
  assert.equal(isCivilDate('2027-02-29'),false);assert.equal(isCivilDate('2028-02-29'),true);const s=seed();s.calendar[0].start_date='2026-02-30';assert.throws(()=>validateBackup(s),/calendar/);
});
test('backup validation rejects broken correction references, overrides and timers',()=>{
  const a=seed();a.events.push({id:'broken',type:'void',target:'missing'});assert.throws(()=>validateBackup(a),/correction/);
  const b=seed();b.overrides.push({kind:'rest',day:'2026-14-40'});assert.throws(()=>validateBackup(b),/override/);
  const c=seed();c.timer={id:'bad',taskId:'missing',startedAt:0,accumulatedMs:0,running:false,targetMinutes:25};assert.throws(()=>validateBackup(c),/timer/);
});
test('backup validation supports a large acyclic curriculum without recursive stack overflow',()=>{
  const s=seed(),base=s.tasks[0];s.tasks=Array.from({length:4500},(_,i)=>({...base,id:'task'+i,prerequisites:i?['task'+(i-1)]:[]}));assert.equal(validateBackup(s),s);s.tasks.at(-1).track='academic';s.tasks.at(-1).deadline='2026-11-16';assert.doesNotThrow(()=>deadlineRisks(s,'2026-11-16'));
});
test('a short remaining deliverable fits a short remaining daily block',()=>{
  const s=seed();s.tasks[0].remainingMinutes=5;s.events.push({id:'partial',type:'session',taskId:'ila-311',outcome:'partial',day:'2026-11-16',minutes:82});assert.equal(dailyChoice(s,'2026-11-16').task.id,'ila-311');assert.equal(forecast(s,'2026-11-16',1)[0].minutes,5);
});
test('explicit Sunday ENSAM work overrides recovery while independent work stays protected',()=>{
  const s=seed();s.overrides.push({day:'2026-11-22',kind:'ensam'});s.tasks.push({...s.tasks[0],id:'sunday-td',track:'academic'});assert.equal(dayRule(s,'2026-11-22').kind,'academic');assert.equal(dailyChoice(s,'2026-11-22').task.id,'sunday-td');
});
test('deadline warnings include unfinished prerequisites and already-used academic time',()=>{
  const s=seed();s.tasks.push({...s.tasks[0],id:'pre',track:'academic',minutes:60});s.tasks.push({...s.tasks[0],id:'urgent',track:'academic',minutes:60,deadline:'2026-11-16',prerequisites:['pre']});assert.equal(deadlineRisks(s,'2026-11-16').find(r=>r.id==='urgent').shortfall,30);
  s.events.push({id:'spent',type:'session',taskId:'pre',day:'2026-11-16',outcome:'partial',minutes:20});assert.equal(deadlineRisks(s,'2026-11-16').find(r=>r.id==='urgent').shortfall,50);
});

test('imported historical snapshots cannot inject non-text values into the study log',()=>{const s=recordOutcome(seed(),{id:'old',taskId:'ila-311',day:'2026-11-16',minutes:5,outcome:'partial'});s.events[0].taskSnapshot.heading={toString:1};assert.throws(()=>validateBackup(s),/snapshot/);});

test('new task creation is not mistaken for editing a focused task',()=>{const s=seed();assert.equal(taskIsInFocus(s,undefined),false);assert.equal(taskIsInFocus(s,null),false);s.timer={taskId:'ila-311'};assert.equal(taskIsInFocus(s,undefined),false);assert.equal(taskIsInFocus(s,'ila-311'),true);assert.equal(taskIsInFocus(s,'other'),false);});
