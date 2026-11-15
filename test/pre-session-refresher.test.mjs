import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IDBFactory} from 'fake-indexeddb';
import {migrateState} from '../dist/curriculum.js';
import {synchronizeCurriculum} from '../dist/automatic-curriculum.js';
import {dailyChoice,completed,recordOutcome} from '../dist/engine.js';
import {chooseRefresher,startAfterRefresher,renderRefresher,refresherLLMContext} from '../dist/refresher.js';
import {refresherQuestions} from '../dist/refresher-questions.js';
import {prepareTransfer,prepareRestore} from '../dist/backup.js';
import {validateBackup} from '../dist/validation.js';
import {openDatabase,saveChange,readSaved} from '../dist/storage.js';
const read=n=>JSON.parse(readFileSync(new URL('../dist/'+n,import.meta.url),'utf8'));
const catalog=read('catalog.json'),planning=read('planning.json');
const seed=()=>synchronizeCurriculum(migrateState(read('seed.json'),catalog,planning),catalog);
const day='2026-11-16',target=s=>dailyChoice(s,day).task;
const event=(extra={})=>({id:'done',type:'session',taskId:'ila-311',day,outcome:'completed',minutes:10,...extra});

test('the explicit examples checkpoint enables one short recall prompt without granting completion',()=>{
 const s=seed(),before=structuredClone(s),q=chooseRefresher(s,target(s),day);assert.match(q.id,/ila-rank/);assert.match(q.source.origin,/examples practiced/);assert.equal(completed(s).size,0);assert.deepEqual(s,before);
});
test('unsupported material, rest days and absent or future checkpoints do not create prompts',()=>{
 const s=seed();assert.equal(chooseRefresher(s,null,day),null);s.checkpoints=[];assert.equal(chooseRefresher(s,target(s),day),null);
 s.checkpoints=[{resource:'ILA',last_demonstrated:'§2.9 The Rank Theorem — examples completed',confirmed_at:'2027-01-01'}];assert.equal(chooseRefresher(s,target(s),day),null);
 assert.equal(chooseRefresher(s,{id:'paper',resourceId:'paper',prerequisites:[]},day),null);
});
test('a completed prior task provides the refresher for the next session in that resource',()=>{
 const s=recordOutcome(seed(),event()),q=chooseRefresher(s,target(s),day);assert.equal(q.id,'ila-matrix-map');assert.equal(q.source.taskId,'ila-311');assert.equal(s.events.length,1);
});
test('partial, skipped, corrected and future completions are not treated as studied topics',()=>{
 for(const extra of [{outcome:'partial'},{outcome:'skipped'},{day:'2027-01-01'}]){const s=recordOutcome(seed(),event(extra));s.checkpoints=[];assert.equal(chooseRefresher(s,{...s.tasks[1],prerequisites:[]},day),null);}
 const s=recordOutcome(seed(),event());s.checkpoints=[];s.events.push({id:'void',type:'void',target:'done'});assert.equal(chooseRefresher(s,s.tasks[1],day),null);
});
test('recall uses the original completed source snapshot after current headings are edited',()=>{
 const s=recordOutcome(seed(),event());s.tasks[0].heading='A later unrelated heading';const q=chooseRefresher(s,s.tasks[1],day);assert.equal(q.source.heading,'Matrices as Functions');assert.equal(q.id,'ila-matrix-map');
});
test('resume and a disabled preference bypass the refresher',()=>{
 const s=seed();s.settings.preSessionRefreshers=false;assert.equal(chooseRefresher(s,target(s),day),null);delete s.settings.preSessionRefreshers;s.timer={taskId:'ila-311',running:false};assert.equal(chooseRefresher(s,target(s),day),null);s.timer.running=true;assert.equal(chooseRefresher(s,target(s),day),null);
});
test('continue or skip starts the normal focus allocation and only records a bounded visit',()=>{
 const s=seed(),before=structuredClone(s),t=target(s),q=chooseRefresher(s,t,day),next=startAfterRefresher(s,day,t.id,q.id,{id:'focus',now:1000});
 assert.equal(next.timer.taskId,t.id);assert.equal(next.timer.running,true);assert.equal(next.timer.targetMinutes,Math.min(s.settings.focusMinutes,dailyChoice(s,day).allocationMinutes));assert.deepEqual(next.events,s.events);assert.equal(completed(next).size,0);assert.deepEqual(next.refresherVisits,[{day,taskId:t.id,questionId:q.id}]);assert.deepEqual(s,before);validateBackup(next);
 next.timer=null;assert.equal(chooseRefresher(next,t,day),null);assert.ok(chooseRefresher(next,t,'2026-11-17'));
});
test('stale tasks, a changed prompt and an active session cannot start a second timer',()=>{
 const s=seed(),t=target(s),q=chooseRefresher(s,t,day);assert.throws(()=>startAfterRefresher(s,day,'other',q.id,{id:'bad'}),/session changed/i);assert.throws(()=>startAfterRefresher(s,day,t.id,'other',{id:'bad'}),/session changed/i);
 const next=startAfterRefresher(s,day,t.id,q.id,{id:'focus'});assert.throws(()=>startAfterRefresher(next,day,t.id,q.id,{id:'second'}),/session changed/i);assert.equal(next.timer.id,'focus');
});
test('visits stay bounded and transfer with preferences while historical attempts remain unchanged',()=>{
 const s=seed();s.refresherVisits=Array.from({length:200},()=>({day:'2026-11-14',taskId:'ila-311',questionId:'ila-rank'}));const t=target(s),q=chooseRefresher(s,t,day),next=startAfterRefresher(s,day,t.id,q.id,{id:'focus',now:1000});assert.equal(next.refresherVisits.length,200);next.settings.preSessionRefreshers=false;
 const roundTrip=prepareRestore(JSON.parse(JSON.stringify(prepareTransfer(next,1000))),100,2000);assert.equal(roundTrip.settings.preSessionRefreshers,false);assert.deepEqual(roundTrip.refresherVisits,next.refresherVisits);assert.deepEqual(roundTrip.events,s.events);assert.equal(roundTrip.timer.running,false);
});
test('malformed refresher preferences and visit references fail backup validation',()=>{
 const s=seed();s.settings.preSessionRefreshers='yes';assert.throws(()=>validateBackup(s),/refresher preference/);delete s.settings.preSessionRefreshers;s.refresherVisits=[{day,taskId:'unknown',questionId:'x'}];assert.throws(()=>validateBackup(s),/refresher history/);
});
test('question rendering escapes imported source text and rejects executable links',()=>{
 const q=chooseRefresher(seed(),target(seed()),day);q.source.heading='<img src=x onerror=alert(1)>';q.source.url='javascript:alert(1)';const html=renderRefresher(q);assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('href="javascript:'));assert.match(html,/Show answer/);assert.match(html,/Skip &amp; start|Skip & start/);
});
test('copying LLM context includes only the shown scope and never includes the answer or private history',()=>{
 const s=seed(),t=target(s),q=chooseRefresher(s,t,day);s.privateNote='SECRET';const text=refresherLLMContext(q,t);assert.ok(text.includes(q.prompt));assert.ok(text.includes(t.heading));assert.ok(!text.includes(q.answer));assert.ok(!text.includes('SECRET'));
});
test('the question bank has stable unique IDs, resource scopes, a prompt and a concise answer',()=>{
 assert.equal(new Set(refresherQuestions.map(q=>q.id)).size,refresherQuestions.length);for(const q of refresherQuestions){assert.ok(q.resources.length&&q.resources.every(id=>catalog.resources.some(r=>r.id===id)));assert.ok(q.prompt.length>20&&q.answer.length>20);assert.ok(q.match instanceof RegExp);}
});
test('two tabs cannot both start the same refresher session in native-style IndexedDB transactions',async()=>{
 const db=await openDatabase(new IDBFactory());try{const s=seed(),saved=await saveChange(db,s.revision,x=>x,s),t=target(saved),q=chooseRefresher(saved,t,day);const results=await Promise.allSettled(['a','b'].map(id=>saveChange(db,saved.revision,x=>startAfterRefresher(x,day,t.id,q.id,{id,now:1000}))));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);const actual=await readSaved(db);assert.equal(actual.refresherVisits.length,1);assert.equal(actual.events.length,0);}finally{db.close();}
});
