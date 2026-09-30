(function(root){
  'use strict';
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function date(s){ if(!/^\d{4}-\d{2}-\d{2}$/.test(s||'')) return null; const [y,m,d]=s.split('-').map(Number); const x=new Date(y,m-1,d,12); return iso(x)===s ? x : null; }
  function add(s,n){ const d=date(s); if(!d) return null; d.setDate(d.getDate()+n); return iso(d); }
  const round=x=>Math.round(x/2.5)*2.5;
  function warmup(work,bar=20,dead=false){
    if(!Number.isFinite(work)||work<=0||!Number.isFinite(bar)||bar<=0) return [];
    if(work<=bar) return [];
    const start=dead&&work>40?Math.max(bar,40):bar;
    const rows=[{kg:start,reps:dead?5:8,sets:1,rest:60}];
    for(const [ratio,reps,rest] of [[.4,5,60],[.6,3,90],[.8,1,120]]){
      const kg=Math.floor(work*ratio/2.5)*2.5;
      if(kg>rows.at(-1).kg && kg<work) rows.push({kg,reps,sets:1,rest});
    }
    return rows.filter(x=>x.kg<work);
  }
  function estimate(kg,reps){ if(!Number.isFinite(kg)||kg<1||kg>500||!Number.isInteger(reps)||reps<3||reps>5) return null; return Math.round(kg*(1+reps/30)*10)/10; }
  function due(last,today,postponed){
    const base=date(last)?add(last,56):today;
    const target=date(postponed)&&postponed>base?postponed:base;
    const days=Math.round((date(target)-date(today))/86400000);
    return {date:target,days,overdue:days<0,unknown:!date(last)};
  }
  /* 5/3/1: 기준값(TM) = 1RM × 90% */
  function tmOf(oneRM){ return round(oneRM*0.9); }
  /* wave.sets = [[TM 대비 %, 횟수, '+'?], ...] → 세트별 무게·횟수 */
  function mainSets(tm,wave){
    return wave.sets.map(([p,r,plus])=>({kg:round(tm*p),reps:r,amrap:!!plus}));
  }
  function prescription(e,wave,wib,v,tm){
    const deload=wib===4?.85:1;
    const tmv=k=>(tm&&tm[k])||tmOf(v[k]);
    if(e.main){
      if(Array.isArray(wave.sets)){
        const plan=mainSets(tmv(e.main),wave),top=plan[plan.length-1];
        return {sets:plan.length,reps:top.reps,kg:top.kg,plan,tm:tmv(e.main)};
      }
      const [s,r]=String(wave.scheme).split('×').map(x=>parseInt(x,10));
      return {sets:s,reps:r,kg:round(v[e.main]*wave.pct)};
    }
    if(e.fsl){
      if(!Array.isArray(wave.sets)||wib===4) return {sets:0,reps:5,kg:null};
      return {sets:e.sets||5,reps:5,kg:round(tmv(e.fsl)*wave.sets[0][0])};
    }
    let sets,reps;
    if(Array.isArray(e.sets)){ sets=e.sets[wib-1]; reps=e.reps; }
    else { const [s,r]=String(e.s||'3 × 10').split('×').map(x=>parseInt(x,10)); sets=wib===4?2:s; reps=r; }
    let kg=null;
    if(e.pct) kg=round(round(v[e.of]*e.pct)*deload);
    else if(Array.isArray(e.est)){ const base=e.est[0]==='bw'?v.bw:v[e.est[0]]; kg=round(round(base*e.est[1])*deload); }
    return {sets,reps,kg};
  }
  function plates(total,bar=20){
    if(total<bar) return {plates:[],remainder:total-bar};
    let remaining=(total-bar)/2;const plates=[];
    for(const n of [25,20,15,10,5,2.5,1.25]) while(remaining>=n-1e-6){ plates.push(n);remaining=Math.round((remaining-n)*1000)/1000; }
    return {plates,remainder:remaining};
  }
  /* AMRAP 세트로 1RM 추정. 10회를 넘으면 Epley가 과대추정하므로 10회로 자르고,
     기준값이 부풀지 않도록 2.5kg 단위로 내림한다. */
  function amrap(kg,reps){
    if(!Number.isFinite(kg)||kg<=0||!Number.isFinite(reps)||reps<1) return null;
    const r=Math.min(Math.floor(reps),10);
    return Math.floor(kg*(1+r/30)/2.5)*2.5;
  }
  const api={iso,date,add,round,warmup,estimate,due,prescription,plates,amrap,tmOf,mainSets};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.TrainingCore=api;
})(typeof window!=='undefined'?window:globalThis);
