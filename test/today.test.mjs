import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderTodayView} from '../dist/today.js';
const seed=()=>JSON.parse(readFileSync(new URL('../dist/seed.json',import.meta.url)));
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
