// The roadmap layer turns dates into phases and weekly templates. It never
// assigns a specific chapter to a specific day: blocks are timeboxes and the
// scheduler still picks the next ready unit dynamically, which keeps the
// finish-early → pull-next → re-plan behavior intact.
export function weekdayOf(day){return new Date(day+'T12:00:00Z').getUTCDay();}
export function phaseFor(s,day){
  const phases=s.planning?.phases;
  if(!Array.isArray(phases))return null;
  return phases.find(p=>p.start<=day&&day<=p.end)||null;
}
export function weeklyCeiling(s,day){
  const p=phaseFor(s,day);
  const phaseCap=p&&Number.isFinite(p.weeklyIndependentMinutes)?p.weeklyIndependentMinutes:Infinity;
  return Math.min(phaseCap,s.settings?.weeklyMinutes??480);
}
export function dailyIndependentCap(s,day){
  const p=phaseFor(s,day);
  if(p){
    const wd=weekdayOf(day);
    return wd===6?(p.saturdayMinutes??0):(p.dailyIndependentMinutes??0);
  }
  const settings=s.settings||{};
  return weekdayOf(day)===6?settings.saturdayMinutes??180:settings.dailyMinutes??90;
}
export function blockPlan(s,day){
  const p=phaseFor(s,day);
  if(!p)return null;
  const blocks=(s.planning?.weeklyBlocks||{})[p.id];
  if(!blocks)return null;
  const dayBlocks=blocks[weekdayOf(day)];
  if(!Array.isArray(dayBlocks)||!dayBlocks.length)return null;
  return dayBlocks.map((b,i)=>({resources:[...b.resources],minutes:b.minutes??0,kind:i===0?'primary':'secondary'}));
}
export function phaseLabel(p){return p?`${p.id} (${p.mode})`:'—';}
