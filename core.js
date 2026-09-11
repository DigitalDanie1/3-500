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
  function prescription(e,wave,wib,v){
    const scheme=e.main?wave.scheme:(wib===4?e.s.replace(/^\d+/,'2'):e.s);
    const [sets,reps]=scheme.split('×').map(x=>Number(x.trim()));
    let kg=e.main?round(v[e.main]*wave.pct):e.pct?round(round(v[e.of]*e.pct)*(wib===4?.85:1)):null;
    return {sets,reps,kg};
  }
  function plates(total,bar=20){
    if(total<bar) return {plates:[],remainder:total-bar};
    let remaining=(total-bar)/2;const plates=[];
    for(const n of [25,20,15,10,5,2.5,1.25]) while(remaining>=n-1e-6){ plates.push(n);remaining=Math.round((remaining-n)*1000)/1000; }
    return {plates,remainder:remaining};
  }
  const api={iso,date,add,round,warmup,estimate,due,prescription,plates};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.TrainingCore=api;
})(typeof window!=='undefined'?window:globalThis);
