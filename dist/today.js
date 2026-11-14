import {dailyChoice,forecast,dayRule,deadlineRisks} from './engine.js';
const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function sourceURL(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}}
function dateLabel(day,options={weekday:'long',day:'numeric',month:'long'}){return new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',...options}).format(new Date(day+'T12:00:00Z'));}
export function renderTodayView(state,day){
  const choice=dailyChoice(state,day),rule=dayRule(state,day),upcoming=forecast(state,day,14).find(p=>p.task);
  const timerTask=state.timer&&state.tasks.find(t=>t.id===state.timer.taskId);
  const task=timerTask||choice.task||upcoming?.task;
  const future=Boolean(!timerTask&&!choice.task&&upcoming?.task),scheduled=future?upcoming.day:day;
  const canEarly=Boolean(future&&task?.notBefore>day&&rule.kind==='normal');
  const breaking=state.breakUntil>Date.now(),source=sourceURL(task?.url);
  const warning=deadlineRisks(state,day).length>0;
  const protection=rule.kind!=='normal'?`<div class="quiet-notice"><p>${escape(rule.reason)}</p><button class="text-button" data-action="availability">Adjust today</button></div>`:'';
  const breakNotice=breaking?`<div class="quiet-notice"><p>Take a break <span id="break-countdown" aria-live="off"></span></p><button class="text-button" data-action="end-break">End break</button></div>`:'';
  return `<section class="quiet-focus" aria-label="Today’s study session">
    <div class="focus-date">${escape(dateLabel(day))}</div>
    ${warning?'<div class="quiet-notice"><p>A required deadline needs attention.</p><button class="text-button" data-view="calendar">Review</button></div>':''}
    ${protection}${breakNotice}
    ${task?`<div class="quiet-task">
      <p class="focus-resource">${escape(task.resource)} <span>·</span> ${escape(task.section)}</p>
      <h1>${escape(task.heading)}</h1>
      <p class="focus-action">${escape(task.action)}</p>
      ${future?`<p class="planned-date">Planned for ${escape(dateLabel(scheduled,{weekday:'long',day:'numeric',month:'short'}))}</p>`:''}
    </div>
    <div class="quiet-clock" role="timer" aria-label="Focus time remaining"><span id="timer-value">${String(state.settings.focusMinutes).padStart(2,'0')}:00</span><span id="timer-label">${state.settings.focusMinutes} MIN FOCUS</span></div>
    <div class="timer-controls"><button class="primary focus-start" data-action="${future?'early':'timer'}" ${breaking||(future&&!canEarly)?'disabled':''}>${future?(canEarly?'Begin early':'Planned session'):state.timer?.running?'Pause':state.timer?'Resume':'Start focus'}</button></div>
    <div class="quiet-outcomes"><p>How did it go?</p><div class="outcome-shortcuts" aria-label="Session outcome">${[['completed','Completed'],['partial','Partial'],['ensam','ENSAM priority'],['skipped','Skipped']].map(([value,label])=>`<button data-outcome="${value}" ${future?'disabled':''}>${label}</button>`).join('')}</div></div>
    <div class="quiet-links">${source?`<a href="${escape(source)}" target="_blank" rel="noopener noreferrer">Open source ↗</a>`:''}<button class="text-button" data-edit="${escape(task.id)}">Edit task</button><button class="text-button" data-action="availability">Change today</button></div>
    <details class="focus-details"><summary>Session details</summary><div><p class="detail-label">Done when</p><p>${escape(task.evidence)}</p><p class="detail-meta">${escape(task.minutes)} minutes · estimated effort</p></div></details>`:
    `<div class="quiet-empty"><h1>Nothing to rush.</h1><p>${escape(choice.blocked||'Your next step is safe. Rest, or add the coursework you need to handle.')}</p><button class="secondary" data-action="new">Add ENSAM task</button><button class="text-button" data-action="availability">Change today</button></div>`}
  </section>`;
}
