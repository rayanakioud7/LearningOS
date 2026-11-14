import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {migrateState,addLocalTask,applyImport,previewImport} from '../dist/curriculum.js';
import {recordOutcome,completed} from '../dist/engine.js';
import {monthDates,navigateDate,calendarRows,renderCalendarView} from '../dist/calendar-view.js';
import {renderCurriculumView} from '../dist/views.js';
import {renderHistoryView} from '../dist/history-view.js';
import {groupAttempts} from '../dist/effort.js';
const read=n=>JSON.parse(readFileSync(new URL('../dist/'+n,import.meta.url)));
const catalog=read('catalog.json'),planning=read('planning.json'),seed=()=>migrateState(read('seed.json'),catalog,planning,'2026-11-14T00:00:00Z');
test('month cells align Monday first with real leading/trailing dates and leap day',()=>{
 assert.equal(monthDates('2026-11-14')[0],'2026-10-26');assert.equal(monthDates('2026-11-14')[6],'2026-11-01');
 assert.equal(monthDates('2028-02-02').length,42);assert.ok(monthDates('2028-02-02').includes('2028-02-29'));assert.throws(()=>monthDates('2027-02-29'));
});
test('navigation clamps month ends rather than skipping a month',()=>{
 assert.equal(navigateDate('2028-01-31','Month',1),'2028-02-29');assert.equal(navigateDate('2028-02-29','Year',1),'2029-02-28');assert.equal(navigateDate('2026-11-16','Week',-1),'2026-11-09');
 assert.equal(navigateDate('2026-11-16','3-Year',1),'2029-11-16');assert.equal(navigateDate('2027-03-01','Semester',1,seed().semesters),'2027-09-01');assert.equal(navigateDate('2027-03-01','Semester',-1,seed().semesters),'2027-01-31');
});
test('past dates show actual attempts, never future allocation simulations',()=>{
 let s=seed();s=recordOutcome(s,{id:'past',taskId:'ila-311',day:'2026-11-10',minutes:25,outcome:'partial',note:'A retained note'});
 const before=structuredClone(s),rows=calendarRows(s,'2026-11-14','2026-11-09','2026-11-15',catalog);
 assert.equal(rows[1].band,'actual');assert.equal(rows[1].minutes,25);assert.equal(rows[0].minutes,0);assert.equal(rows[1].task,null);assert.deepEqual(s,before);
 const html=renderCalendarView(s,'2026-11-14','Day',catalog,'2026-11-10');assert.match(html,/A retained note/);assert.match(html,/RECORDED HISTORY/);
});
test('calendar can select October 2028 and June 2029 with provisional source provenance',()=>{
 const s=seed();for(const d of ['2028-10-03','2029-06-20']){const html=renderCalendarView(s,'2026-11-14','Month',catalog,d);assert.ok(html.includes(`value="${d}"`));assert.match(html,/PROVISIONAL/);assert.match(html,/Selected date details/);}
 const html=renderCalendarView(s,'2026-11-14','3-Year',catalog);assert.equal((html.match(/class="calendar-month compact-month"/g)||[]).length,34);assert.ok(html.includes('data-calendar-month="2028-10-01"'));assert.ok(html.includes('data-calendar-date="2029-06-30"'));assert.ok(!html.includes('semester-projection'));
});
test('certainty is anchored to Today even when browsing far ahead; cache never mutates history',()=>{
 const s=seed(),before=structuredClone(s);const rows=calendarRows(s,'2026-11-14','2026-11-14','2029-06-30',catalog);
 assert.equal(rows[13].band,'actionable');assert.equal(rows[14].band,'tentative');assert.equal(rows[41].band,'tentative');assert.equal(rows[42].band,'scenario');
 assert.equal(calendarRows(s,'2026-11-14','2028-10-01','2028-10-31',catalog)[0].band,'scenario');assert.deepEqual(s,before);assert.equal(completed(s).size,0);
});
test('legacy seed tasks inherit catalog semester placement',()=>{const s=seed();assert.equal(s.tasks.find(t=>t.id==='ila-5-1').semester,2);assert.equal(s.units.find(u=>u.id==='legacy:ila-5-1').semester,2);assert.equal(s.tasks.find(t=>t.id==='ila-311').semester,1);});
test('semester tabs open a resource contents view without a hidden task list',()=>{
 let s=seed();s=addLocalTask(s,{...s.tasks[0],id:'future',resource:'S3 synthetic module',heading:'Future module',semester:3,prerequisites:[]});
 const html=renderCurriculumView(s,{catalog,semester:'3'});assert.match(html,/data-semester-select="3" aria-selected="true"/);assert.match(html,/data-resource-view="local:s3-synthetic-module"/);assert.ok(!html.includes('Matrices as Functions'));assert.ok(!html.includes('resource-group'));
 const detail=renderCurriculumView(s,{catalog,semester:'3',resourceDetail:'local:s3-synthetic-module'});assert.match(detail,/Future module/);assert.match(detail,/Source units and staged tasks/);
});
test('study log groups three partials into 75 minutes, retains notes and appended corrections',()=>{
 let s=seed();for(let i=0;i<3;i++)s=recordOutcome(s,{id:'part-'+i,taskId:'ila-311',day:'2026-11-16',minutes:25,outcome:'partial',note:'Note '+i,remainingMinutes:i===2?200:120});
 const before=structuredClone(s),groups=groupAttempts(s);assert.equal(groups.length,1);assert.equal(groups[0].minutes,75);assert.equal(groups[0].completed,false);
 const html=renderHistoryView(s);assert.match(html,/3 retained attempts · 75 active min/);for(let i=0;i<3;i++)assert.ok(html.includes('Note '+i));assert.deepEqual(s,before);
 s.events.push({id:'correct',type:'void',target:'part-1'});assert.equal(groupAttempts(s)[0].minutes,50);assert.equal(groupAttempts(s)[0].attempts.length,3);assert.match(renderHistoryView(s),/original retained/);
});
test('edition corrections are staged separately and preserve legacy source IDs and events',()=>{
 let s=seed();s=addLocalTask(s,{...s.tasks[0],id:'old-python',resource:'VanderPlas — Python Data Science Handbook',heading:'Legacy NumPy heading',semester:2,prerequisites:[]});s=recordOutcome(s,{id:'old-done',taskId:'old-python',day:'2026-11-14',minutes:30,outcome:'completed'});
 const before=structuredClone(s.events),old=structuredClone(s.tasks.at(-1));s=applyImport(s,catalog,previewImport(s,catalog).rows.filter(r=>r.kind==='add').map(r=>r.unit.id));
 assert.deepEqual(s.events,before);assert.deepEqual(s.tasks.find(t=>t.id==='old-python'),old);
 const pandas=s.tasks.filter(t=>t.resourceId==='vanderplas-2e'&&t.section.startsWith('Part III'));assert.equal(pandas.length,12);assert.ok(pandas.every(t=>t.status==='draft'&&!t.reviewed));
 assert.equal(s.tasks.find(t=>t.resourceId==='wasserman').branch,'selective_reference');
});
test('calendar and log escape imported labels, notes and IDs',()=>{
 let s=seed();s=recordOutcome(s,{id:'quoted"id',taskId:'ila-311',day:'2026-11-16',minutes:1,outcome:'partial',note:'<img src=x onerror=alert(1)>'});
 assert.ok(!renderHistoryView(s).includes('<img'));assert.match(renderHistoryView(s),/quoted&quot;id/);assert.ok(!renderCalendarView(s,'2026-11-17','Day',catalog,'2026-11-16').includes('<img'));
});
