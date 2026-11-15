import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IDBFactory} from 'fake-indexeddb';
import {migrateState,reviseTask} from '../dist/curriculum.js';
import {synchronizeCurriculum} from '../dist/automatic-curriculum.js';
import {gateMet,blockPlan} from '../dist/roadmap.js';
import {effectiveProgress} from '../dist/automatic-roadmap.js';
import {project,readyV2} from '../dist/planner.js';
import {recordOutcome,completed} from '../dist/engine.js';
import {openDatabase,readSaved,saveChange,refreshCurriculumDatabase} from '../dist/storage.js';
import {refineCatalog} from '../scripts/refine-catalog.mjs';
const read=name=>JSON.parse(readFileSync(new URL('../'+name,import.meta.url),'utf8'));
const catalog=read('dist/catalog.json'),planning=read('dist/planning.json');
const seed=()=>migrateState(read('dist/seed.json'),catalog,planning);
const automatic=()=>synchronizeCurriculum(seed(),catalog,'2026-11-15');

test('one upgrade activates every source and existing draft, without fake completions',()=>{
 const input=seed();input.tasks.at(-1).status='draft';input.tasks.at(-1).reviewed=false;const before=structuredClone(input),s=synchronizeCurriculum(input,catalog);
 assert.ok(s.tasks.every(t=>t.status==='active'&&t.reviewed));assert.ok(catalog.units.every(u=>s.tasks.some(t=>t.unitId===u.id||t.resourceId===u.resourceId&&t.section===u.unitRef)));
 assert.equal(completed(s).size,0);assert.deepEqual(s.events,before.events);assert.deepEqual(input,before);assert.equal(synchronizeCurriculum(s,catalog),s);
});
test('upgrade preserves timers, partial effort, custom headings, dates, paused resources and immutable snapshots',()=>{
 let s=seed();s=recordOutcome(s,{id:'part',taskId:'ila-311',type:'session',day:'2026-11-16',minutes:15,outcome:'partial',remainingMinutes:12});
 s=reviseTask(s,'ila-311',{heading:'My matrix reflection practice'});s.timer={id:'timer',taskId:'ila-311',running:true,startedAt:1000,accumulatedMs:4000,targetMinutes:25};s.resources.find(r=>r.id==='ila').enabled=false;s.overrides.push({day:'2026-11-17',kind:'rest'});
 const n=synchronizeCurriculum(s,catalog);for(const k of ['timer','events','calendar','overrides','checkpoints'])assert.deepEqual(n[k],s[k]);assert.equal(n.tasks.find(t=>t.id==='ila-311').remainingMinutes,12);assert.equal(n.tasks.find(t=>t.id==='ila-311').heading,'My matrix reflection practice');assert.equal(n.resources.find(r=>r.id==='ila').enabled,false);
});
test('section overviews and unknown university assignments are active references, never invented homework',()=>{
 const s=automatic();assert.equal(s.tasks.find(t=>t.id==='catalog:ila:3-1').referenceOnly,true);
 assert.equal(readyV2(s,'2026-11-16')[0].id,'ila-311');assert.ok(!readyV2(s,'2026-11-16').some(t=>t.referenceOnly));assert.equal(readyV2(s,'2026-11-18').length,0);
 const u=s.tasks.find(t=>t.id==='catalog:ensam:s1-module-1');assert.equal(u.status,'active');assert.equal(u.referenceOnly,true);assert.ok(!u.assignmentConfirmed&&!u.teacherConfirmed);
});
test('all Prince chapters 12–21 have exact titles and automatic sequential allocation',()=>{
 const s=automatic(),before=structuredClone(s),rows=project(s,'2026-11-16','2029-06-30',catalog);
 const seen=[...new Set(rows.flatMap(p=>p.blocks||[]).filter(b=>b.task.resourceId==='udl').map(b=>b.task.heading))];
 for(const title of ['Transformers','Graph neural networks','Normalizing flows','Variational autoencoders','Diffusion models','Deep reinforcement learning','Deep learning and ethics'])assert.ok(seen.includes(title),title);
 assert.ok(seen.indexOf('Transformers')<seen.indexOf('Graph neural networks'));assert.ok(rows.every(p=>!p.notActivated));assert.ok(rows.flatMap(p=>p.blocks||[]).every(b=>!b.task.referenceOnly));assert.deepEqual(s,before);assert.equal(completed(s).size,0);
});
test('all chapter ranges expand to individual units; publisher headings replace folder placeholders',()=>{
 for(let n=4;n<=36;n++)assert.ok(catalog.units.some(u=>u.id==='vanderplas-2e:ch-'+n));
 assert.ok(catalog.units.filter(u=>u.resourceId==='huang').every(u=>!u.heading.startsWith('Code and exercises')));
 assert.equal(catalog.units.find(u=>u.id==='wasserman:ch-8').heading,'The Bootstrap');assert.equal(catalog.units.find(u=>u.id==='mml:part1-3').heading,'Analytic Geometry');
 assert.deepEqual(refineCatalog(catalog),catalog);
});
test('skill checks derive only from explicit non-voided outcomes and remove the SVD checkbox step',()=>{
 let s=automatic();assert.equal(gateMet(s,'linear-foundations'),false);
 for(const ref of ['5.1','6.1','6.3','6.5']){const t=s.tasks.find(t=>t.resourceId==='ila'&&t.section==='§'+ref);s=recordOutcome(s,{id:'done-'+ref,type:'session',taskId:t.id,day:'2027-03-01',minutes:10,outcome:'completed'});}
 assert.equal(gateMet(s,'linear-foundations'),true);s.events.push({id:'void',type:'void',target:'done-6.5'});assert.equal(gateMet(s,'linear-foundations'),false);
});
test('MIT no longer waits for trial confirmation; clinic and pretrained baseline pick a source automatically',()=>{
 const s=automatic();assert.equal(blockPlan(s,'2026-12-01')[0].available,true);
 assert.ok(readyV2(s,'2027-09-06').some(t=>['mml','cs229'].includes(t.resourceId)));
 assert.deepEqual(blockPlan(s,'2028-09-07')[0].resources,['huggingface']);assert.ok(!s.settings.roadmapChoices?.mathClinicUnitId);
});
test('completed MIT trial ranges cover their individual sessions without adding completion events',()=>{
 let s=seed();s=recordOutcome(s,{id:'trial',type:'session',taskId:'mit-trial-1',day:'2026-11-17',minutes:45,outcome:'completed'});s=synchronizeCurriculum(s,catalog);
 const done=effectiveProgress(s,completed(s));assert.ok(done.has('catalog:mit1802:session-47'));assert.ok(done.has('catalog:mit1802:session-48'));assert.equal(s.events.length,1);assert.equal(completed(s).size,1);
 assert.ok(!readyV2(s,'2026-11-24').some(t=>t.section==='Session 47'||t.section==='Session 48'));
});
test('older clients do not downgrade a newer saved catalog or repeat earlier semester coursework',()=>{
 const s=automatic(),future=structuredClone(s);future.curriculumRelease='2026-12-01.1';future.automaticCurriculumVersion='2026-12-01.1';assert.equal(synchronizeCurriculum(future,catalog),future);
 const academic=s.tasks.find(t=>t.track==='academic'&&t.semester===1);academic.referenceOnly=false;
 assert.ok(!readyV2(s,'2028-09-06').some(t=>t.id===academic.id));
});
test('concurrent database upgrades preserve one atomic catalog snapshot and the existing restore point',async()=>{
 const db=await openDatabase(new IDBFactory());try{
  const original=seed();await saveChange(db,original.revision,x=>x,original);const first=await readSaved(db);await saveChange(db,first.revision,x=>x,null,{preservePrevious:true});const restore=await readSaved(db,'restore-point'),prior=await readSaved(db);
  const[a,b]=await Promise.all([refreshCurriculumDatabase(db,catalog),refreshCurriculumDatabase(db,catalog)]);assert.deepEqual(a,b);assert.deepEqual((await readSaved(db,'curriculum-before-'+catalog.version)).state,prior);assert.deepEqual(await readSaved(db,'restore-point'),restore);
  assert.deepEqual(await refreshCurriculumDatabase(db,catalog),a);
 }finally{db.close();}
});
