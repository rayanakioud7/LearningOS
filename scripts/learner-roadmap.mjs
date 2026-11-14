// Learner's 14 November 2026 roadmap. Study windows are independent-plan
// dates, separate from the university's academic envelopes and exam notices.
const urls={
 ila:'https://textbooks.math.gatech.edu/ila/',mit:'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/3.-double-integrals-and-line-integrals-in-the-plane/',
 git:'https://missing.csail.mit.edu/2026/version-control/',svd:'https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/positive-definite-matrices-and-applications/singular-value-decomposition/',
 stat:'https://stat110.hsites.harvard.edu/youtube',cs229:'https://cs229.stanford.edu/syllabus-autumn2018.html',cs229video:'https://youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU',
 geron:'https://github.com/ageron/handson-mlp',udl:'https://github.com/udlbook/udlbook',huang:'https://github.com/deep-learning-with-pytorch/dlwpt-code-2e',pytorch:'https://docs.pytorch.org/tutorials/',
 karpathy:'https://karpathy.ai/zero-to-hero.html',gpu:'https://github.com/gpu-mode/lectures',cmu:'https://dlsyscourse.org/lectures/',raschka:'https://github.com/rasbt/LLMs-from-scratch',
 hf:'https://huggingface.co/learn/llm-course/chapter1/1',transformers:'https://huggingface.co/docs/transformers/index',cs336:'https://cs336.stanford.edu/',fsdl:'https://fullstackdeeplearning.com/course/2022/'
};
const block=(id,title,resources,min,max,description,doneWhen,extra={})=>({id,title,resources,minutes:min,maxMinutes:max,minMinutes:min,description,doneWhen,track:'independent',...extra});
const academic=(id,title,min=60,max=90,description='Current ENSAM TD/TP or project first.',doneWhen='Course deliverable checked.')=>block(id,title,['ensam'],min,max,description,doneWhen,{track:'academic'});
const rest=block('recovery','Full recovery',[],0,0,'Sunday is off. No catch-up debt.','Rest.',{track:'rest'});
const overflow=academic('overflow','ENSAM overflow / exams, otherwise rest',0,60,'Use only for real ENSAM backlog or exam preparation; otherwise rest.','Backlog reduced.');
const week=days=>({0:[rest],5:[overflow],...days});
const svd={id:'svd',title:'Strang Lecture 29 — SVD (targeted supplement)',resources:['svd'],requires:['linear-foundations'],url:urls.svd,description:'Use only after eigenvalues, orthogonality, projections and least squares; no restart of Strang.'};
const git={id:'git',title:'Missing Semester: Git, integrated into this lab',resources:['missing'],url:urls.git,description:'Branch/merge conflict and clean-clone practice inside lab time; no extra hours.'};
const karpathy={id:'karpathy',title:'One Karpathy lecture to unblock current work',resources:['karpathy'],url:urls.karpathy,description:'Replace this block only when needed; return to the primary resource.'};
const gpu={id:'gpu',title:'GPU MODE: one profiling / memory-hierarchy lesson',resources:['gpu-mode'],url:urls.gpu,maxPerMonth:1,description:'At most one Thursday per calendar month; replaces synthesis, adds no hours.'};
export const gates=[
 {id:'s1-project',phase:'S1',title:'C dynamic array/list and BFS/DFS; passing tests, clean memory checks, Git branch/merge conflict, reproducible clean clone. ENSAM work counts when it demonstrates the skill.'},
 {id:'linear-foundations',phase:'S2',title:'Eigenvalues, orthogonality, projections and least squares demonstrated before the SVD supplement.'},
 {id:'svd',phase:'S2',title:'SVD understood and checked before PCA.'},
 {id:'s2-project',phase:'S2',title:'Broadcasting/vectorization; least squares compared with np.linalg.lstsq; gradient checks; probability simulation with uncertainty explained.'},
 {id:'ml-evaluation',phase:'S3',title:'Evaluation gate: protected test set, train/validation split, preprocessing and leakage checks before micrograd.'},
 {id:'s3-project',phase:'S3',title:'Linear/logistic regression from scratch; fair scikit-learn comparison; metrics, leakage checks and failed approaches reported.'},
 {id:'pretrained-baseline',phase:'S5',title:'A reproducible pretrained-model baseline is evaluated before optional GPU MODE or CS336 support.'},
 {id:'cpu-correctness',phase:'S5',title:'CPU implementation and tests establish correctness before kernel work.'},
 {id:'measured-bottleneck',phase:'S5',title:'Profiling identifies a measured bottleneck before GPU kernel implementation.'},
 {id:'capstone',phase:'S5',title:'Dataset/splits/permissions, baseline, tests, 2–3 ablations, measured bottleneck, documented limitation and readable README.'}
];
export const phases=[
 {id:'S1',semester:1,title:'Foundations and C memory',start:'2026-11-14',end:'2026-12-31',mode:'teaching',weeklyIndependentMinutes:480},
 {id:'Winter',semester:1,title:'ENSAM exams, recovery and transition',start:'2027-01-01',end:'2027-02-28',mode:'academic',weeklyIndependentMinutes:0},
 {id:'S2',semester:2,title:'Probability and numerical computing',start:'2027-03-01',end:'2027-06-30',mode:'teaching',weeklyIndependentMinutes:480},
 {id:'Summer1',semester:2,title:'Repair and polish',start:'2027-07-01',end:'2027-08-31',mode:'summer',optional:true,weeklyIndependentMinutes:780,weeklyRangeMinutes:[720,900]},
 {id:'S3',semester:3,title:'Classical machine learning',start:'2027-09-01',end:'2028-01-31',mode:'teaching',weeklyIndependentMinutes:480},
 {id:'S4',semester:4,title:'Deep-learning theory + PyTorch + MiniTorch',start:'2028-02-01',end:'2028-06-30',mode:'teaching',weeklyIndependentMinutes:480},
 {id:'Summer2',semester:4,title:'MiniTorch and paper reproduction',start:'2028-07-01',end:'2028-08-31',mode:'summer',weeklyIndependentMinutes:780},
 {id:'S5',semester:5,title:'Transformers, LLMs and ONE ML-systems specialization',start:'2028-09-01',end:'2029-01-31',mode:'teaching',weeklyIndependentMinutes:480},
 {id:'S6',semester:6,title:'PFE',start:'2029-02-01',end:'2029-06-30',mode:'pfe',weeklyIndependentMinutes:0}
];
export const weeklyBlocks={
 S1:week({
  1:[block('ila-s1','Interactive Linear Algebra',['ila'],90,120,'Resume at the last solved exercise: one section + 2–4 problems, then a small NumPy check. Do not restart with Strang.','Problems solved and checked.',{links:[{title:'Interactive Linear Algebra',url:urls.ila}]})],
  2:[block('calculus-trial','MIT 18.02SC · Unit 3, Part A — Double Integrals',['mit1802'],60,90,'Two-week trial against Stewart Chapter 15: lecture/recitation AND exercise. Review the trial before continuing.','One problem set solved without notes.',{trialReviewDate:'2026-12-01',scope:'mit-double-integrals',links:[{title:'MIT double integrals',url:urls.mit}]})],
  3:[academic('ensam-s1','ENSAM — current TD/TP',60,90,'Work the current TD/TP. Goodrich/NeetCode only if there is no ENSAM work; exams come first.','One tested class function.')],
  4:[block('proofs','Velleman · 1–2 proofs',['velleman'],60,90,'Odd ISO weeks: resume near Chapter 3.4 and write 1–2 proofs.','Written proof.',{weekParity:'odd'}),{...academic('ensam-thursday','ENSAM',60,90,'Even ISO weeks: current ENSAM work.','Runnable query or checked experiment.'),weekParity:'even'}],
  6:[block('c-lab',"Builder’s Lab · C memory / MiniTorch-in-C",['builder'],180,240,'Integrate pointer/ownership practice with C dynamic arrays/lists and BFS/DFS. Missing Semester Git belongs inside this lab.','Tests + sanitizer checks + commit.',{supports:[git],scope:'s1-builder'})]
 }),
 Winter:week(Object.fromEntries([1,2,3,4,6].map(d=>[d,[academic('transition','ENSAM exams / recovery / transition',0,d===6?180:90,'No new independent track is prescribed for January–February. Follow actual ENSAM requirements, exam windows and recovery.','Current university work or recovery.')]]))),
 S2:week({
  1:[block('ila-s2','ILA · eigenvalues, orthogonality, projections, least squares',['ila'],90,120,'One hand problem and a NumPy validation. Add the targeted SVD supplement only after these foundations.','Hand problem + NumPy validation.',{supports:[svd]})],
  2:[block('probability','Harvard Stat 110 + Blitzstein problems',['stat110'],90,90,'One to three lectures depending on energy, plus 1–2 Blitzstein problems within the same timebox.','Solved probability exercises.',{maxUnits:3,links:[{title:'Stat 110 lectures',url:urls.stat}]})],
  3:[academic('ensam-s2','ENSAM · Java/web, automation, statistics or math-for-CS',60,90,'Required exercises plus one engineering improvement.','TP or tested simulation.')],
  4:[block('numerical-practice','VanderPlas · NumPy / pandas / Matplotlib',['vanderplas-2e','vanderplas'],60,90,'Alternate probability simulation with arrays/broadcasting/plots.','Theory vs simulation check.',{practiceAlternation:true})],
  6:[block('numerical-lab',"Numerical Builder’s Lab",['builder'],180,240,'Elimination → Monte Carlo → numerical gradient checks → least squares → PCA only after SVD.','Tests, plot and benchmark with settings.',{scope:'numerical-builder'})]
 }),
 Summer1:week({
  1:[block('finish-ila','Finish ILA; targeted SVD / PCA comparison',['ila'],120,120,'Repair gaps and finish ILA. Targeted Strang SVD only if needed; PCA after SVD.','Checked comparison.',{supports:[svd]})],
  2:[block('mml-part1','MML · Part I',['mml'],120,120,'Start Mathematics for Machine Learning Part I.','Worked mathematical example.',{scope:'mml-part1'})],
  3:[block('career','Internships, CV, portfolio and applications',['career'],120,120,'Use this time for internships, CV, portfolio and applications.','A concrete application or portfolio improvement.')],
  4:[block('python-craft','NumPy / Python craft',['vanderplas-2e','vanderplas'],120,120,'Python craft OR a head start on Géron Part I, within the same block.','Tested code or bounded Géron exercise.',{supports:[{id:'geron-headstart',title:'Géron Part I head start instead',resources:['geron'],url:urls.geron,scope:'geron-part1'}]})],
  6:[block('numerical-polish','Polish numerical repository + engineering report',['builder'],180,240,'Polish the numerical repo and write a 1–2-page engineering report.','Reproducible repo and report.',{scope:'summer1-builder',minutes:240})]
 }),
 S3:week({
  1:[block('math-clinic','Math clinic · one derivation for the current Géron topic',['cs229','mml'],60,90,'Use CS229 Autumn 2018 only for the topic Géron raised: lectures 1–9, 12–15 and the first half of 16. MML Part II is reference/deepening.','Derivation done on paper.',{scope:'math-clinic',requiresTopic:true,links:[{title:'CS229 syllabus',url:urls.cs229},{title:'CS229 lectures',url:urls.cs229video}]})],
  2:[block('geron-theory','Géron · 2025 PyTorch edition · Part I + Chapters 9–11',['geron'],90,120,'One bounded section and exercise; run a baseline and explain its assumptions.','Baseline runs; assumptions explained.',{scope:'geron-s3',links:[{title:'Official Géron notebooks',url:urls.geron}]})],
  3:[block('inference','Wasserman · Chapters 6–10, then ENSAM',['wasserman'],45,45,'Selected MLE, convergence and hypothesis-testing work from Chapters 6–10. Use the rest of the shared 60–90-minute block for ENSAM.','Selected inference exercise checked.',{scope:'wasserman-6-10',dayRange:[60,90]}),academic('ensam-after-inference','ENSAM after Wasserman',15,45,'Remaining time goes to current university work; confirmed urgency preempts the independent block.','Tested course artifact.')],
  4:[block('geron-code','Géron implementation day',['geron'],60,90,'Close the book; reproduce preprocessing/model/evaluation in code.','Leak-free, tested pipeline.',{scope:'geron-s3'})],
  5:[academic('ensam-s3','ENSAM · Advanced DB/cloud/Java/AI TP and projects',0,60)],
  6:[block('ml-lab',"ML Builder’s Lab",['builder'],180,240,'Baseline → train/validation/test → preprocessing → cross-validation → error analysis → model card. StatQuest may support relaxed understanding inside this time.','Reproducible 3–5-model comparison.',{scope:'ml-builder',supports:[{...karpathy,id:'micrograd',title:'Karpathy micrograd — only after the evaluation gate',requires:['ml-evaluation'],scope:'micrograd'}]})]
 }),
 S4:week({
  1:[block('udl-theory','Prince · Understanding Deep Learning',['udl'],90,120,'Bounded reading, equation shapes, hand derivation and one official UDL notebook.','Derivation + notebook with one changed variable.',{scope:'udl-foundations',links:[{title:'UDL notebooks',url:urls.udl}]})],
  2:[block('pytorch','Huang et al. · Deep Learning with PyTorch, 2nd ed.',['huang'],60,90,'Tensors, Dataset/DataLoader, autograd, train/eval loops and CNNs. Use official PyTorch tutorials for current APIs.','Tested reusable training component.',{links:[{title:'Huang companion code',url:urls.huang},{title:'PyTorch tutorials',url:urls.pytorch}]})],
  3:[academic('ensam-s4','ENSAM · applied ML, text mining, AR/VR, mobile/IoT',60,90,'Course TP/project first.','Course deliverable.')],
  4:[block('udl-synthesis','Prince synthesis · backpropagation / optimization',['udl'],60,90,'Derive and gradient-check. Replace with one Karpathy lecture as needed, or a profiling/memory lesson on at most one Thursday per month.','Gradient check or profiler result.',{scope:'udl-foundations',supports:[karpathy,gpu]})],
  6:[block('minitorch-lab',"MiniTorch-in-C Builder’s Lab",['builder'],180,240,'Tensor ownership → operators → computation graph → backward → gradient checks → optimizer/MLP. Every 2–3 labs, cross-check with Huang/PyTorch; selected CMU 10-414 only if needed.','C tests + sanitizer + loss plot.',{scope:'minitorch-builder',links:[{title:'Optional CMU autodiff support',url:urls.cmu}]})]
 }),
 Summer2:week({
  1:[block('minitorch-repair','MiniTorch · tests, documentation and benchmarks',['builder'],120,120,'Selected CMU 10-414 autograd lectures only when necessary.','Tested/documented component.',{scope:'minitorch-builder',links:[{title:'CMU 10-414',url:urls.cmu}]})],
  2:[block('minitorch-repair-2','MiniTorch · tests, documentation and benchmarks',['builder'],120,120,'Continue the measured MiniTorch repair work.','Benchmark with reproducible settings.',{scope:'minitorch-builder'})],
  3:[block('paper-reproduction','Reproduce one modest paper experiment',['paper'],120,120,'One paper, one modest experiment, measured report.','Experiment and measurements captured.')],
  4:[block('paper-report','Paper reproduction · measured report',['paper'],120,120,'Continue the SAME paper experiment and report; no extra paper track.','Measured report.')],
  5:[block('career-buffer','Internship outreach / buffer',['career'],0,120,'Flexible outreach or recovery; no automatic catch-up.','Useful outreach or rest.')],
  6:[block('minitorch-release','Tagged MiniTorch release',['builder'],180,240,'Reproducible instructions and benchmark report.','Tagged release + reproducibility + benchmark report.',{scope:'summer2-release',minutes:240})]
 }),
 S5:week({
  1:[block('udl-transformers','Prince UDL · Chapters 12 onward',['udl'],90,120,'Attention, masking and Transformer equations. Later chapters only when the ONE capstone needs them.','Derived or tested attention component.',{scope:'udl-transformers'})],
  2:[block('tiny-gpt','Raschka · Chapters 2–5',['raschka'],60,90,'Tokenization → attention → GPT → training. Karpathy GPT/tokenizer is an optional on-ramp inside this block.','Incrementally working tiny GPT.',{scope:'raschka-2-5',links:[{title:'Raschka implementation',url:urls.raschka}],supports:[{...karpathy,id:'gpt-onramp',title:'Karpathy GPT/tokenizer on-ramp',scope:'gpt-onramp'}]})],
  3:[academic('ensam-s5','ENSAM S5 elective and coursework',60,90,'Option 2 AI/Connected Industry only if chosen; otherwise chosen Option 1. Integrate required projects with the capstone.','ENSAM artifact.')],
  4:[block('pretrained','Tunstall + Hugging Face · selected practical work',['tunstall'],60,90,'Fine-tune and evaluate a pretrained baseline. After the baseline, GPU MODE or CS336 may replace a session only if the chosen branch requires it.','Reproducible evaluated model.',{links:[{title:'Hugging Face LLM Course',url:urls.hf},{title:'Transformers docs',url:urls.transformers}],supports:[{id:'hf-course',title:'Hugging Face course / maintained docs practice',resources:['huggingface'],url:urls.hf},{...gpu,maxPerMonth:undefined,requires:['pretrained-baseline'],requiresSystemsBranch:true},{id:'cs336',title:'Stanford CS336 · branch-specific support',resources:['cs336'],url:urls.cs336,requires:['pretrained-baseline'],requiresSystemsBranch:true}]})],
  6:[block('capstone',"ONE capstone · correctness → profiling → improvement",['builder'],180,240,'Choose A: LLM inference/batching, B: sign-language/industrial vision, or C: production ML. Read relevant papers. Measure p50/p95 latency or throughput and memory.','Vertical slice + measurements.',{scope:'capstone-builder',requiresBranch:true,links:[{title:'Full Stack Deep Learning',url:urls.fsdl}]})]
 }),
 S6:week(Object.fromEntries([1,2,3,4,6].map(d=>[d,[academic('pfe','PFE · internship and thesis',60,d===6?240:120,'PFE has priority; independent study budget is zero.','PFE artifact or protected recovery.')]])))
};
export const roadmap={version:4,asOf:'2026-11-14',weekParity:'ISO-8601',gates,phaseNotes:{
 S1:['One current roadmap; resume actual progress. ENSAM work counts toward the C project gate when it proves the skill.','The MIT trial has two Tuesday sessions (17 and 24 November); from 1 December it awaits a continuation decision.'],
 S2:['SVD follows linear-algebra foundations; PCA follows SVD.','Thursday practice alternates probability simulation and arrays/broadcasting/plots.'],
 Summer1:['Optional July–August plan, 12–15 h/week including career time. Enable it when you want to use it; it creates no catch-up debt.'],
 S3:['CS229 and MML are topic-specific references, not parallel mandatory courses.','Wasserman and ENSAM share Wednesday’s 60–90 minutes.'],
 S4:['Study priority: ENSAM → UDL → Huang → MiniTorch. Karpathy and GPU concepts are supports, not extra tracks. Do not rush every UDL chapter by June.','UDL routine: slides/notebook → 6–12 pages → derive key equation → predict one modification → run/test → capture failure and result in Obsidian. If stuck for three sessions, use a short lecture explanation, then return to UDL.','Every 2–3 MiniTorch labs, cross-check with Huang/PyTorch.'],
 Summer2:['One modest paper reproduction; finish a tagged MiniTorch release and measured report.'],
 S5:['Prince explains why; Raschka builds the model; Tunstall/Hugging Face teaches use/evaluation of pretrained models.','ONE capstone only. GPU kernels require CPU correctness and a measured bottleneck. RX 7900 XT: supported ROCm/Triton/HIP paths; no CUDA/cuBLAS benchmark claims without NVIDIA hardware.'],
 S6:['PFE takes priority. Independent study stays at zero.']},
 examPeak:'At an exam peak the independent-study budget can be zero. Keep university study time; cancel optional sessions and move milestones forward without doubled hours.'};

// Authored practice milestones, not invented textbook headings or homework.
export function addRoadmapPractice(bundle){
 const next=structuredClone(bundle),source='Learner roadmap, 14 Nov 2026; scope/action/effort authored, not an exact source heading.';
 const resources=[['svd','Targeted SVD supplement',urls.svd,[2]],['career','Career and portfolio','',[2,4]],['paper','One paper reproduction','',[4]],['gpu-mode','GPU MODE · selected support',urls.gpu,[4,5]],['cs336','CS336 · selected support',urls.cs336,[5]],['huggingface','Hugging Face · practical support',urls.hf,[5]]];
 for(const [id,name,url,semesters] of resources)if(!next.resources.some(r=>r.id===id))next.resources.push({id,name,url,semesters,edition:'Learner-selected scope',source,priority:3,enabled:true});
 const unit=(id,resourceId,semester,heading,activity,extra={})=>({id,resourceId,semester,unitRef:id.split(':').at(-1),heading,activity,completionEvidence:'User confirms the worked result, tests or measured report described in the roadmap.',estimatedMinutes:60,priority:'P1',track:'independent',kind:'authored_practice',link:next.resources.find(r=>r.id===resourceId)?.url||'',dependencies:[],preferredDays:[],sourceProvenance:source,headingConfidence:'authored_scope_not_section_heading',branch:null,...extra});
 // Ch. 1 overview is outside the requested Raschka 2–5 path; this is a new-catalog prerequisite correction only.
 const raschkaStart=next.units.find(u=>u.id==='raschka:ch-2');if(raschkaStart)raschkaStart.dependencies=[];
 const additions=[unit('svd:lecture-29','svd',2,'Strang Lecture 29 · targeted SVD practice','After the foundations gate, work one SVD example and validate with NumPy.'),
 unit('career:portfolio','career',2,'Internships / CV / portfolio practice','Improve one portfolio artifact or prepare one application. No message is sent automatically.'),
 unit('paper:experiment','paper',4,'One modest paper experiment','Select one paper and reproduce a modest experiment with settings and measurements.'),
 unit('paper:report','paper',4,'Measured reproduction report','Explain the same experiment, failed approaches and results.',{dependencies:['paper:experiment']}),
 unit('gpu-mode:profile','gpu-mode',4,'Selected profiling or memory-hierarchy practice','Use one relevant lesson to produce a profiler result; no CUDA benchmark claim on AMD hardware.'),
 unit('cs336:reference','cs336',5,'Branch-specific systems reference','Use one relevant CS336 topic only when the capstone branch requires it.'),
 unit('huggingface:baseline','huggingface',5,'Maintained Hugging Face baseline practice','Fine-tune and evaluate a pretrained baseline using the current course/docs.')];
 for(const n of [1,4,12])additions.push(unit('cs229:lecture-'+n,'cs229',3,`CS229 Autumn 2018 · Lecture ${n} selected reference`,'Use only the part that answers the current question raised by Géron; not an extra lecture sequence.',{unitRef:'Lecture '+n,link:urls.cs229}));
 additions.push(unit('cs229:lecture-16-first-half','cs229',3,'CS229 Lecture 16 · first half reference','Use only the first half, when it answers the current Géron question.',{unitRef:'Lecture 16 · first half',link:urls.cs229}));
 for(let n=6;n<=10;n++)additions.push(unit('wasserman:ch-'+n,'wasserman',3,`Wasserman · Chapter ${n} selected practice`,'Work a relevant MLE, convergence or testing exercise from this chapter; this label is a selected scope, not the printed chapter heading.',{unitRef:'Chapter '+n,estimatedMinutes:45,dependencies:n===6?[]:['wasserman:ch-'+(n-1)]}));
 for(const n of [1,2,3])additions.push(unit('mml:part1-'+n,'mml',2,`MML · Part I, Chapter ${n} practice`,'Work one mathematical example from Part I.',{unitRef:'Part I · Chapter '+n}));
 additions.push(unit('builder:pca-after-svd','builder',2,'PCA after SVD','Compare a PCA implementation with a reference only after SVD is demonstrated.',{unitRef:'Numerical lab · PCA',dependencies:['builder:numerical-and-classical-ml-m5']}));
 additions.push(unit('builder:summer1-polish','builder',2,'Numerical repository polish + 1–2-page report','Polish the numerical repository, benchmark with settings, and write a 1–2-page engineering report.'));
 additions.push(unit('builder:summer2-release','builder',4,'Tagged MiniTorch release and benchmark report','Create reproducible instructions, tests, documentation, benchmarks and a tagged release.'));
 const stages=[['elimination','Gaussian elimination'],['monte-carlo','Monte Carlo simulation with uncertainty'],['gradient-checks','Numerical gradient checks'],['least-squares','Least squares compared with np.linalg.lstsq']];
 stages.forEach(([id,heading],i)=>additions.push(unit('builder:numerical-'+id,'builder',2,heading,'Implement and check this stage before the next numerical lab stage.',{unitRef:'Numerical lab · '+(i+1),dependencies:i?['builder:numerical-'+stages[i-1][0]]:[]})));
 additions.find(u=>u.id==='builder:pca-after-svd').dependencies=['builder:numerical-least-squares'];
 for(const u of additions)if(!next.units.some(x=>x.id===u.id))next.units.push(u);
 return next;
}
