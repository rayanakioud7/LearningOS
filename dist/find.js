const fold = value => String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();

// Searching only builds destinations. It never stages a unit or changes progress.
export function findInPlan(state, catalog, query = '', limit = 9) {
  const term = fold(query).trim();
  const words = term.split(/\s+/).filter(Boolean);
  const resources = new Map([...(catalog?.resources || []), ...(state.resources || [])].map(r => [r.id, r]));
  const voided = new Set(state.events.filter(e => e.type === 'void').map(e => e.target));
  const done = new Set(state.events.filter(e => e.type === 'session' && e.outcome === 'completed' && !voided.has(e.id)).map(e => e.taskId));
  const entries = [];
  const route = (resource, search = '') => ({view:'roadmap', curriculumResource:resource, search, filter:'all'});
  for (const r of resources.values()) entries.push({key:'resource:'+r.id, kind:'Resource', title:r.name, detail:r.edition || 'Browse chapters and tasks', text:r.name+' '+(r.edition || ''), route:route(r.id), priority:1});
  const savedUnits = new Set();
  for (const t of state.tasks) {
    if (t.unitId) savedUnits.add(t.unitId);
    const status = done.has(t.id) ? 'Completed' : t.archived ? 'Suspended' : t.status === 'active' ? 'Active task' : 'Needs review';
    entries.push({key:'task:'+t.id, kind:status, title:[t.section,t.heading].filter(Boolean).join(' · '), detail:t.resource, text:[t.resource,t.section,t.heading,t.action].join(' '), route:route(t.resourceId, t.heading), taskId:t.id, priority:status==='Active task'?4:0});
  }
  if (term) for (const u of catalog?.units || []) {
    if (savedUnits.has(u.id)) continue;
    const name=resources.get(u.resourceId)?.name || u.resourceId;
    entries.push({key:'unit:'+u.id, kind:'Available chapter', title:[u.unitRef,u.heading].filter(Boolean).join(' · '), detail:name, text:[name,u.unitRef,u.heading,u.activity].join(' '), route:route(u.resourceId,u.heading), priority:0});
  }
  return entries.filter(e => words.every(word => fold(e.text).includes(word)))
    .map(e => ({...e, score:e.priority+(term&&fold(e.title).includes(term)?12:0)+(term&&fold(e.title).startsWith(term)?8:0)}))
    .sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,undefined,{numeric:true}))
    .slice(0, Math.max(1,Math.min(30,limit)));
}
