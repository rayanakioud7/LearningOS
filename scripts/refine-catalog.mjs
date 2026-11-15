// Public heading metadata only. Learning actions and effort are authored estimates.
export function refineCatalog(input){
 const c=structuredClone(input);c.version='2026-11-15.2';
 const find=id=>c.units.find(u=>u.id===id);
 const update=(id,heading,link)=>{const u=find(id);if(!u)return;u.heading=heading;u.headingConfidence='verified_heading';if(link)u.link=link;u.activity='Explain '+heading+' in your own words; work through one source example and solve a related exercise.';u.completionEvidence='A worked example, an independently attempted exercise, and a short explanation of any errors.';};
 const reference=(id,reason)=>Object.assign(find(id),{referenceOnly:true,referenceReason:reason});
 const pdsh='https://www.oreilly.com/library/view/python-data-science/9781098121211/';
 const numpy=['Understanding Data Types in Python','The Basics of NumPy Arrays','Computation on NumPy Arrays: Universal Functions','Aggregations: min, max, and Everything in Between','Computation on Arrays: Broadcasting','Comparisons, Masks, and Boolean Logic','Fancy Indexing','Sorting Arrays','Structured Data: NumPy’s Structured Arrays'];
 const plotting=['General Matplotlib Tips','Simple Line Plots','Simple Scatter Plots','Density and Contour Plots','Customizing Plot Legends','Customizing Colorbars','Multiple Subplots','Text and Annotation','Customizing Ticks','Customizing Matplotlib: Configurations and Stylesheets','Three-Dimensional Plotting in Matplotlib','Visualization with Seaborn'];
 for(const [start,headings]of [[4,numpy],[25,plotting]])for(let i=0;i<headings.length;i++){
  const n=start+i,id='vanderplas-2e:ch-'+n;
  if(!find(id))c.units.push({...structuredClone(find('vanderplas-2e:ch-13')),id,unitRef:'Chapter '+n,heading:headings[i],estimatedMinutes:45,dependencies:i?['vanderplas-2e:ch-'+(n-1)]:[],link:pdsh});
  update(id,headings[i],pdsh);find(id).activity='Run the '+headings[i]+' examples in a notebook, then recreate one on a small dataset without copying.';find(id).completionEvidence='An executable notebook with one independent example and checks of the resulting arrays or plot.';
 }
 reference('vanderplas-2e:part-ii','Overview of chapters 4–12; the individual chapters are scheduled.');
 reference('vanderplas-2e:part-iv','Overview of chapters 25–36; the individual chapters are scheduled.');
 find('vanderplas-2e:ch-13').dependencies=['vanderplas-2e:ch-12'];
 const mml='https://mml-book.github.io/';
 for(const[n,h]of [[1,'Introduction and Motivation'],[2,'Linear Algebra'],[3,'Analytic Geometry']])update('mml:part1-'+n,h,mml);
 for(const[n,h]of [[8,'When Models Meet Data'],[11,'Density Estimation with Gaussian Mixture Models'],[12,'Classification with Support Vector Machines']]){
  const id='mml:ch-'+n;if(!find(id))c.units.push({...structuredClone(find('mml:ch-9')),id,unitRef:'Chapter '+n,dependencies:[]});update(id,h,mml);
 }
 update('mml:ch-10','Dimensionality Reduction with Principal Component Analysis',mml);
 const stat='https://link.springer.com/book/10.1007/978-0-387-21736-9';
 for(const[n,h]of [[6,'Models, Statistical Inference and Learning'],[7,'Estimating the CDF and Statistical Functionals'],[8,'The Bootstrap'],[9,'Parametric Inference'],[10,'Hypothesis Testing and p-values']])update('wasserman:ch-'+n,h,stat);
 reference('wasserman:selective-reference','Overview; chapters 6–10 supply the scheduled inference practice.');
 update('velleman:3-4','Proofs Involving Conjunctions and Biconditionals','https://assets.cambridge.org/97811084/39534/frontmatter/9781108439534_frontmatter.pdf');
 // Find older catalog IDs too, preserving their stable identity.
 for(const u of c.units.filter(u=>u.resourceId==='velleman'&&u.unitRef.includes('3.4')))update(u.id,'Proofs Involving Conjunctions and Biconditionals','https://assets.cambridge.org/97811084/39534/frontmatter/9781108439534_frontmatter.pdf');
 update('cs229:lecture-1','Introduction and Basic Concepts');
 update('cs229:lecture-12','Practical Advice for ML projects');
 update('cs229:lecture-16-first-half','MDPs. Bellman Equations.');
 const l4=find('cs229:lecture-4');l4.heading='Perceptron; Exponential Family; Generalized Linear Models';l4.headingConfidence='verified_topic_group_lecture_split_unspecified';l4.activity='Use the supervised-learning notes on perceptrons and generalized linear models to resolve the current Géron question.';l4.completionEvidence='One derivation or worked example linked to the current model; the syllabus groups these topics across lectures 3–4.';
 // CS229 is an on-demand reference clinic, not a second sequential course.
 for(const u of c.units.filter(u=>u.resourceId==='cs229'))u.dependencies=[];
 update('svd:lecture-29','Singular Value Decomposition','https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/positive-definite-matrices-and-applications/singular-value-decomposition/');
 for(const[n,h]of [[4,'Relations'],[5,'Functions'],[6,'Mathematical Induction']])update('velleman:ch-'+n,h,'https://assets.cambridge.org/97811084/39534/frontmatter/9781108439534_frontmatter.pdf');
 const gpu=find('gpu-mode:profile');Object.assign(gpu,{unitRef:'Lecture 1 · pt_profiler.py',heading:'PyTorch profiler example',headingConfidence:'verified_source_filename_authored_label',link:'https://github.com/gpu-mode/lectures/blob/main/lecture_001/pt_profiler.py',activity:'Run the PyTorch profiler example on a tiny tensor operation. Record the slowest operation and compare CPU and available GPU measurements.',completionEvidence:'A saved profiler table with device, tensor size and one explained bottleneck; no hardware purchase is required.'});
 const cs=find('cs336:reference');Object.assign(cs,{unitRef:'Assignment 2 · Systems',heading:'Systems',headingConfidence:'verified_heading',link:'https://cs336.stanford.edu/spring2025/',activity:'Use the profiling and benchmarking section of the Systems assignment to measure one layer of the capstone. Keep the exercise bounded to this bottleneck.',completionEvidence:'A reproducible layer benchmark with a correctness check and documented hardware; this task covers a selected exercise, not the full assignment.'});
 const hf=find('huggingface:baseline');Object.assign(hf,{unitRef:'Chapter 2',heading:'Using Transformers',headingConfidence:'verified_heading',link:'https://huggingface.co/learn/llm-course/chapter2/1',activity:'Run a small pretrained model through a tokenizer and model, freeze a small evaluation split, and record a reproducible CPU baseline.',completionEvidence:'Pinned model/tokenizer versions, a saved evaluation split and baseline metrics with inference time.'});
 const huang=['','Introducing deep learning and the PyTorch library','Pretrained networks','It starts with a tensor','Real-world data representation using tensors','The mechanics of learning','Using a neural network to fit the data','Telling birds from airplanes: Learning from images','Using convolutions to generalize','How transformers work','Diffusion models for images','Using PyTorch to fight cancer','Combining data sources into a unified dataset','Training a classification model to detect suspected tumors','Improving training with metrics and augmentation','Using segmentation to find suspected nodules','Training models on multiple GPUs','Deploying to production'];
 for(const u of c.units.filter(u=>u.resourceId==='huang')){const n=Number(u.id.match(/ch-(\d+)$/)?.[1]);if(huang[n]){update(u.id,huang[n],'https://www.oreilly.com/library/view/deep-learning-with/9781633438859/');u.activity='Run a small example from '+huang[n]+' and complete one exercise, checking tensor shapes, outputs and reproducibility.';}}
 const hr=c.resources.find(r=>r.id==='huang');hr.edition='Second edition (2026); publisher chapter sequence';
 c.resources.find(r=>r.id==='tunstall').name='Tunstall, von Werra & Wolf — NLP with Transformers';
 for(const u of c.units.filter(u=>u.resourceId==='tunstall')){const n=Number(u.id.match(/topic-(\d+)$/)?.[1]);if(n)u.unitRef='Chapter '+n;}
 update('tunstall:topic-01','Hello Transformers','https://www.oreilly.com/library/view/natural-language-processing/9781098136789/');
 for(let n=13;n<=21;n++)find('udl:ch-'+n).dependencies=['udl:ch-'+String(n-1).padStart(2,'0')];
 for(const u of c.units){
  if(['academic_module','academic_course_file'].includes(u.kind)){u.referenceOnly=true;u.referenceReason='Curriculum reference; current teacher assignments and deadlines are not inferred.';}
  if(/^(references|bibliography|index)$/i.test(u.heading)){u.referenceOnly=true;u.referenceReason='Reference material, not a standalone study assignment.';}
 }
 c.automation={version:1,activation:'active_by_default',effort:'authored_estimates',completion:'explicit_session_outcome_only',futureSemesters:'tentative',sourcesChecked:'2026-11-15'};
 return c;
}
