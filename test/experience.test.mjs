import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {findInPlan} from '../dist/find.js';
import {renderCurriculumView} from '../dist/views.js';
import {migrateState,reviseTask} from '../dist/curriculum.js';
import {recordOutcome} from '../dist/engine.js';
import {navigationHash,parseNavigation} from '../dist/navigation.js';
import {renderTodayView} from '../dist/today.js';
import {addLocalTask} from '../dist/curriculum.js';
import {dailyChoice} from '../dist/engine.js';
import {toggleFocus} from '../dist/session.js';
const read=n=>JSON.parse(readFileSync(new URL('../dist/'+n,import.meta.url)));
const catalog=read('catalog.json'),planning=read('planning.json');
const seed=()=>migrateState(read('seed.json'),catalog,planning);

test('quick find locates a saved subsection and returns a bookmarkable destination without changing progress',()=>{
 const s=seed(),before=structuredClone(s);
 const result=findInPlan(s,catalog,'3.1.1 Matrices').find(x=>x.taskId==='ila-311');
 assert.ok(result);const route=parseNavigation(navigationHash(result.route));
 assert.equal(route.curriculumResource,'ila');assert.equal(route.filter,'all');assert.equal(route.search,s.tasks.find(t=>t.id==='ila-311').heading);assert.deepEqual(s,before);
});
test('quick find supports unaccented names and includes unstaged source chapters without activating them',()=>{
 const s=seed(),count=s.tasks.length;
 assert.ok(findInPlan(s,catalog,'geron').some(x=>x.title.includes('Géron')));
 const u=catalog.units.find(u=>u.resourceId==='velleman');
 assert.ok(findInPlan(s,catalog,u.heading,30).some(x=>x.key==='unit:'+u.id));assert.equal(s.tasks.length,count);assert.equal(s.events.length,0);
 assert.equal(findInPlan(s,catalog,'a topic that does not exist').length,0);
});
test('quick find honors explicit completion corrections and excludes private notes from its index',()=>{
 let s=recordOutcome(seed(),{id:'done',taskId:'ila-311',day:'2026-11-16',outcome:'completed',minutes:15,note:'private-note-unique-token'});
 assert.equal(findInPlan(s,catalog,'3.1.1 Matrices').find(x=>x.taskId==='ila-311').kind,'Completed');
 s.events.push({id:'void',type:'void',target:'done'});
 assert.equal(findInPlan(s,catalog,'3.1.1 Matrices').find(x=>x.taskId==='ila-311').kind,'Active task');assert.equal(findInPlan(s,catalog,'private-note-unique-token').length,0);
});
test('resource status filter applies to individual chapters, not only the resource list',()=>{
 let s=recordOutcome(seed(),{id:'done',taskId:'ila-311',day:'2026-11-16',outcome:'completed',minutes:20});
 const done=renderCurriculumView(s,{catalog,resourceDetail:'ila',filter:'completed'});
 assert.match(done,/data-edit="ila-311"/);assert.ok(!done.includes('data-edit="ila-311-examples"'));
 const active=renderCurriculumView(s,{catalog,resourceDetail:'ila',filter:'active'});
 assert.ok(!active.includes('data-edit="ila-311"'));assert.match(active,/data-edit="ila-311-examples"/);
 const available=renderCurriculumView(s,{catalog,resourceDetail:'velleman',filter:'catalog'});
 assert.match(available,/data-stage-unit=/);assert.ok(!available.includes('data-edit='));
});
test('searching a resource by an edited heading finds the current task rather than only catalog text',()=>{
 const s=reviseTask(seed(),'ila-311',{heading:'My matrix input-output experiment'});
 const html=renderCurriculumView(s,{catalog,resourceDetail:'ila',search:'input-output experiment',filter:'all'});
 assert.match(html,/data-edit="ila-311"/);assert.match(html,/My matrix input-output experiment/);assert.ok(!html.includes('data-edit="ila-311-examples"'));
});
test('Today previews the same short focus duration that starting the timer will use',()=>{
 let s=seed();s=addLocalTask(s,{...s.tasks[0],id:'short-inference',resource:'Wasserman — All of Statistics',semester:3,section:'Chapter 6',minutes:90,notBefore:'',prerequisites:[]});
 s=recordOutcome(s,{id:'spent-short',taskId:'short-inference',day:'2027-09-08',minutes:40,outcome:'partial',remainingMinutes:5});
 assert.equal(dailyChoice(s,'2027-09-08').task.id,'short-inference');
 const html=renderTodayView(s,'2027-09-08');assert.match(html,/data-focus-minutes="5"/);assert.match(html,/>05:00<\/span>/);
 assert.equal(toggleFocus(s,'2027-09-08',{id:'timer',now:1000}).timer.targetMinutes,5);
});
