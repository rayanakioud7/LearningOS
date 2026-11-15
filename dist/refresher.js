import {activeAttempts} from './effort.js';
import {dailyChoice} from './engine.js';
import {toggleFocus} from './session.js';
import {refresherQuestions} from './refresher-questions.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=s=>[...s].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
const safeURL=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
export function chooseRefresher(s,target,day){
 if(!target||s.timer||s.settings.preSessionRefreshers===false||(s.refresherVisits||[]).some(v=>v.day===day&&v.taskId===target.id))return null;
 const tasks=new Map(s.tasks.map(t=>[t.id,t])),seen=new Set(),sources=[];
 for(const e of activeAttempts(s).filter(e=>e.outcome==='completed'&&e.day<=day).reverse()){
  const t=tasks.get(e.taskId),source=e.taskSnapshot||t,resourceId=source?.resourceId||source?.resourceSnapshot?.id||t?.resourceId;
  if(!t||t.archived||t.referenceOnly||seen.has(t.id)||resourceId!==target.resourceId&&!(target.prerequisites||[]).includes(t.id))continue;
  seen.add(t.id);
  sources.push({taskId:t.id,resourceId,resource:source.resource||t.resource,section:source.section||t.section,heading:source.heading||t.heading,url:source.url||t.url,origin:'Completed study task',prerequisite:(target.prerequisites||[]).includes(t.id)});
 }
 sources.sort((a,b)=>Number(b.prerequisite)-Number(a.prerequisite));
 // This checkpoint records examples practiced, not an assumed chapter completion.
 const checkpoint=s.checkpoints?.find(c=>target.resourceId==='ila'&&c.resource==='ILA'&&c.confirmed_at<=day&&/§2\.9.*examples completed/i.test(c.last_demonstrated||''));
 if(checkpoint)sources.push({taskId:null,resourceId:'ila',resource:'Interactive Linear Algebra',section:'§2.9',heading:'The Rank Theorem',url:'https://textbooks.math.gatech.edu/ila/rank-thm.html',origin:'Starting checkpoint · examples practiced'});
 for(const source of sources){
  const options=refresherQuestions.filter(q=>q.resources.includes(source.resourceId)&&q.match.test(source.section+' '+source.heading));
  if(options.length)return {...options[hash(day+'|'+target.id)%options.length],source};
 }
 return null;
}
export function startAfterRefresher(s,day,targetId,questionId,{id,now=Date.now()}={}){
 const target=dailyChoice(s,day).task,question=chooseRefresher(s,target,day);
 if(s.timer||target?.id!==targetId||question?.id!==questionId)throw Error('Your session changed. Start the current task again.');
 const next=toggleFocus(s,day,{id,now});
 next.refresherVisits=[...(s.refresherVisits||[]).filter(v=>v.day<=day),{day,taskId:targetId,questionId}].slice(-200);
 return next;
}
export function renderRefresher(q){
 const source=q.source,url=safeURL(source.url);
 return `<p class="eyebrow">OPTIONAL · ABOUT A MINUTE</p><h2>Quick refresher</h2><p class="small muted">${esc(source.origin)} · ${esc(source.resource)} ${esc(source.section)} · ${esc(source.heading)}</p><p>${esc(q.prompt)}</p><details class="editor-source"><summary>Show answer</summary><p>${esc(q.answer)}</p></details><p class="small muted">App-authored recall prompt. Your focus timer starts when you continue.</p><div class="button-row">${url?`<a class="text-button" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a>`:''}<button class="text-button" id="refresher-copy">Copy for my LLM</button></div><div class="dialog-actions"><button class="text-button" data-close>Cancel</button><button class="secondary" id="refresher-skip">Skip & start</button><button class="primary" id="refresher-start">Start focus</button></div>`;
}
export function refresherLLMContext(q,target){
 return `Give me brief practice, one question at a time, within this scope.\nPreviously studied: ${q.source.resource} ${q.source.section} — ${q.source.heading}.\nWarm-up question: ${q.prompt}\nNext topic: ${target.resource} ${target.section} — ${target.heading}.\nWait for my answer before explaining it.`;
}
