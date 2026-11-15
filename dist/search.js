export function foldSearch(value){
 return String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase()
  .replace(/\b(?:chapters?|ch\.?)\s*0*(\d+)\b/g,' chapter:$1 ')
  .replace(/§\s*/g,' section:').replace(/\s+/g,' ').trim();
}
export function matchesSearch(text,query){
 const haystack=foldSearch(text),words=foldSearch(query).split(/\s+/).filter(Boolean);
 return words.every(word=>{
  if(!haystack.includes(word))return false;
  if(!/\d/.test(word))return true;
  let from=0,index;while((index=haystack.indexOf(word,from))!==-1){const before=haystack[index-1]||'',after=haystack[index+word.length]||'';if(!/[\d]/.test(before)&&!/[\d]/.test(after))return true;from=index+1;}return false;
 });
}
const aliases={ila:'ILA',udl:'Prince UDL',mit1802:'MIT 18.02SC','vanderplas-2e':'PDSH VanderPlas',huang:'Huang PyTorch',geron:'Géron',mml:'MML',stat110:'Stat 110'};
export const resourceSearchText=r=>[r?.id,r?.name,r?.edition,aliases[r?.id]].filter(Boolean).join(' ');
