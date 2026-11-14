// Public roadmap data supplied by the learner. This file keeps the shipped
// catalog reproducible without publishing any private archive names or bytes.
const ensamURL='https://www.ensam-casa.ma/filieres/details?id=19';

const moduleGroups=[
 {semester:1,ref:'Outils d’aide à la décision',courses:[
  ['recherche-operationnelle','Recherche Opérationnelle',90],
  ['statistiques-inferentielles','Statistiques Inférentielles',90]
 ]},
 {semester:1,ref:'Réseaux informatique et cybersécurité',courses:[
  ['reseaux-informatiques','Réseaux Informatiques',90],
  ['cybersecurity','Cybersecurity',90]
 ]},
 {semester:1,ref:'Système d’exploitation et POO avec Python',courses:[
  ['systeme-exploitation-linux','Système d’Exploitation Linux',90],
  ['python-avance','Python Avancé',90]
 ]},
 {semester:1,ref:'Ingénierie des systèmes d’information',courses:[
  ['systemes-information','Systèmes d’Information',75],
  ['bases-de-donnees','Bases de Données',90]
 ]},
 {semester:1,ref:'Structure de données et algorithmique avancée',courses:[
  ['algorithmique-avancee','Algorithme Avancé',90],
  ['structures-de-donnees','Structure des Données',90]
 ]},
 {semester:1,ref:'Algorithmique & programmation en Python',courses:[
  ['algorithmique','Algorithmique',75],
  ['programmation-python','Programmation Python',75]
 ]},
 {semester:1,ref:'Langues étrangères',courses:[
  ['francais-s1','Français',60],['anglais-s1','English',60]
 ]},

 {semester:2,ref:'Mathématiques pour informatiques',courses:[
  ['mathematiques-informatique','Mathématiques pour Informatiques',90]
 ]},
 {semester:2,ref:'Ingénierie de l’objet et technologie Java',courses:[
  ['modelisation-uml','Modélisation UML',75],['poo-java','POO Java',90]
 ]},
 {semester:2,ref:'Développement web',courses:[
  ['web-statique','Programmation Web Statique',75],['web-dynamique','Programmation Web Dynamique',90]
 ]},
 {semester:2,ref:'Développement full stack',courses:[
  ['front-end','Développement Front End',90],['back-end','Développement Back End',90]
 ]},
 {semester:2,ref:'Automatismes industriels & acquisition de l’information',courses:[
  ['acquisition-information','Acquisition de l’Information',75],['automatismes-industriels','Automatismes Industriels',75]
 ]},
 {semester:2,ref:'Compétence artistique et culturelle',courses:[
  ['art-patrimoine','Art, Patrimoine Culturel et Innovation',60],
  ['histoire-maroc','Histoire et Développement du Maroc',60],
  ['environnement-economique','Environnement Économique',60]
 ]},
 {semester:2,ref:'Langues étrangères',courses:[
  ['francais-s2','Français',60],['anglais-s2','English',60]
 ]},

 {semester:3,ref:'Conception et développement d’applications d’entreprise Java',courses:[
  ['jee','JEE',90],['design-patterns','Design Patterns',75]
 ]},
 {semester:3,ref:'Cloud computing et virtualisation',courses:[
  ['cloud-computing','Cloud Computing',75],['virtualisation','Virtualisation',75]
 ]},
 {semester:3,ref:'Bases de données avancées et sécurisées',courses:[
  ['bases-nosql','Bases de Données NoSQL',90],['administration-bdd','Administration des Bases de Données',90]
 ]},
 {semester:3,ref:'Analyse et fouille de données',courses:[
  ['analyse-fouille-donnees','Analyse et Fouille de Données',90]
 ]},
 {semester:3,ref:'Ingénierie de réalité augmentée',courses:[
  ['webgl','Web GL',75],['realite-augmentee','Ingénierie de Réalité Augmentée',90]
 ]},
 {semester:3,ref:'Intelligence artificielle',courses:[
  ['intelligence-artificielle','Intelligence Artificielle',90]
 ]},
 {semester:3,ref:'Langues étrangères',courses:[
  ['francais-s3','Français',60],['anglais-s3','English',60]
 ]},

 {semester:4,ref:'Reinforcement learning',courses:[
  ['deep-reinforcement-learning','Deep Reinforcement Learning',90],['processus-stochastiques','Processus Stochastiques',90]
 ]},
 {semester:4,ref:'Business intelligence et deep learning',courses:[
  ['business-intelligence','Business Intelligence',75],['deep-learning','Deep Learning',90]
 ]},
 {semester:4,ref:'Développement mobile et IoT',courses:[
  ['dev-mobile-iot','Développement Mobile et IoT',90]
 ]},
 {semester:4,ref:'Machine learning et text mining',courses:[
  ['text-mining','Text Mining',75],['machine-learning','Machine Learning',90]
 ]},
 {semester:4,ref:'Gestion de projets et d’entreprises',courses:[
  ['marketing-industriel','Marketing Industriel',60],['management-projet','Management de Projet',75],['gestion-rh-s4','Gestion des RH',60]
 ]},
 {semester:4,ref:'Projets métiers et séminaires',courses:[
  ['entrepreneuriat-innovation','Entreprenariat et Innovation',75],['projets-metiers','Projets Métiers et Séminaires',90]
 ]},
 {semester:4,ref:'Langues étrangères',courses:[
  ['francais-s4','Français',60],['anglais-s4','English',60]
 ]},

 {semester:5,ref:'Vision par ordinateur et IA générative',courses:[
  ['vision-ordinateur','Vision par Ordinateur',90],['ia-generative','IA Générative',90]
 ]},
 {semester:5,ref:'Architecture des composants d’entreprises',courses:[
  ['architecture-microservices','Architecture Microservices',90],['system-design','System Design',90]
 ]},
 {semester:5,ref:'Big data et DevOps',courses:[
  ['devops','DevOps',75],['mlops','MLOps',75],['big-data','Big Data',90]
 ]},
 {semester:5,ref:'Méthodes agiles et qualité logicielle',courses:[
  ['qualite-logicielle','Qualité Logicielle',75],['methodes-agiles','Méthodes Agiles',60]
 ]},
 {semester:5,ref:'Compétences professionnelles',courses:[
  ['erp','ERP',75],['employment-skills','Employment Skills',60]
 ]},
 {semester:5,ref:'Finance d’entreprises, GRH et droit des affaires',courses:[
  ['finance-entreprise','Finances d’Entreprises',60],['droit-affaires','Droit des Affaires',60],['gestion-rh-s5','Gestion des RH',60]
 ]},
 {semester:5,ref:'Langues étrangères',courses:[
  ['francais-s5','Français',60],['anglais-s5','English',60]
 ]},

 {semester:6,ref:'Projet de fin d’études',courses:[
  ['pfe','PFE · Stage',240]
 ]}
];

export const extraResources=[{
 id:'dsa',name:'Goodrich — Data Structures and Algorithms in Python',edition:'First edition (2013)',
 url:'https://www.wiley.com/en-us/Data+Structures+and+Algorithms+in+Python-p-9781118290279',
 source:'Table of contents supplied by the learner; headings checked against the owned edition. Actions and effort are authored.',
 semesters:[1,2],priority:1,enabled:true
}];
const dsaChapters=[
 ['Python Primer','Read the chapter primer and write a short Python program that demonstrates the chapter’s core language features.'],
 ['Object-Oriented Programming','Implement a small class hierarchy and explain inheritance, composition and encapsulation with your own example.'],
 ['Algorithm Analysis','Analyse the time and space complexity of two implementations and verify the difference with a measured experiment.'],
 ['Recursion','Trace a recursive algorithm by hand, then write a recursive and an iterative version and compare them.'],
 ['Array-Based Sequences','Implement a dynamic array and measure append, insert and resize behaviour against Python’s list.'],
 ['Stacks, Queues, and Deques','Implement the three ADTs and use one to solve a small parsing or scheduling problem.'],
 ['Linked Lists','Implement a singly linked list with insertion, deletion and reversal; test every edge case.'],
 ['Trees','Implement a general tree and a binary tree traversal; explain the runtime of each operation.'],
 ['Priority Queues','Implement a heap-based priority queue and use it to solve a shortest-job-first scheduling example.'],
 ['Maps, Hash Tables, and Skip Lists','Implement a hash map with collision handling and compare it with a balanced-tree alternative.'],
 ['Search Trees','Implement or trace a binary search tree and explain why balancing matters.'],
 ['Sorting and Selection','Implement two sorting algorithms and compare their complexity and measured behaviour.'],
 ['Text Processing','Build a small text-processing pipeline and explain the data structures used at each stage.'],
 ['Graph Algorithms','Implement BFS, DFS and one shortest-path algorithm on a small graph you construct.'],
 ['Memory Management and B-Trees','Explain reference counting, garbage collection and the role of B-trees in persistent storage.']
];
export const extraUnits=dsaChapters.map(([heading,activity],index)=>({
 id:'dsa:ch-'+(index+1),resourceId:'dsa',semester:index<7?1:2,unitRef:'Chapter '+(index+1),heading,
 activity,completionEvidence:'A working implementation, a checked trace or a concise explanation that you can reproduce without the book open.',
 estimatedMinutes:index<3?90:120,priority:'P1',track:'independent',kind:'reading',
 link:'https://www.wiley.com/en-us/Data+Structures+and+Algorithms+in+Python-p-9781118290279',
 dependencies:[],preferredDays:[2,4,6],
 sourceProvenance:'Learner-owned edition table of contents; chapter headings checked 14 Nov 2026. Actions and durations authored.',
 headingConfidence:'verified_heading',branch:null
}));
const languageOrCulture=ref=>/Langues|artistique/i.test(ref);
export const ensamModules=moduleGroups.flatMap(group=>group.courses.map(([slug,heading,estimatedMinutes])=>({
 id:'ensam:'+slug,resourceId:'ensam',semester:group.semester,
 unitRef:`S${group.semester} · ${group.ref} · ${heading}`,heading,
 activity:`Bring the current teacher material for ${heading} and list the chapters, TD/TP or project actually assigned. Then author one concrete next action; this module name is not a chapter sequence.`,
 completionEvidence:'A teacher-confirmed syllabus extract plus one checked exercise, lab, project artifact, or concise explanation. Activation requires individual review.',
 estimatedMinutes,priority:languageOrCulture(group.ref)?'P1':'P0',track:'academic',kind:'academic_module',
 link:ensamURL,dependencies:[],preferredDays:[3,5],
 sourceProvenance:'ENSAM module list supplied by the learner on 14 Nov 2026. Official sequence and current assignment still require teacher confirmation.',
 headingConfidence:'learner_supplied_module_name',branch:null
})));

export const semesterOverrides={
 1:{start:'2026-09-14'},
 2:{end:'2027-06-13'}
};

// Primary blocks stay protected. Secondary blocks are pulled in only after the
// primary track is completed, using the remaining shared daily capacity.
export const weeklyResources={
 S1:{1:['ila'],2:['mit1802'],4:['velleman'],6:['builder']},
 S2:{1:['ila'],2:['stat110'],4:['stat110'],6:['builder']},
 S3:{1:['geron'],2:['cs229'],4:['geron'],6:['builder']},
 S4:{1:['udl'],2:['huang'],4:['karpathy'],6:['builder']},
 S5:{1:['udl'],2:['raschka'],4:['tunstall'],6:['builder']},
 S6:{6:['builder']}
};
export const weeklySecondary={
 S1:{4:['dsa'],6:['missing']},
 S2:{1:['vanderplas-2e'],4:['vanderplas-2e','mml'],6:['dsa']},
 S3:{},
 S4:{4:['pmpp','udl']},
 S5:{4:['pmpp']},
 S6:{}
};

export const weeklySlots={
 S1:{Mon:'ILA primary',Tue:'MIT 18.02SC calculus',Wed:'ENSAM required coursework',Thu:'Velleman proof lab; DSA continuation if capacity remains',Fri:'ENSAM overflow or recovery',Sat:'Builder Lab; optional Missing Semester tooling',Sun:'Rest'},
 S2:{Mon:'ILA remaining',Tue:'Stat 110 core',Wed:'ENSAM Java/Web/automation',Thu:'Stat 110 problem solving; Data Science Handbook / MML after the primary block',Fri:'ENSAM overflow or recovery',Sat:'Numerical computing Builder Lab; DSA continuation',Sun:'Rest'},
 S3:{Mon:'Géron concept / model evaluation',Tue:'CS229 lecture on gaps; Wasserman optional',Wed:'ENSAM cloud/data/Java/AI',Thu:'Géron notebook and from-scratch exercises',Fri:'ENSAM overflow or recovery',Sat:'Classical ML Builder Lab',Sun:'Rest'},
 S4:{Mon:'UDL core theory + notebook',Tue:'Huang PyTorch implementation',Wed:'ENSAM ML/DL/AR/IoT/RL coursework',Thu:'Karpathy when unblocking MiniTorch; PMPP/GPU or UDL after the primary block',Fri:'ENSAM overflow or recovery',Sat:'MiniTorch C Builder Lab',Sun:'Rest'},
 S5:{Mon:'UDL Transformers or branch-specific theory',Tue:'Raschka GPT from scratch',Wed:'ENSAM selected option',Thu:'Tunstall/Hugging Face practical task; PMPP systems after the primary block',Fri:'ENSAM overflow or recovery',Sat:'One ML-systems capstone Builder Lab',Sun:'Rest'},
 S6:{Mon:'PFE',Tue:'PFE',Wed:'PFE',Thu:'PFE',Fri:'PFE',Sat:'Optional thesis / PFE polish',Sun:'Rest'}
};

// The learner supplied the 2026–27 ENSAM calendar image. These are date
// envelopes, never personal exam times. Resits remain opt-in.
// The three-year roadmap is expressed as phases (date ranges with a mode and
// capacity budget) plus weekly templates (blocks per weekday). Blocks are
// timeboxes, not hardcoded daily chapters: the scheduler still picks the next
// ready unit dynamically, which keeps the finish-early re-planning behavior intact.
export const phases=[
 {id:'S1A',start:'2026-09-14',end:'2027-01-10',mode:'teaching',weeklyIndependentMinutes:480,dailyIndependentMinutes:90,saturdayMinutes:180},
 {id:'S1B',start:'2027-01-11',end:'2027-01-31',mode:'recovery',weeklyIndependentMinutes:240,dailyIndependentMinutes:60,saturdayMinutes:60},
 {id:'S2',start:'2027-02-01',end:'2027-06-13',mode:'teaching',weeklyIndependentMinutes:480,dailyIndependentMinutes:90,saturdayMinutes:180},
 {id:'Summer1',start:'2027-06-14',end:'2027-08-31',mode:'summer',weeklyIndependentMinutes:780,dailyIndependentMinutes:120,saturdayMinutes:240},
 {id:'S3',start:'2027-09-01',end:'2028-01-31',mode:'teaching',weeklyIndependentMinutes:540,dailyIndependentMinutes:90,saturdayMinutes:180},
 {id:'S4',start:'2028-02-01',end:'2028-06-30',mode:'teaching',weeklyIndependentMinutes:540,dailyIndependentMinutes:90,saturdayMinutes:180},
 {id:'Summer2',start:'2028-07-01',end:'2028-08-31',mode:'summer',weeklyIndependentMinutes:780,dailyIndependentMinutes:120,saturdayMinutes:240},
 {id:'S5',start:'2028-09-01',end:'2029-01-31',mode:'teaching',weeklyIndependentMinutes:480,dailyIndependentMinutes:90,saturdayMinutes:180},
 {id:'S6',start:'2029-02-01',end:'2029-06-30',mode:'pfe',weeklyIndependentMinutes:0,dailyIndependentMinutes:0,saturdayMinutes:0}
];
// Weekly templates: one or more timeboxed blocks per weekday. Each block lists
// the resources it may draw from and its budget in minutes. The first block of
// a day is the primary block; later blocks are secondary blocks (for example
// "Stat 110" then "Data Science Handbook" on S2 Thursdays). Empty days have no
// prescribed independent block (ENSAM, rest, overflow).
export const weeklyBlocks={
 S1A:{1:[{resources:['ila'],minutes:75}],2:[{resources:['mit1802'],minutes:75}],4:[{resources:['velleman'],minutes:60},{resources:['dsa'],minutes:30}],6:[{resources:['builder'],minutes:180}]},
 S1B:{},
 S2:{1:[{resources:['ila'],minutes:75}],2:[{resources:['stat110'],minutes:75}],4:[{resources:['stat110'],minutes:45},{resources:['vanderplas-2e','mml'],minutes:30}],6:[{resources:['builder'],minutes:180}]},
 Summer1:{1:[{resources:['vanderplas-2e'],minutes:120}],2:[{resources:['mml'],minutes:120}],3:[{resources:['geron'],minutes:120}],4:[{resources:['udl'],minutes:120}],5:[{resources:['vanderplas-2e','mml'],minutes:120}],6:[{resources:['builder'],minutes:180}]},
 S3:{1:[{resources:['geron'],minutes:75}],2:[{resources:['cs229'],minutes:75}],4:[{resources:['geron'],minutes:75}],6:[{resources:['builder'],minutes:180}]},
 Summer2:{1:[{resources:['udl'],minutes:120}],2:[{resources:['huang'],minutes:120}],3:[{resources:['karpathy'],minutes:120}],4:[{resources:['pmpp'],minutes:120}],5:[{resources:['raschka','tunstall'],minutes:120}],6:[{resources:['builder'],minutes:180}]},
 S4:{1:[{resources:['udl'],minutes:75}],2:[{resources:['huang'],minutes:75}],4:[{resources:['karpathy'],minutes:45},{resources:['pmpp'],minutes:30}],6:[{resources:['builder'],minutes:180}]},
 S5:{1:[{resources:['udl'],minutes:75}],2:[{resources:['raschka'],minutes:75}],4:[{resources:['tunstall'],minutes:45},{resources:['pmpp'],minutes:30}],6:[{resources:['builder'],minutes:180}]},
 S6:{}
};
export const academicWindows=[
 {start:'2026-09-14',end:'2026-12-18',kind:'teaching',certainty:'ENSAM_2026_27_calendar'},
 {start:'2026-12-07',end:'2026-12-20',kind:'suggested_exam_prep',certainty:'user_adjustable_recommendation'},
 {start:'2026-12-21',end:'2026-12-26',kind:'exam_CI',certainty:'ENSAM_2026_27_calendar'},
 {start:'2027-01-11',end:'2027-01-23',kind:'resit_CI_conditional',certainty:'ENSAM_2026_27_calendar'},
 {start:'2027-01-25',end:'2027-01-31',kind:'intersemester_break',certainty:'ENSAM_2026_27_calendar'},
 {start:'2027-02-01',end:'2027-05-07',kind:'teaching',certainty:'ENSAM_2026_27_calendar'},
 {start:'2027-05-17',end:'2027-05-22',kind:'exam_CI',certainty:'ENSAM_2026_27_calendar'},
 {start:'2027-05-24',end:'2027-06-05',kind:'resit_CI_conditional',certainty:'ENSAM_2026_27_calendar'},
 {start:'2027-06-07',end:'2027-06-12',kind:'resit_2AP_conditional',certainty:'ENSAM_2026_27_calendar'},
 {start:'2027-06-14',end:'2027-07-23',kind:'pfe_period',certainty:'ENSAM_2026_27_calendar'}
];
