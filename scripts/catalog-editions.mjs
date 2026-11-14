// Public edition corrections only. Never remap stored user unit IDs or attempts.
export function correctEditions(bundle) {
 const next=structuredClone(bundle),pythonURL='https://www.oreilly.com/library/view/python-data-science/9781098121211/';
 next.units=next.units.filter(u=>!['vanderplas:ch-2','vanderplas:ch-4'].includes(u.id));
 next.resources=next.resources.filter(r=>!['vanderplas-2e','wasserman'].includes(r.id));
 next.resources.push({id:'vanderplas-2e',name:'VanderPlas — Python Data Science Handbook (2nd edition)',edition:'Second edition, December 2022',url:pythonURL,source:'Publisher contents checked 2026-11-14',semesters:[2],priority:2,enabled:true},
 {id:'wasserman',name:'Wasserman — All of Statistics',edition:'2004',url:'https://stat.cmu.edu/~larry/all-of-statistics/index.html',source:'Author and publisher; selective reference only',semesters:[3],priority:3,enabled:true});
 const unit=(id,resourceId,unitRef,heading,extra={})=>({id,resourceId,unitRef,heading,semester:2,activity:'Authored practice: reproduce one relevant example, then explain the result without the source.',completionEvidence:'A checked worked example and an explanation of its assumptions.',estimatedMinutes:60,priority:'P2',track:'independent',kind:'reading',link:pythonURL,dependencies:[],preferredDays:[4],sourceProvenance:'Publisher contents, second edition; checked 2026-11-14. Actions and effort authored.',headingConfidence:'verified_heading',branch:null,...extra});
 const chapters=['Introducing Pandas Objects','Data Indexing and Selection','Operating on Data in Pandas','Handling Missing Data','Hierarchical Indexing','Combining Datasets: concat and append','Combining Datasets: merge and join','Aggregation and Grouping','Pivot Tables','Vectorized String Operations','Working with Time Series','High-Performance Pandas: eval and query'];
 const additions=[unit('vanderplas-2e:part-ii','vanderplas-2e','Part II · Chapters 4–12','Introduction to NumPy',{estimatedMinutes:120}),
 ...chapters.map((heading,i)=>unit('vanderplas-2e:ch-'+(13+i),'vanderplas-2e','Part III · Chapter '+(13+i),heading,{dependencies:i?['vanderplas-2e:ch-'+(12+i)]:[]})),
 unit('vanderplas-2e:part-iv','vanderplas-2e','Part IV · Chapters 25–36','Visualization with Matplotlib',{estimatedMinutes:120}),
 unit('wasserman:selective-reference','wasserman','Selective reference · choose a section when needed','Statistical inference gaps — user-selected reference',{semester:3,priority:'P3',kind:'reference',link:'https://stat.cmu.edu/~larry/all-of-statistics/index.html',branch:'selective_reference',activity:'Authored reference task: identify one inference gap in current ML work, choose a relevant section, and record the section used.',headingConfidence:'authored_scope_not_section_heading',sourceProvenance:'Author book page and Springer book overview; no fine-grained section claimed.'})];
 const ids=new Set(additions.map(u=>u.id));next.units=next.units.filter(u=>!ids.has(u.id)).concat(additions);
 next.version='research-v2-edition-corrections';return next;
}
