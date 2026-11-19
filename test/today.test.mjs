import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderTodayView} from '../dist/today.js';
import {studyDate,validateBackup} from '../dist/engine.js';
import {migrateState} from '../dist/curriculum.js';
import {pinToday} from '../dist/planner.js';
import {toggleFocus} from '../dist/session.js';
import {prepareRestore,prepareTransfer} from '../dist/backup.js';
const seed=()=>JSON.parse(readFileSync(new URL('../dist/seed.json',import.meta.url)));
const readData=name=>JSON.parse(readFileSync(new URL('../dist/'+name+'.json',import.meta.url)));

test('Today and its pinned task move from Monday linear algebra to Tuesday calculus at 05:00 local time',()=>{
  const s=migrateState(seed(),readData('catalog'),readData('planning'));
  const zone='Asia/Tokyo';
  for(const time of ['2026-11-16T14:59:59Z','2026-11-16T15:00:00Z','2026-11-16T17:00:00Z','2026-11-16T19:59:59Z']){
    const day=studyDate(new Date(time),zone);
    assert.equal(day,'2026-11-16');
    const pinned=pinToday(s,day);
    assert.equal(pinned.pinnedDay.taskId,'ila-311');
    assert.match(renderTodayView(pinned,day),/<h1>Matrices as Functions<\/h1>/);
  }
  const day=studyDate(new Date('2026-11-16T20:00:00Z'),zone);
  assert.equal(day,'2026-11-17');
  assert.match(renderTodayView(pinToday(s,day),day),/MIT 18\.02SC/);
});

test('a focus session keeps its original study day across resume, backup, and the next day’s pin',()=>{
  const s=migrateState(seed(),readData('catalog'),readData('planning'));
  const monday='2026-11-16',tuesday='2026-11-17';
  const start=Date.parse('2026-11-17T04:59:00Z'),afterCutoff=Date.parse('2026-11-17T05:01:00Z');
  const active=toggleFocus(s,studyDate(new Date(start),'UTC'),{id:'overnight',now:start});
  const restored=prepareRestore(prepareTransfer(active,afterCutoff),s.revision,afterCutoff);
  const next=pinToday(toggleFocus(restored,tuesday,{now:afterCutoff}),tuesday);
  assert.equal(next.timer.day,monday);
  assert.equal(next.timer.taskId,'ila-311');
  assert.equal(next.pinnedDay.day,tuesday);
  assert.notEqual(next.pinnedDay.taskId,next.timer.taskId);
  const html=renderTodayView(next,tuesday);
  assert.match(html,/<div class="focus-date">Monday,? 16 November<\/div>/);
  assert.match(html,/<h1>Matrices as Functions<\/h1>/);

  next.timer.day='2026-02-30';
  assert.throws(()=>validateBackup(next),/Invalid saved focus timer/);
  delete next.timer.day;
  assert.doesNotThrow(()=>validateBackup(next));
});
test('a persisted session stays visible when academic protection changes the recommendation',()=>{
  const s=seed();s.settings.examMode='on';s.timer={taskId:'ila-311',running:true,targetMinutes:25};
  const html=renderTodayView(s,'2026-11-16');
  assert.match(html,/<h1>Matrices as Functions<\/h1>/);assert.match(html,/>Pause<\/button>/);assert.match(html,/data-outcome="completed" >/);
});
test('a future study task cannot be completed from Today before it is made current',()=>{
  const html=renderTodayView(seed(),'2026-11-14');
  assert.match(html,/data-action="early"/);assert.match(html,/Monday/);
  for(const outcome of ['completed','partial','ensam','skipped'])assert.ok(html.includes(`data-outcome="${outcome}" disabled`));
});
test('Today treats imported source headings and URLs as data, not executable markup',()=>{
  const s=seed();s.tasks[0].heading='<img src=x onerror=alert(1)>';s.tasks[0].url='javascript:alert(1)';
  const html=renderTodayView(s,'2026-11-16');
  assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('javascript:'));
});
test('the extracted Today module is part of the offline app shell',()=>{
  const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  assert.match(sw,/'\.\/today\.js'/);assert.ok(readFileSync(new URL('../dist/today.js',import.meta.url)).length>0);
});
