import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {migrateState,applyImport,reviseTask} from '../dist/curriculum.js';
import {synchronizeCurriculum} from '../dist/automatic-curriculum.js';
import {project} from '../dist/planner.js';
import {completed,recordOutcome} from '../dist/engine.js';
import {findInPlan} from '../dist/find.js';
import {matchesSearch} from '../dist/search.js';
import {renderCurriculumView} from '../dist/views.js';
const read=name=>JSON.parse(readFileSync(new URL('../dist/'+name,import.meta.url),'utf8'));
const catalog=read('catalog.json'),planning=read('planning.json'),seed=()=>migrateState(read('seed.json'),catalog,planning);
function olderImport(){
 const old=structuredClone(catalog.units.filter(u=>u.resourceId==='udl'));for(const u of old)if(Number(u.unitRef.match(/\d+/)[0])>=13)u.dependencies=[];
 let s=applyImport(seed(),{version:'older-import',resources:[],units:old},old.map(u=>u.id));
 for(const t of s.tasks.filter(t=>t.resourceId==='udl')){t.status='active';t.reviewed=true;}
 s.tasks.find(t=>t.unitId==='udl:ch-13').order=9999;return s;
}
const princeSequence=s=>[...new Set(project(s,'2026-11-16','2029-06-30',catalog).flatMap(p=>p.blocks||[]).filter(b=>b.task.resourceId==='udl').map(b=>Number(b.task.section.match(/\d+/)[0])))];
test('upgrading an earlier catalog import places Prince 13 between 12 and 14, regardless of insertion order',()=>{
 const old=olderImport(),s=synchronizeCurriculum(old,catalog);assert.deepEqual(princeSequence(s),Array.from({length:21},(_,i)=>i+1));assert.equal(completed(s).size,0);assert.deepEqual(s.events,old.events);
});
test('a title or status edit does not freeze outdated catalog prerequisites',()=>{
 let s=olderImport();s=reviseTask(s,'catalog:udl:ch-13',{heading:'My graph neural networks notes',status:'active'});s=synchronizeCurriculum(s,catalog);
 assert.equal(s.tasks.find(t=>t.unitId==='udl:ch-13').heading,'My graph neural networks notes');assert.deepEqual(princeSequence(s),Array.from({length:21},(_,i)=>i+1));
});
test('upgrades preserve deliberate prerequisite changes and do not create cycles around them',()=>{
 let s=olderImport();s=reviseTask(s,'catalog:udl:ch-13',{prerequisites:['catalog:udl:ch-21']});s=synchronizeCurriculum(s,catalog);
 assert.deepEqual(s.tasks.find(t=>t.unitId==='udl:ch-13').prerequisites,['catalog:udl:ch-21']);assert.ok(s.tasks.some(t=>t.unitId==='udl:ch-21'));
});
test('a catalog repair preserves a live session, partial effort, and existing completion snapshots',()=>{
 let s=olderImport();s=recordOutcome(s,{id:'real-work',type:'session',taskId:'catalog:udl:ch-13',day:'2028-09-18',minutes:10,outcome:'partial',remainingMinutes:35});
 s.timer={id:'running',taskId:'catalog:udl:ch-13',running:true,startedAt:1000,accumulatedMs:1000,targetMinutes:25};const before=structuredClone(s),n=synchronizeCurriculum(s,catalog);
 assert.deepEqual(n.events,before.events);assert.deepEqual(n.timer,before.timer);assert.equal(n.tasks.find(t=>t.unitId==='udl:ch-13').remainingMinutes,35);
});
test('later repairs keep deliberately drafted tasks, paused resources and manual ordering',()=>{
 let s=synchronizeCurriculum(seed(),catalog);s.curriculumRelease='2026-11-15.2';s.automaticCurriculumVersion='2026-11-15.2';s=reviseTask(s,'catalog:udl:ch-13',{status:'draft',order:1000});s.resources.find(r=>r.id==='udl').enabled=false;
 const n=synchronizeCurriculum(s,catalog);assert.equal(n.tasks.find(t=>t.unitId==='udl:ch-13').status,'draft');assert.equal(n.tasks.find(t=>t.unitId==='udl:ch-13').order,1000);assert.equal(n.resources.find(r=>r.id==='udl').enabled,false);
});
test('version ordering treats release 10 as newer than release 3',()=>{
 const s=synchronizeCurriculum(seed(),catalog);s.curriculumRelease='2026-11-15.10';s.automaticCurriculumVersion='2026-11-15.10';assert.equal(synchronizeCurriculum(s,catalog),s);
});
test('chapter search understands Ch, chapter, accents and common resource abbreviations',()=>{
 const s=synchronizeCurriculum(seed(),catalog),before=structuredClone(s);
 for(const query of ['Prince chapter 13','UDL ch. 013','graph prince'])assert.ok(findInPlan(s,catalog,query).some(r=>r.taskId==='catalog:udl:ch-13'),query);
 assert.ok(findInPlan(s,catalog,'Geron chapter 4').some(r=>r.taskId==='catalog:geron:ch-04'));
 assert.ok(findInPlan(s,catalog,'ILA §3.1.1').some(r=>r.taskId==='ila-311'));
 assert.equal(matchesSearch('Ch 113 · Example','chapter 13'),false);assert.equal(matchesSearch('Chapter 13','Ch 130'),false);assert.deepEqual(s,before);
});
test('curriculum filters use the same word-order-independent chapter search as quick search',()=>{
 const s=synchronizeCurriculum(seed(),catalog),html=renderCurriculumView(s,{catalog,resourceDetail:'udl',search:'chapter 13 prince'});
 assert.ok(html.includes('Graph neural networks'));assert.ok(!html.includes('<h3>Transformers</h3>'));assert.ok(html.includes('1 shown'));
});
test('quick search does not duplicate saved legacy sections as available catalog chapters',()=>{
 const s=synchronizeCurriculum(seed(),catalog),results=findInPlan(s,catalog,'ILA §3.2',30);
 assert.ok(results.some(r=>r.taskId==='ila-3-2'));assert.ok(!results.some(r=>r.key==='unit:ila:3-2'));
});
