/* 식단 — 칼로리·단백질 기록, 추천 식단, 아침 체중.
   목표는 '조금 남게 먹기'(근육 증가). 음식 목록은 '번' 칼로리 앱과 같다. */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const KEY='bigthree500.nutrition.v1';
const FOODS=[["🍚", "나시레막", 480, 12.0], ["🍚", "치킨라이스", 420, 26.0], ["🦆", "로스트덕라이스", 520, 28.0], ["🍚", "차슈라이스", 560, 30.0], ["🍜", "락사", 460, 14.0], ["🍜", "차퀘이테오", 520, 16.0], ["🍜", "완탕면", 380, 14.0], ["🍜", "호키엔미", 490, 18.0], ["🍜", "바미", 400, 16.0], ["🍲", "바쿠테", 410, 30.0], ["🍗", "닭가슴살(150g)", 240, 36.0], ["🥚", "삶은계란(2개)", 155, 13.0], ["🐟", "연어구이(150g)", 280, 38.0], ["🧊", "두부(반모)", 120, 13.0], ["🥛", "그릭요거트", 130, 17.0], ["🥤", "프로틴쉐이크", 170, 30.0], ["🥗", "샐러드볼(치킨)", 320, 28.0], ["🍚", "현미밥(1공기)", 310, 6.0], ["🍚", "백미밥(1공기)", 300, 5.0], ["🍚", "비빔밥", 560, 16.0], ["🍲", "김치찌개", 250, 15.0], ["🍲", "된장찌개", 180, 11.0], ["🥓", "삼겹살(200g)", 660, 34.0], ["🌶️", "제육볶음", 480, 28.0], ["🥩", "불고기(1인분)", 400, 30.0], ["🍗", "닭갈비(1인분)", 520, 34.0], ["🍜", "짜장면", 700, 20.0], ["🌶️", "짬뽕", 540, 24.0], ["🌶️", "떡볶이(1인분)", 480, 10.0], ["🍜", "라면", 500, 10.0], ["🍙", "김밥(1줄)", 320, 8.0], ["🍔", "햄버거", 540, 28.0], ["🍕", "피자(2조각)", 560, 22.0], ["🍗", "치킨(1/2마리)", 800, 45.0], ["🍗", "삼계탕", 600, 45.0], ["🍲", "순두부찌개", 280, 16.0], ["🍌", "바나나", 105, 1.0], ["🍎", "사과", 95, 0.0], ["🍠", "고구마(중1개)", 130, 2.0], ["☕", "아메리카노", 10, 0.0], ["🥤", "라떼", 150, 8.0], ["🍶", "소주(1병)", 400, 0.0], ["🍺", "맥주(500ml)", 215, 2.0], ["🍷", "와인(1잔)", 125, 0.0], ["🥃", "하이볼", 180, 0.0], ["🥟", "비비고 왕교자(4개)", 230, 8.0], ["🍚", "햇반(1공기)", 300, 6.0], ["🍜", "신라면(1봉)", 500, 11.0], ["🥫", "스팸(1/2캔)", 170, 7.0], ["🍬", "팝타르트(1개)", 200, 2.0], ["🥔", "프링글스(1/2통)", 300, 3.0], ["🍫", "초코파이(1개)", 170, 2.0], ["🍦", "아이스크림", 270, 5.0], ["🍨", "하겐다즈(1컵)", 290, 5.0], ["🍽️", "돈까스", 650, 28.0], ["🍣", "초밥(모둠10점)", 500, 24.0], ["🍚", "규동(소고기덮밥)", 620, 26.0], ["🥬", "쌈밥정식", 550, 20.0], ["🥩", "보쌈(1인분)", 520, 40.0], ["🍖", "족발(1인분)", 550, 45.0], ["🥚", "계란(1개)", 78, 6.0], ["🍳", "계란프라이(1개)", 95, 6.0], ["🍳", "스크램블드에그(3개)", 280, 20.0], ["🍗", "닭가슴살(100g)", 165, 31.0], ["🍠", "삶은고구마+계란", 220, 9.0], ["🥣", "오트밀+우유", 280, 12.0], ["🍫", "프로틴바", 200, 20.0], ["🥜", "견과류(한줌)", 180, 5.0], ["🥤", "제로콜라", 2, 0.0], ["🍚", "백미밥 100g", 140, 3.0], ["🍚", "백미밥 150g", 210, 4.0], ["🍚", "백미밥 200g", 280, 5.0], ["🍚", "현미밥 150g", 218, 4.0], ["🍚", "현미밥 200g", 290, 6.0], ["🍗", "닭가슴살구이 150g", 248, 47.0], ["🍗", "닭가슴살구이 200g", 330, 62.0], ["🥓", "삼겹살구이 150g", 495, 26.0], ["🥩", "목살구이 200g", 480, 40.0], ["🍣", "연어회 100g", 200, 20.0], ["🍣", "참치회 100g", 130, 24.0], ["🍣", "광어회 100g", 110, 21.0], ["☕", "아메리카노(톨)", 10, 1.0], ["🥤", "카페라떼(톨)", 180, 10.0], ["🥤", "바닐라라떼(톨)", 220, 9.0], ["🥤", "카라멜마끼아또(톨)", 250, 9.0], ["🍝", "토마토 스파게티", 450, 14.0], ["🍝", "크림 스파게티", 640, 18.0], ["🍝", "로제 스파게티", 560, 16.0], ["🍝", "까르보나라 스파게티", 700, 24.0], ["🍚", "곤약밥(1공기)", 60, 2.0], ["🍜", "두부면 비빔(1팩)", 220, 20.0], ["🥗", "샐러드(채소만)", 60, 3.0], ["🥞", "프로틴팬케이크", 250, 24.0], ["🍗", "양념치킨(1/2마리)", 800, 45.0], ["🍗", "후라이드치킨(1/2마리)", 700, 48.0], ["🍔", "맥도날드 빅맥", 550, 26.0], ["🍟", "감자튀김(중)", 340, 4.0], ["🥬", "김치(1접시)", 30, 2.0], ["🍳", "계란찜", 130, 11.0], ["🍳", "계란말이", 220, 14.0], ["🥣", "미역국", 90, 7.0], ["🥣", "된장국", 100, 6.0]].map(([ic,n,c,p])=>({ic,n,c,p}));
const PLANS=[{"id": "train_kr", "day": "train", "title": "한식 집밥", "meals": {"breakfast": [["오트밀+우유", 1], ["스크램블드에그(3개)", 1], ["바나나", 1]], "lunch": [["제육볶음", 1], ["백미밥 200g", 1], ["미역국", 1], ["김치(1접시)", 1]], "snack": [["고구마(중1개)", 1], ["그릭요거트", 1], ["프로틴쉐이크", 1], ["바나나", 1]], "dinner": [["닭가슴살구이 150g", 1], ["현미밥 200g", 1], ["계란말이", 1], ["샐러드(채소만)", 1]]}}, {"id": "train_sg", "day": "train", "title": "호커 외식", "meals": {"breakfast": [["삶은계란(2개)", 1], ["카페라떼(톨)", 1], ["바나나", 1], ["프로틴바", 1]], "lunch": [["차슈라이스", 1], ["계란(1개)", 1]], "snack": [["프로틴쉐이크", 1], ["견과류(한줌)", 1], ["그릭요거트", 1]], "dinner": [["치킨라이스", 1], ["바쿠테", 1], ["백미밥 200g", 1]]}}, {"id": "rest_kr", "day": "rest", "title": "한식 집밥", "meals": {"breakfast": [["스크램블드에그(3개)", 1], ["오트밀+우유", 1], ["계란(1개)", 1]], "lunch": [["불고기(1인분)", 1], ["백미밥 200g", 1], ["된장국", 1], ["김치(1접시)", 1]], "snack": [["그릭요거트", 1], ["프로틴쉐이크", 1], ["고구마(중1개)", 1]], "dinner": [["연어구이(150g)", 1], ["현미밥 150g", 1], ["계란찜", 1], ["샐러드(채소만)", 1]]}}, {"id": "rest_sg", "day": "rest", "title": "호커 외식", "meals": {"breakfast": [["삶은계란(2개)", 1], ["카페라떼(톨)", 1], ["바나나", 1], ["프로틴바", 1]], "lunch": [["로스트덕라이스", 1]], "snack": [["프로틴쉐이크", 1], ["그릭요거트", 1], ["견과류(한줌)", 1]], "dinner": [["바쿠테", 1], ["백미밥 200g", 1], ["닭가슴살(150g)", 1]]}}];
const SLOTS=[['breakfast','아침','🌅'],['lunch','점심','☀️'],['snack','간식','🍌'],['dinner','저녁','🌙']];
const DOW=['월','화','수','목','금','토','일'];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>Math.round(x).toLocaleString();

/* ── 날짜 ── */
const pad=n=>String(n).padStart(2,'0');
const isoOf=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayISO=()=>isoOf(new Date());
const addDays=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return isoOf(d);};
const dowOf=s=>(new Date(s+'T12:00:00').getDay()+6)%7;
const label=s=>`${+s.slice(5,7)}.${+s.slice(8)} (${DOW[dowOf(s)]})`;

/* ── 저장 ── */
/* 체중은 범위로 관리: 78~79kg 유지. 예전 '목표 76 · 상한 78' 설정은 버리고 새 범위로 바꾼다 */
function blank(){return {v:1,set:{ht:175,age:33,adj:0,lo:78,hi:79},days:{},weights:{},custom:[]};}
function fixSet(d){const b=blank(),st={...b.set,...(d.set||{})};if(!(d.set&&d.set.lo>0)){st.lo=b.set.lo;st.hi=b.set.hi;}delete st.goal;delete st.cap;return {...b,...d,set:st};}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d&&d.v===1)return fixSet(d);}catch(e){}return blank();}
let N=load(), view=todayISO(), planDay=null, slotPick=null, chosen=null, mult=1;
function save(){try{localStorage.setItem(KEY,JSON.stringify(N));return true;}catch(e){return false;}}

/* ── 목표 ── */
function weightAvg(end,days=7){const v=[];for(let i=0;i<days;i++){const w=N.weights[addDays(end,-i)];if(w)v.push(w);}return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;}
function railBw(){const T=root.Training;return T?T.read().bw:78;}
function bw(){return weightAvg(todayISO())||railBw();}
function bmr(){return 10*bw()+6.25*N.set.ht-5*N.set.age+5;}           /* Mifflin-St Jeor (남성) */
function tdee(){return bmr()*1.55;}                                    /* 주 5회 웨이트 = 보통 활동 */
const isTrain=s=>{const st=root.Training&&root.Training.state.start;if(st&&s<st)return false;return dowOf(s)<5;}; /* 월~금 훈련, 토·일·플랜 시작 전은 휴식 */
const MODES={
  cut: {label:'감량',  train:-200, rest:-450, prot:2.2, why:'유지 범위보다 무거워서 하루 평균 약 270kcal 적게 먹어요. 한 달에 1kg 정도 빠지는 속도라 근력은 지킬 수 있어요. 범위 안으로 들어오면 자동으로 유지 모드.'},
  hold:{label:'유지',  train:+150, rest:-250, prot:2.0, why:'유지 범위 안이라 훈련일엔 조금 더, 쉬는 날엔 조금 덜 먹어서 일주일 합계를 유지 칼로리에 맞춰요. 체중은 그대로, 힘만 올립니다.'},
  gain:{label:'증량',  train:+300, rest:0,    prot:2.0, why:'유지 범위보다 가벼워서 훈련일에 300kcal 더 먹어요. 한 달에 0.5~1kg 붙는 속도. 범위에 들어오면 자동으로 유지 모드.'}
};
const RANGE=()=>({lo:N.set.lo||78,hi:N.set.hi||79});
/* 7일 평균이 범위 위면 감량, 아래면 증량, 안이면 유지 */
function mode(){const a=bw(),{lo,hi}=RANGE();if(a>hi)return 'cut';if(a<lo)return 'gain';return 'hold';}
function kcalTarget(s){const m=MODES[mode()];return Math.round((tdee()+(isTrain(s)?m.train:m.rest)+(N.set.adj||0))/50)*50;}
function proteinTarget(){return Math.round(bw()*MODES[mode()].prot);}
function targets(){return {train:kcalTarget('2026-10-19'),rest:kcalTarget('2026-10-24'),protein:proteinTarget(),tdee:Math.round(tdee()),bmr:Math.round(bmr()),mode:mode(),...RANGE()};}

/* ── 기록 ── */
function dayOf(s,create){if(!N.days[s]&&create)N.days[s]={breakfast:[],lunch:[],snack:[],dinner:[]};return N.days[s];}
function totals(s){const d=N.days[s];let c=0,p=0;if(d)SLOTS.forEach(([k])=>(d[k]||[]).forEach(it=>{c+=it.c*it.q;p+=it.p*it.q;}));return {c:Math.round(c),p:Math.round(p)};}
function addItem(s,slot,f,q){dayOf(s,true)[slot].push({ic:f.ic||'🍽️',n:f.n,c:+f.c,p:+f.p||0,q:+q||1});save();}
function planTotals(pl){let c=0,p=0;Object.values(pl.meals).forEach(a=>a.forEach(([n,q])=>{const f=FOODS.find(x=>x.n===n);c+=f.c*q;p+=f.p*q;}));return {c:Math.round(c),p:Math.round(p)};}
const food=n=>FOODS.find(x=>x.n===n);
const FLEX_DROP=['바나나','견과류(한줌)','프로틴바','고구마(중1개)'];
/* 목표와 차이가 나면 밥을 0.5공기 단위(0.5~1.5)로 조절하고, 그래도 많으면 간식 탄수화물을 뺀다 */
function fitPlan(pl,target){
  const meals={};Object.entries(pl.meals).forEach(([k,a])=>meals[k]=a.map(([n,q])=>[n,q]));
  const total=()=>Object.values(meals).flat().reduce((t,[n,q])=>t+food(n).c*q,0);
  const rice=[];Object.entries(meals).forEach(([k,a])=>a.forEach((it,i)=>{if(/밥/.test(it[0])&&!/라이스|비빔|볶음|덮밥|정식/.test(it[0]))rice.push(it);}));
  for(let guard=0;guard<12;guard++){
    const gap=target-total();if(Math.abs(gap)<90)break;
    const it=rice.find(x=>gap>0?x[1]<1.5:x[1]>0.5);if(!it)break;it[1]=Math.round((it[1]+(gap>0?0.5:-0.5))*10)/10;
  }
  for(const nm of FLEX_DROP){
    if(target-total()>-120)break;
    Object.values(meals).forEach(a=>{const i=a.findIndex(x=>x[0]===nm);if(i>=0&&target-total()<=-120)a.splice(i,1);});
  }
  const t=Object.values(meals).flat().reduce((o,[n,q])=>({c:o.c+food(n).c*q,p:o.p+food(n).p*q}),{c:0,p:0});
  return {...pl,meals,c:Math.round(t.c),p:Math.round(t.p)};
}
function planFor(id){const pl=PLANS.find(p=>p.id===id);return fitPlan(pl,kcalTarget(pl.day==='train'?'2026-10-19':'2026-10-24'));}
function addPlanMeal(pl,slot){(pl.meals[slot]||[]).forEach(([n,q])=>addItem(view,slot,food(n),q));}

/* ── 체중 추세: 최근 7일 평균 vs 2주 전 7일 평균 → 한 달 변화량 ── */
function trend(){const t=todayISO(),now=weightAvg(t),then=weightAvg(addDays(t,-14));const n=Object.keys(N.weights).filter(k=>k>addDays(t,-21)&&k<=t).length;if(!now||!then||n<10)return null;return (now-then)/14*30;}

/* ── 체중 그래프: 최근 30일, 유지 범위(띠) ── */
function weightChart(){
  const t=todayISO(),days=[...Array(30)].map((_,i)=>addDays(t,-29+i));
  const pts=days.map((s,i)=>[i,N.weights[s]]).filter(p=>p[1]);
  const {lo:g,hi:c}=RANGE();
  const vals=pts.map(p=>p[1]).concat([g,c]);
  const lo=Math.floor(Math.min(...vals)-0.5),hi=Math.ceil(Math.max(...vals)+0.5);
  const W=600,H=170,px=i=>14+i*(W-28)/29,py=v=>12+(hi-v)*(H-34)/(hi-lo);
  const line=pts.map((p,i)=>(i?'L':'M')+px(p[0]).toFixed(1)+' '+py(p[1]).toFixed(1)).join(' ');
  return `<svg class="wchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="최근 30일 체중">
    <rect x="14" y="${py(c)}" width="${W-28}" height="${Math.max(0,py(g)-py(c))}" class="wband"/>
    <line x1="14" x2="${W-14}" y1="${py(c)}" y2="${py(c)}" class="wgoal"/><text x="${W-14}" y="${py(c)-5}" text-anchor="end" class="wlab goal">${c}kg</text>
    <line x1="14" x2="${W-14}" y1="${py(g)}" y2="${py(g)}" class="wgoal"/><text x="${W-14}" y="${py(g)+14}" text-anchor="end" class="wlab goal">${g}kg</text>
    ${pts.length>1?`<path d="${line}" class="wline"/>`:''}
    ${pts.map(p=>`<circle cx="${px(p[0]).toFixed(1)}" cy="${py(p[1]).toFixed(1)}" r="3.2" class="wdot${p[1]>c?' over':p[1]<g?' under':''}"/>`).join('')}
    <text x="14" y="${H-4}" class="wlab">${+days[0].slice(5,7)}.${+days[0].slice(8)}</text><text x="${W-14}" y="${H-4}" text-anchor="end" class="wlab">오늘</text>
  </svg>${pts.length?'':'<p class="fnote">아침 체중을 기록하면 여기 선이 그려져요.</p>'}`;
}

/* ── 그리기 ── */
function bar(v,t){const pct=t?Math.min(100,v/t*100):0;return `<div class="fbar${v>t*1.05?' over':''}"><i style="width:${pct}%"></i></div>`;}
function render(){
  const host=$('pane-food');if(!host)return;
  const tg=kcalTarget(view),pt=proteinTarget(),tot=totals(view),d=N.days[view]||{},train=isTrain(view);
  const left=tg-tot.c,pleft=pt-tot.p;
  if(planDay===null)planDay=train?'train':'rest';
  const tr=trend(),avg=weightAvg(todayISO()),md=mode(),{lo,hi}=RANGE(),now=bw();
  const recent=[...Array(14)].map((_,i)=>addDays(todayISO(),-13+i));
  host.innerHTML=`
  <section class="sec food-hero">
    <div class="fnav"><button class="navbtn" data-fd="-1" aria-label="이전 날">&#8592;</button>
      <div class="fdate"><b>${label(view)}</b><span class="fpill ${train?'t':'r'}">${train?'훈련일':'휴식일'}</span>${view===todayISO()?'<span class="fpill now">오늘</span>':''}</div>
      <button class="navbtn" data-fd="1" aria-label="다음 날">&#8594;</button>${view!==todayISO()?'<button class="ghost" data-fd="today">오늘로</button>':''}</div>
    <div class="fgrid">
      <div class="fcard"><div class="flab">칼로리</div><div class="fbig">${num(tot.c)}<small> / ${num(tg)} kcal</small></div>${bar(tot.c,tg)}
        <div class="fnote">${left>0?`<b>${num(left)} kcal</b> 더 먹기`:left<-150?`<b>${num(-left)} kcal</b> 초과 — 괜찮아요, 내일 평소대로`:'<b>목표 달성</b>'}</div></div>
      <div class="fcard"><div class="flab">단백질</div><div class="fbig">${tot.p}<small> / ${pt} g</small></div>${bar(tot.p,pt)}
        <div class="fnote">${pleft>0?`<b>${pleft}g</b> 더 — 프로틴쉐이크 1잔이 30g`:'<b>목표 달성</b>'}</div></div>
    </div>
    <p class="fwhy"><span class="fpill m-${md}">${MODES[md].label} 모드</span> ${train?'훈련일':'휴식일'} 목표 = 유지 칼로리 ${num(tdee())} ${(train?MODES[md].train:MODES[md].rest)>=0?'+':'−'} ${Math.abs(train?MODES[md].train:MODES[md].rest)}${N.set.adj?` ${N.set.adj>0?'+':'−'} ${Math.abs(N.set.adj)}(직접 조정)`:''}. ${MODES[md].why} 단백질은 체중 1kg당 ${MODES[md].prot}g.</p>
  </section>

  <section class="sec">
    <div class="eyebrow">${view===todayISO()?'오늘':label(view)} 먹은 것</div>
    <div class="meals">${SLOTS.map(([k,nm,ic])=>{const a=d[k]||[];const c=a.reduce((s,x)=>s+x.c*x.q,0),p=a.reduce((s,x)=>s+x.p*x.q,0);
      return `<div class="meal"><div class="mh"><b>${ic} ${nm}</b><span>${num(c)} kcal · ${Math.round(p)}g</span><button class="ghost" data-add="${k}">+ 추가</button></div>
      ${a.length?`<ul>${a.map((x,i)=>`<li><span class="fi">${x.ic}</span><span class="fn">${esc(x.n)}${x.q!==1?` <small>× ${x.q}</small>`:''}</span><span class="fk">${num(x.c*x.q)} kcal · ${Math.round(x.p*x.q)}g</span><button class="frm" data-rm="${k}:${i}" aria-label="${esc(x.n)} 삭제">&#10005;</button></li>`).join('')}</ul>`:'<p class="fempty">아직 없음</p>'}</div>`;}).join('')}</div>
  </section>

  <section class="sec">
    <div class="eyebrow">추천 식단</div>
    <h2>이대로 먹으면 목표에 맞아요.</h2>
    <p class="body">'번' 앱과 같은 음식 목록으로 짰어요. 식사 단위로 담거나 하루 전체를 한 번에 담을 수 있어요. 간식은 <b>운동 1~2시간 전</b>에, 저녁은 운동 후 단백질 위주로.</p>
    <div class="fseg" role="group" aria-label="식단 종류"><button data-pday="train" aria-pressed="${planDay==='train'}">훈련일 (월~금)</button><button data-pday="rest" aria-pressed="${planDay==='rest'}">휴식일 (토·일)</button></div>
    <div class="plans">${PLANS.filter(p=>p.day===planDay).map(p0=>{const pl=planFor(p0.id),t={c:pl.c,p:pl.p},tgt=kcalTarget(planDay==='train'?'2026-10-19':'2026-10-24'),gap=tgt-t.c;
      return `<div class="plan"><div class="ph"><b>${pl.title}</b><span>${num(t.c)} kcal · 단백질 ${t.p}g</span></div>
      <p class="fnote">${MODES[md].label} 모드 목표 ${num(tgt)} kcal에 맞춰 밥 양을 조절했어요${Math.abs(gap)>=150?` (그래도 ${num(Math.abs(gap))} kcal ${gap>0?'부족':'초과'})`:''}.</p>
      ${SLOTS.map(([k,nm,ic])=>{const a=pl.meals[k]||[];const c=a.reduce((s,[n,q])=>s+food(n).c*q,0);
        return `<div class="pm"><div class="pmh"><b>${ic} ${nm}</b><span>${num(c)} kcal</span><button class="ghost" data-plan="${pl.id}" data-slot="${k}">이 식사 담기</button></div><p>${a.map(([n,q])=>esc(n)+(q!==1?' ×'+q:'')).join(' · ')||'—'}</p></div>`;}).join('')}
      <button class="primary" data-plan-all="${pl.id}">하루 전체 담기 (${label(view)})</button></div>`;}).join('')}</div>
  </section>

  <section class="sec">
    <div class="eyebrow">체중 관리 · ${lo}~${hi}kg 유지</div>
    <h2>${md==='cut'?`${hi}kg까지 ${(now-hi).toFixed(1)}kg — 천천히 뺍니다.`:md==='gain'?`${lo}kg까지 ${(lo-now).toFixed(1)}kg — 조금 더 먹어요.`:`${lo}~${hi}kg 안이에요. 이대로 지킵니다.`}</h2>
    ${md==='cut'?`<div class="banner"><b>${hi}kg을 넘었어요.</b> 7일 평균이 ${hi}kg 아래로 내려올 때까지 감량 모드입니다.</div>`:''}
    <div class="fweight">
      <label>${label(view)} 아침 공복 <input id="fw-kg" type="number" step="0.1" min="30" max="200" inputmode="decimal" value="${N.weights[view]??''}" placeholder="${railBw()}"> kg</label>
      <button class="primary" data-act="weight">저장</button>
    </div>
    <div class="wstats">
      <div><span>7일 평균</span><b>${avg?avg.toFixed(1)+'kg':'—'}</b></div>
      <div><span>한 달 변화</span><b>${tr===null?'기록 2주 필요':(tr>0?'+':'')+tr.toFixed(1)+'kg'}</b></div>
      <div><span>유지 범위</span><b>${lo}~${hi}kg</b></div>
      <div><span>예상</span><b>${md==='cut'&&tr!==null&&tr<-0.1?`약 ${Math.max(1,Math.round((now-hi)/(-tr)*4.3))}주 뒤 ${hi}kg`:md==='gain'&&tr!==null&&tr>0.1?`약 ${Math.max(1,Math.round((lo-now)/tr*4.3))}주 뒤 ${lo}kg`:md==='cut'?'한 달에 약 −1kg':md==='gain'?'한 달에 약 +0.5~1kg':'범위 유지'}</b></div>
    </div>
    ${weightChart()}
    <div class="frecent">${recent.map(s=>{const t=totals(s),w=N.weights[s],tg2=kcalTarget(s);const has=t.c>0;const ok=has&&t.c>=tg2*0.9&&t.c<=tg2*1.1,pok=t.p>=proteinTarget();
      return `<button class="fday${s===view?' sel':''}${ok?' ok':has?' part':''}" data-go="${s}"><i>${DOW[dowOf(s)]}</i><b>${+s.slice(8)}</b><span>${has?Math.round(t.c/tg2*100)+'%':'·'}</span><span>${pok?'단백✓':''}</span>${w?`<small>${w}kg</small>`:''}</button>`;}).join('')}</div>
    <p class="fnote">초록 = 목표 칼로리 ±10% · 연한 색 = 기록은 했지만 벗어남</p>
  </section>

  <details class="sec fset"><summary>내 정보 · 계산 방식</summary>
    <div class="fweight"><label>키 <input id="fs-ht" type="number" min="140" max="220" value="${N.set.ht}"> cm</label><label>나이 <input id="fs-age" type="number" min="15" max="90" value="${N.set.age}"> 세</label><label>유지 범위 <input id="fs-lo" type="number" step="0.5" min="40" max="150" value="${lo}"> ~ <input id="fs-hi" type="number" step="0.5" min="40" max="160" value="${hi}"> kg</label><button class="ghost" data-act="set">저장</button></div>
    <p class="fnote">기초대사 ${num(bmr())} kcal (Mifflin-St Jeor) × 1.55(주 5회 웨이트) = 유지 ${num(tdee())} kcal. 체중은 7일 평균, 기록이 없으면 왼쪽 체중 칸 값. 모드: 7일 평균이 ${hi}kg보다 무거우면 감량, ${lo}kg보다 가벼우면 증량, 그 사이면 유지. 직접 조정값 ${N.set.adj>0?'+':''}${N.set.adj||0} kcal <button class="ghost" data-act="adj" data-v="-100">−100</button> <button class="ghost" data-act="adj" data-v="100">+100</button>${N.set.adj?' <button class="ghost" data-act="adj0">초기화</button>':''}.</p>
    <div class="fweight"><button class="ghost" data-act="export">식단 기록 백업</button><label class="ghost fimport">백업 불러오기 <input id="fs-import" type="file" accept="application/json" hidden></label></div>
  </details>`;
  const T=root.Training;if(T&&$('fCalHi')){const t2=targets();$('fCalHi').textContent=num(t2.train);$('fCalLo').textContent=num(t2.rest);$('fProtein').textContent=t2.protein+' g';}
}

/* ── 음식 고르기 ── */
function pickerList(q){
  const all=[...N.custom.map(f=>({...f,mine:true})),...FOODS];
  const r=all.filter(f=>f.n.includes(q.trim()));
  $('fd-list').innerHTML=r.length?r.map(f=>`<button class="fopt" data-pick="${esc(f.n)}"><span>${f.ic||'🍽️'}</span><b>${esc(f.n)}${f.mine?' <small>내 음식</small>':''}</b><span>${f.c} kcal · ${f.p}g</span></button>`).join(''):'<p class="fempty">검색 결과 없음 — 아래 「직접 추가」</p>';
}
function closeDlg(){const d=$('food-dialog');if(d.close)d.close();else d.removeAttribute('open');}
function openPicker(slot){
  slotPick=slot;chosen=null;mult=1;
  const nm=SLOTS.find(s=>s[0]===slot)[1];
  $('fd-title').textContent=`${label(view)} ${nm}에 추가`;
  $('fd-search').value='';$('fd-portion').hidden=true;$('fd-browse').hidden=false;pickerList('');
  const dlg=$('food-dialog');if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');
}
function portion(){
  $('fd-pname').textContent=`${chosen.ic||'🍽️'} ${chosen.n}`;
  $('fd-pkcal').textContent=`${num(chosen.c*mult)} kcal · 단백질 ${Math.round(chosen.p*mult)}g`;
  document.querySelectorAll('[data-mult]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.mult===mult)));
}

/* ── 이벤트 ── */
document.addEventListener('click',e=>{
  const t=e.target.closest?e.target.closest('button,[data-go]'):null;if(!t)return;
  if(!t.closest('#pane-food')&&!t.closest('#food-dialog'))return;
  if(t.dataset.fd){view=t.dataset.fd==='today'?todayISO():addDays(view,+t.dataset.fd);planDay=null;render();}
  else if(t.dataset.go){view=t.dataset.go;planDay=null;render();}
  else if(t.dataset.add)openPicker(t.dataset.add);
  else if(t.dataset.rm){const [k,i]=t.dataset.rm.split(':');N.days[view][k].splice(+i,1);save();render();}
  else if(t.dataset.pday){planDay=t.dataset.pday;render();}
  else if(t.dataset.plan){addPlanMeal(planFor(t.dataset.plan),t.dataset.slot);render();}
  else if(t.dataset.planAll){const pl=planFor(t.dataset.planAll);SLOTS.forEach(([k])=>addPlanMeal(pl,k));render();}
  else if(t.dataset.pick){const n=t.dataset.pick;chosen=N.custom.find(f=>f.n===n)||FOODS.find(f=>f.n===n);mult=1;$('fd-browse').hidden=true;$('fd-portion').hidden=false;$('fd-mult').value='';portion();}
  else if(t.dataset.mult){mult=+t.dataset.mult;$('fd-mult').value='';portion();}
  else if(t.dataset.act==='back'){$('fd-portion').hidden=true;$('fd-browse').hidden=false;}
  else if(t.dataset.act==='confirm'&&chosen){addItem(view,slotPick,chosen,mult);closeDlg();render();}
  else if(t.dataset.act==='custom'){const n=$('fc-n').value.trim(),c=+$('fc-c').value,p=+$('fc-p').value||0;
    if(!n||!(c>0)){$('fc-err').textContent='이름과 칼로리를 넣어주세요.';return;}
    const f={ic:'🍽️',n,c,p};if(!N.custom.find(x=>x.n===n))N.custom.unshift(f);addItem(view,slotPick,f,1);closeDlg();render();}
  else if(t.dataset.act==='weight'){const v=+$('fw-kg').value;if(!(v>=30&&v<=200))return;N.weights[view]=Math.round(v*10)/10;save();
    const T=root.Training,a=weightAvg(todayISO());if(T&&a){T.inputs.bw.value=Math.round(a*2)/2;T.render();}render();}
  else if(t.dataset.act==='adj'){N.set.adj=(N.set.adj||0)+(+t.dataset.v);save();render();}
  else if(t.dataset.act==='adj0'){N.set.adj=0;save();render();}
  else if(t.dataset.act==='set'){const ht=+$('fs-ht').value,age=+$('fs-age').value,lo2=+$('fs-lo').value,hi2=+$('fs-hi').value;if(ht>=140&&ht<=220)N.set.ht=ht;if(age>=15&&age<=90)N.set.age=age;if(lo2>=40&&hi2<=160&&hi2>lo2){N.set.lo=lo2;N.set.hi=hi2;}save();render();const T=root.Training;if(T)T.render();}
  else if(t.dataset.act==='export'){const b=new Blob([JSON.stringify(N,null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`3대500-식단-${todayISO()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
});
document.addEventListener('input',e=>{
  if(e.target.id==='fd-search')pickerList(e.target.value);
  if(e.target.id==='fd-mult'&&chosen){const v=+e.target.value;if(v>0){mult=v;portion();}}
});
document.addEventListener('change',e=>{
  if(e.target.id!=='fs-import'||!e.target.files[0])return;
  e.target.files[0].text().then(txt=>{try{const d=JSON.parse(txt);if(d&&d.v===1&&d.days){N=fixSet(d);save();render();}}catch(err){}});
});
document.addEventListener('training-render',render);

root.Nutrition={targets,render,FOODS,PLANS,planFor,mode,_state:()=>N,_setView:s=>{view=s;planDay=null;render();}};
render();
})(typeof window!=='undefined'?window:globalThis);
