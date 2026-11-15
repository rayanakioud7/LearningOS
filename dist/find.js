import {foldSearch as fold,matchesSearch,resourceSearchText} from './search.js';

// Searching only builds destinations. It never stages a unit or changes progress.
export function findInPlan(state, catalog, query = '', limit = 9) {
  const term = fold(query).trim();
  
  const resources = new Map([...(catalog?.resources || []), ...(state.resources || [])].map(r => [r.id, r]));
  const voided = new Set(state.events.filter(e => e.type === 'void').map(e => e.target));
  const done = new Set(state.events.filter(e => e.type === 'session' && e.outcome === 'completed' && !voided.has(e.id)).map(e => e.taskId));
  const entries = [];
  const route = (resource, search = '') => ({view:'roadmap', curriculumResource:resource, search, filter:'all'});
  for (const r of resources.values()) entries.push({key:'resource:'+r.id, kind:'Resource', title:r.name, detail:r.edition || 'Browse chapters and tasks', text:resourceSearchText(r), route:route(r.id), priority:1});
  const savedUnits = new Set();
  const savedRefs=new Set(state.tasks.map(t=>t.resourceId+'|'+fold(t.section).replace(/\s+/g,'')));
  for (const t of state.tasks) {
    if (t.unitId) savedUnits.add(t.unitId);
    const status = done.has(t.id) ? 'Completed' : t.archived ? 'Suspended' : t.status === 'active' ? 'Active task' : 'Needs review';
    entries.push({key:'task:'+t.id, kind:status, title:[t.section,t.heading].filter(Boolean).join(' · '), detail:t.resource, text:[resourceSearchText(resources.get(t.resourceId)),t.resource,t.section,t.heading,t.action].join(' '), route:route(t.resourceId, t.heading), taskId:t.id, priority:status==='Active task'?4:0});
  }
  if (term) for (const u of catalog?.units || []) {
    if (savedUnits.has(u.id)||savedRefs.has(u.resourceId+'|'+fold(u.unitRef).replace(/\s+/g,''))) continue;
    const name=resources.get(u.resourceId)?.name || u.resourceId;
    entries.push({key:'unit:'+u.id, kind:'Available chapter', title:[u.unitRef,u.heading].filter(Boolean).join(' · '), detail:name, text:[resourceSearchText(resources.get(u.resourceId)),name,u.unitRef,u.heading,u.activity].join(' '), route:route(u.resourceId,u.heading), priority:0});
  }
  return entries.filter(e => matchesSearch(e.text,query))
    .map(e => ({...e, score:e.priority+(term&&fold(e.title).includes(term)?12:0)+(term&&fold(e.title).startsWith(term)?8:0)}))
    .sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,undefined,{numeric:true}))
    .slice(0, Math.max(1,Math.min(30,limit)));
}
