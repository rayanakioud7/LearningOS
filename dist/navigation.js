import {isCivilDate} from './validation.js';
export const VIEWS=['today','calendar','roadmap','history','settings'];
export const CALENDAR_MODES=['Day','Week','Month','Year','3-Year','42 days','Semester'];
export function parseNavigation(hash=''){
 const [path,query='']=String(hash).replace(/^#/,'').split('?'),p=new URLSearchParams(query);
 return {view:VIEWS.includes(path)?path:'today',calendarMode:CALENDAR_MODES.includes(p.get('mode'))?p.get('mode'):'Month',calendarStart:isCivilDate(p.get('date'))&&p.get('date')<='2029-06-30'?p.get('date'):'',semesterFilter:/^[1-6]$/.test(p.get('semester'))?p.get('semester'):'',curriculumResource:p.get('resource')||'',filter:['active','draft','completed','suspended','catalog','all'].includes(p.get('status'))?p.get('status'):'all',search:p.get('q')||'',historySearch:p.get('q')||'',historyMonth:/^\d{4}-(0[1-9]|1[0-2])$/.test(p.get('month'))?p.get('month'):'',historyPage:Math.max(0,Math.min(10000,Math.floor(Number(p.get('page')))||0))};
}
export function navigationHash(route){
 const p=new URLSearchParams(),view=VIEWS.includes(route.view)?route.view:'today';
 if(view==='calendar'){if(route.calendarStart)p.set('date',route.calendarStart);if(route.calendarMode&&route.calendarMode!=='Month')p.set('mode',route.calendarMode);}
 if(view==='roadmap'){if(route.semesterFilter)p.set('semester',route.semesterFilter);if(route.curriculumResource)p.set('resource',route.curriculumResource);if(route.filter&&route.filter!=='all')p.set('status',route.filter);if(route.search)p.set('q',route.search);}
 if(view==='history'){if(route.historySearch)p.set('q',route.historySearch);if(route.historyMonth)p.set('month',route.historyMonth);if(route.historyPage)p.set('page',String(route.historyPage));}
 return '#'+view+(p.size?'?'+p:'');
}
