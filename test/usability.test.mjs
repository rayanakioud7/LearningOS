import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {migrateState,addLocalTask,reviseTask,reviseResource,setResourceEnabled} from '../dist/curriculum.js';
import {recordOutcome,dailyChoice} from '../dist/engine.js';
import {toggleFocus} from '../dist/session.js';
import {parseNavigation,navigationHash} from '../dist/navigation.js';
import {renderCurriculumView} from '../dist/views.js';
import {renderCalendarView,calendarKeyDate} from '../dist/calendar-view.js';
const read=n=>JSON.parse(readFileSync(new URL('../dist/'+n,import.meta.url)));
const catalog=read('catalog.json'),planning=read('planning.json'),seed=()=>migrateState(read('seed.json'),catalog,planning);
test('deep links survive refresh/back and reject invalid dates or unknown routes',()=>{
 const route={view:'calendar',calendarStart:'2028-10-03',calendarMode:'Week'};assert.equal(parseNavigation(navigationHash(route)).calendarStart,route.calendarStart);assert.equal(parseNavigation(navigationHash(route)).calendarMode,'Week');assert.equal(parseNavigation('#calendar?date=2027-02-29&mode=bogus').calendarStart,'');assert.equal(parseNavigation('#garbage').view,'today');
 const resource={view:'roadmap',semesterFilter:'3',curriculumResource:'geron',search:'linear & logistic',filter:'draft'};const out=parseNavigation(navigationHash(resource));for(const k of Object.keys(resource))assert.equal(out[k],resource[k]);
});
test('calendar keyboard navigation crosses month/year and respects leap days',()=>{
 assert.equal(calendarKeyDate('2028-02-29','ArrowRight'),'2028-03-01');assert.equal(calendarKeyDate('2028-02-29','PageDown'),'2028-03-29');assert.equal(calendarKeyDate('2028-03-01','Home'),'2028-02-28');assert.equal(calendarKeyDate('2028-03-01','End'),'2028-03-05');assert.equal(calendarKeyDate('2028-03-01','Tab'),null);
});
test('focus target uses the current task allocation instead of the total multi-block forecast',()=>{
 let s=seed();s=addLocalTask(s,{...s.tasks[0],id:'inference',resource:'Wasserman — All of Statistics',semester:3,section:'Chapter 6',minutes:90,notBefore:'',prerequisites:[]});s=recordOutcome(s,{id:'spent',taskId:'inference',day:'2027-09-08',minutes:40,outcome:'partial',remainingMinutes:5});
 s=addLocalTask(s,{...s.tasks[0],id:'td',resource:'Synthetic ENSAM',track:'academic',semester:3,minutes:60,notBefore:'',prerequisites:[]});
 assert.equal(dailyChoice(s,'2027-09-08').task.id,'inference');const next=toggleFocus(s,'2027-09-08',{id:'timer',now:1000});assert.equal(next.timer.targetMinutes,5);assert.equal(next.events.length,s.events.length);assert.equal(s.timer,null);
 assert.throws(()=>toggleFocus(s,'2026-11-15',{id:'rest'}),/rest|recovery|available/i);
});
test('catalog-only resources can be edited and suspended without auto-staging or activating units',()=>{
 const s=seed(),r={id:'new-book',name:'A new reference',enabled:true,edition:'1',source:'user',url:''};const next=reviseResource(s,r.id,{name:'Edited reference'},{fallback:r});assert.equal(next.resources.find(x=>x.id===r.id).name,'Edited reference');assert.equal(next.tasks.length,s.tasks.length);assert.deepEqual(next.events,s.events);assert.equal(setResourceEnabled(s,r.id,false,r).resources.find(x=>x.id===r.id).enabled,false);
});
test('resource renaming updates current unfinished labels and freezes completed snapshots',()=>{
 let s=recordOutcome(seed(),{id:'done',taskId:'ila-311',day:'2026-11-16',outcome:'completed',minutes:35});const events=structuredClone(s.events),old=s.tasks[0].resource;
 const next=reviseResource(s,'ila',{name:'ILA renamed'});assert.deepEqual(next.events,events);assert.equal(next.tasks[0].resource,old);assert.equal(next.tasks[1].resource,'ILA renamed');
});
test('semester/status filters cannot show a resource just because it is active in a different semester',()=>{
 const s=seed();for(const t of s.tasks.filter(t=>t.semester===2))t.status='draft';const html=renderCurriculumView(s,{catalog,semester:'2',filter:'active'});assert.ok(!html.includes('data-resource-view="ila"'));
});
test('resource contents show the saved edited action and natural chapter order',()=>{
 let s=seed();s=reviseTask(s,'ila-311',{heading:'My saved heading',action:'My saved action'});const html=renderCurriculumView(s,{catalog,resourceDetail:'ila'});assert.match(html,/My saved heading/);assert.match(html,/My saved action/);
 const r={id:'order',name:'Chapter order',enabled:true},u=n=>({id:'c'+n,resourceId:'order',unitRef:'Chapter '+n,heading:'Topic '+n,semester:1,activity:'Read',completionEvidence:'Explain',estimatedMinutes:25,dependencies:[]});const custom={resources:[r],units:[u(10),u(2),u(1)]};const ordered=renderCurriculumView(s,{catalog:custom,resourceDetail:'order'});assert.ok(ordered.indexOf('Topic 2')<ordered.indexOf('Topic 10'));
});
test('forecast-only tasks offer staging instead of opening an editor for a missing saved task',()=>{
 const html=renderCalendarView(seed(),'2026-11-14','Day',catalog,'2026-12-01');const edits=[...html.matchAll(/data-edit="([^"]+)"/g)].map(m=>m[1]);const s=seed();assert.ok(edits.every(id=>s.tasks.some(t=>t.id===id)));
});
test('study-log search/month filters and pagination preserve all original attempts',async()=>{
 const {historyPage,renderHistoryView}=await import('../dist/history-view.js');const s=seed();for(let i=0;i<45;i++)s.events.push({id:'attempt-'+i,type:'session',taskId:'ila-311',day:'2026-11-'+String(i%28+1).padStart(2,'0'),minutes:5,outcome:'partial',note:i===2?'A unique retained note':'Work'});
 const before=structuredClone(s),page=historyPage(s,{pageSize:10});assert.equal(page.groups.length,10);assert.equal(page.pages,3);assert.equal(historyPage(s,{pageSize:10,page:2}).groups.length,8);assert.equal(historyPage(s,{search:'unique retained'}).total,1);assert.equal(historyPage(s,{month:'2026-12'}).total,0);assert.match(renderHistoryView(s),/Older →/);assert.deepEqual(s,before);
});
test('allocation actions cannot open a task editor for a scenario-only task',async()=>{
 const {allocationAction}=await import('../dist/calendar-view.js');const s=seed();const html=allocationAction(s,{id:'catalog:new-unit',unitId:'new-unit'});assert.match(html,/data-stage-unit="new-unit"/);assert.ok(!html.includes('data-edit'));assert.match(allocationAction(s,s.tasks[0]),/data-edit="ila-311"/);
});
test('an older installed bundle cannot downgrade a newer saved roadmap',async()=>{
 const {applyPlanningUpdate}=await import('../dist/roadmap.js');const s=seed(),older=structuredClone(planning);older.policyVersion=planning.policyVersion-1;const before=structuredClone(s);assert.equal(applyPlanningUpdate(s,older),s);assert.deepEqual(s,before);
});
test('planning upgrades preserve their original snapshot even after a later old backup restore',async()=>{
 const {IDBFactory}=await import('fake-indexeddb');const {openDatabase,saveChange,refreshPlanningDatabase,readSaved}=await import('../dist/storage.js');const db=await openDatabase(new IDBFactory());
 try{const s=seed();s.planning.policyVersion=planning.policyVersion-1;let saved=await saveChange(db,0,x=>x,s);await refreshPlanningDatabase(db,planning);const point=await readSaved(db,'planning-before-'+planning.policyVersion);saved=await readSaved(db);saved=await saveChange(db,saved.revision,x=>{x.planning.policyVersion--;return x;});await refreshPlanningDatabase(db,planning);assert.deepEqual(await readSaved(db,'planning-before-'+planning.policyVersion),point);}finally{db.close();}
});
test('disabling optional summer study does not suppress a real confirmed university deadline',()=>{
 let s=seed();s=addLocalTask(s,{...s.tasks[0],id:'summer-deadline',resource:'ENSAM actual work',track:'academic',notBefore:'',deadline:'2027-07-05',assignmentConfirmed:true,deadlineType:'teacher',semester:2,prerequisites:[]});const choice=dailyChoice(s,'2027-07-05');assert.equal(choice.task.id,'summer-deadline');assert.equal(choice.rule.independentMinutes,0);assert.ok(choice.allocationMinutes>0);
});
test('editing metadata keeps the fallback label and independently revised remaining effort',()=>{
 let s=recordOutcome(seed(),{id:'partial-fraction',taskId:'ila-311',day:'2026-11-16',minutes:1.3,outcome:'partial'});const t=s.tasks[0],source=t.remainingEstimateSource,remaining=t.remainingMinutes;const next=reviseTask(s,t.id,{heading:'New heading',remainingMinutes:remaining});assert.equal(next.tasks[0].remainingMinutes,remaining);assert.equal(next.tasks[0].remainingEstimateSource,source);assert.deepEqual(next.events,s.events);
});
