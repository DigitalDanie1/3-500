/* 텔레그램 봇 테스트 — 네트워크 없음: fetch는 전부 가짜(텔레그램·Upstash), 토큰은 실행 때마다 새로 만든 임의 문자열 */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom');
const C=require('../core.js'),P=require('../plan-data.js');
const plan=require('../api/_lib/plan.js'),bot=require('../api/_lib/bot.js'),{createStore}=require('../api/_lib/store.js');
const telegramRoute=require('../api/telegram.js'),cronRoute=require('../api/cron.js'),setupRoute=require('../api/setup.js');
const dir=path.join(__dirname,'..');

const TOKEN='T'+crypto.randomBytes(12).toString('hex'),SECRET=crypto.createHash('sha256').update(TOKEN).digest('hex').slice(0,32);
const KV_URL='https://kv.example.test',KV_TOKEN='K'+crypto.randomBytes(8).toString('hex');
const ENV_KEYS=['TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID','KV_REST_API_URL','KV_REST_API_TOKEN','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','CRON_SECRET','VERCEL_PROJECT_PRODUCTION_URL'];
/* 테스트마다 환경변수를 깨끗이 시작하고 끝나면 되돌린다 */
const envSnap=new WeakMap(),fetchSnap=new WeakMap();
function withEnv(t,vars={}){
  if(!envSnap.has(t)){const old={};for(const k of ENV_KEYS)old[k]=process.env[k];envSnap.set(t,old);t.after(()=>{for(const k of ENV_KEYS){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}});}
  for(const k of ENV_KEYS)delete process.env[k];Object.assign(process.env,vars);
}
const jres=(obj,status=200)=>({ok:status<400,status,json:async()=>obj});
/* 가짜 fetch: 텔레그램은 {ok:true}, Upstash는 메모리 Map. 그 밖의 주소는 막는다 */
function mockFetch(t,{kvFail=false,tgReply}={}){
  if(!fetchSnap.has(t)){const orig=global.fetch;fetchSnap.set(t,orig);t.after(()=>{global.fetch=orig;});}
  const calls=[],kv=new Map();
  global.fetch=async(url,opts={})=>{
    url=String(url);const body=opts.body?JSON.parse(opts.body):null;calls.push({url,opts,body});
    if(url.startsWith('https://api.telegram.org/bot'))return jres(tgReply?tgReply(url,body):{ok:true,result:true});
    if(url===KV_URL){
      if(kvFail)return jres({error:'ERR boom'},500);
      const [cmd,key,val]=body;
      if(cmd==='GET')return jres({result:kv.has(key)?kv.get(key):null});
      if(cmd==='SET'){kv.set(key,val);return jres({result:'OK'});}
    }
    throw new Error('network blocked in tests: '+url);
  };
  const sends=()=>calls.filter(c=>c.url.endsWith('/sendMessage'));
  return {calls,kv,sends,state:()=>kv.has('bot:state')?JSON.parse(kv.get('bot:state')):null};
}
function fakeRes(){const r={statusCode:0,headers:{},body:'',setHeader(k,v){r.headers[k.toLowerCase()]=v;},end(b){r.body=b||'';}};Object.defineProperty(r,'json',{get(){return JSON.parse(r.body);}});return r;}
const fakeReq=(method,headers={},body)=>({method,headers,body});
const hook=(chat,text)=>({update_id:1,message:{message_id:1,chat:{id:chat,type:'private'},from:{id:chat},text}});

/* 메모리 저장소 (store.js와 같은 인터페이스) */
function memStore({configured=true,state=null}={}){
  let saved=state;
  const s={configured,saves:0,get state(){return saved;},
    async load(date){return plan.normalizeState(saved?JSON.parse(JSON.stringify(saved)):null,date);},
    async save(st){if(!configured)return {saved:false};saved=JSON.parse(JSON.stringify(st));s.saves++;return {saved:true};}};
  return s;
}
const fakeTg=()=>{const tg={sent:[],async send(chat,text){tg.sent.push({chat:String(chat),text});}};return tg;};
const sg=s=>new Date(s.replace(' ','T')+':00+08:00');   /* 싱가포르 시각 → Date */
const ctx=(opts={})=>({store:memStore(opts),tg:fakeTg()});
async function say(c,text,now,chat=1){const r=await bot.handleUpdate(hook(chat,text),{now,store:c.store,tg:c.tg,env:{}});return r.replies.join('\n---\n');}
const start=async(c,now)=>say(c,'/start',now);
const fresh=()=>plan.defaultState('2026-10-19');   /* 사이트와 같이 1주차(사이클 1)에서 시작한 상태 */
const owned=(s=fresh())=>({...s,owner:'1'});          /* 채팅 1번이 주인인 상태 */

/* ---------- 웹훅: 비밀 헤더 ---------- */
test('웹훅: 비밀 헤더가 틀리거나 없으면 401, 맞으면 200 (본문은 객체여도 문자열이어도 됨)',async t=>{
  withEnv(t,{TELEGRAM_BOT_TOKEN:TOKEN,KV_REST_API_URL:KV_URL,KV_REST_API_TOKEN:KV_TOKEN});
  const f=mockFetch(t);
  for(const headers of [{},{'x-telegram-bot-api-secret-token':'nope'},{'x-telegram-bot-api-secret-token':SECRET.slice(0,31)},{'x-telegram-bot-api-secret-token':SECRET+'0'}]){
    const res=fakeRes();await telegramRoute(fakeReq('POST',headers,hook(7,'/start')),res);assert.equal(res.statusCode,401);
  }
  assert.equal(f.calls.length,0,'401이면 저장소·텔레그램을 건드리지 않는다');
  let res=fakeRes();await telegramRoute(fakeReq('GET',{'x-telegram-bot-api-secret-token':SECRET}),res);assert.equal(res.statusCode,405);
  res=fakeRes();await telegramRoute(fakeReq('POST',{'x-telegram-bot-api-secret-token':SECRET},hook(7,'/start')),res);
  assert.equal(res.statusCode,200);assert.deepEqual(res.json,{ok:true});
  const sent=f.sends();assert.equal(sent.length,1);
  assert.equal(sent[0].url,`https://api.telegram.org/bot${TOKEN}/sendMessage`);
  assert.equal(sent[0].body.chat_id,'7');assert.equal(sent[0].body.parse_mode,'HTML');assert.equal(sent[0].body.disable_web_page_preview,true);
  assert.equal(f.state().owner,'7');
  res=fakeRes();await telegramRoute(fakeReq('POST',{'x-telegram-bot-api-secret-token':SECRET},JSON.stringify(hook(7,'/help'))),res);
  assert.equal(res.statusCode,200);assert.equal(f.sends().length,2);
});
test('웹훅: 토큰 환경변수가 없으면 500, 내부 오류가 나도 텔레그램에는 200',async t=>{
  withEnv(t,{});
  mockFetch(t);
  let res=fakeRes();await telegramRoute(fakeReq('POST',{'x-telegram-bot-api-secret-token':SECRET},hook(7,'/start')),res);assert.equal(res.statusCode,500);
  withEnv(t,{TELEGRAM_BOT_TOKEN:TOKEN,KV_REST_API_URL:KV_URL,KV_REST_API_TOKEN:KV_TOKEN});
  const f=mockFetch(t,{kvFail:true});
  const err=console.error;let logged='';console.error=(...a)=>{logged+=a.join(' ');};t.after(()=>{console.error=err;});
  res=fakeRes();await telegramRoute(fakeReq('POST',{'x-telegram-bot-api-secret-token':SECRET},hook(7,'/today')),res);
  assert.equal(res.statusCode,200);
  assert.match(f.sends()[0].body.text,/문제가 생겼어요/);
  assert.ok(logged.length>0&&!logged.includes(TOKEN)&&!logged.includes(KV_TOKEN));
  res=fakeRes();await telegramRoute(fakeReq('POST',{'x-telegram-bot-api-secret-token':SECRET},'{깨진 json'),res);assert.equal(res.statusCode,200);
});

/* ---------- 주인 잠금 ---------- */
test('/start가 주인을 정하고 오늘 운동을 보내며, 다른 채팅은 "개인용 봇이에요."만 받는다',async()=>{
  const c=ctx(),now=sg('2026-10-22 08:00');
  const r=await start(c,now);
  assert.match(r,/3대 500/);assert.match(r,/💪 10\/22 \(목\) · 어깨 · 팔/);assert.match(r,/오버헤드 프레스/);
  assert.equal(c.store.state.owner,'1');
  const saves=c.store.saves,before=JSON.stringify(c.store.state);
  assert.equal(await say(c,'/start',now,2),'개인용 봇이에요.');
  assert.equal(await say(c,'/1rm 스쿼트 200',now,2),'개인용 봇이에요.');
  assert.equal(await say(c,'오늘',now,2),'개인용 봇이에요.');
  assert.equal(c.store.saves,saves);assert.equal(JSON.stringify(c.store.state),before);
  assert.deepEqual(c.tg.sent.slice(1).map(x=>[x.chat,x.text]),[['2','개인용 봇이에요.'],['2','개인용 봇이에요.'],['2','개인용 봇이에요.']]);
  assert.match(await say(c,'/today',now,1),/어깨 · 팔/);   /* 주인은 계속 사용 */
});
test('주인이 없을 때: /start 외에는 안내만, 저장소가 없으면 잠글 수 없다고 알리고, TELEGRAM_CHAT_ID로도 잠글 수 있다',async()=>{
  const now=sg('2026-10-22 08:00');
  let c=ctx();assert.match(await say(c,'/today',now),/먼저 \/start/);assert.equal(c.store.state,null);
  c=ctx({configured:false});
  const r=await start(c,now);assert.match(r,/저장소\(Upstash Redis\)가 아직 연결 안 돼서 저장 못 했어요/);assert.match(r,/어깨 · 팔/);assert.equal(c.store.saves,0);
  c=ctx({configured:false});
  const out=await bot.handleUpdate(hook(9,'/today'),{now,store:c.store,tg:c.tg,env:{TELEGRAM_CHAT_ID:'5'}});
  assert.deepEqual(out.replies,['개인용 봇이에요.']);
  const ok=await bot.handleUpdate(hook(5,'/today'),{now,store:c.store,tg:c.tg,env:{TELEGRAM_CHAT_ID:'5'}});
  assert.match(ok.replies[0],/어깨 · 팔/);
  assert.deepEqual((await bot.handleUpdate({edited_message:{chat:{id:5},text:'x'}},{now,store:c.store,tg:c.tg,env:{}})).replies,[]);
});

/* ---------- 사이트와 같은 숫자 ---------- */
function boot(storage={}){const dom=new JSDOM(fs.readFileSync(path.join(dir,'index.html'),'utf8'),{url:'https://example.test',runScripts:'outside-only'});const w=dom.window;w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};for(const [k,v] of Object.entries(storage))w.localStorage.setItem(k,JSON.stringify(v));for(const file of ['core.js','plan-data.js','guides.js','legacy.js','app.js','food.js','videos.js'])w.eval(fs.readFileSync(path.join(dir,file),'utf8'));return dom;}
function click(w,s){const el=w.document.querySelector(s);assert.ok(el,'Missing '+s);el.click();}
const siteStorage=(extra={})=>({'bigthree500.v1':{sq:140,bp:105,dl:135,ohp:65,bw:78},'bigthree500.week.v1':{week:1,start:'2026-10-19',checks:{}},'bigthree500.tm.v1':{sq:{b:140,c:1},bp:{b:105,c:1},dl:{b:135,c:1},ohp:{b:65,c:1}},...extra});
test('사이트와 일치: 1~6주차·9주차의 모든 날 운동 이름·무게·세트·횟수가 사이트(app.js)가 만든 세션과 같다',()=>{
  const weeks=[1,2,3,4,5,6,9],dom=boot(siteStorage()),w=dom.window;
  try{
    for(const wk of weeks){w.Training.goWeek(wk);for(let i=0;i<5;i++){click(w,`[data-action="pick-day"][data-day="${i}"]`);click(w,'[data-action="start"]');}}
    const sessions=Object.values(JSON.parse(w.localStorage.getItem('bigthree500.training.v2')).sessions);
    assert.equal(sessions.length,weeks.length*5);
    const state=fresh();
    for(const s of sessions){
      const mine=plan.sessionFor(s.date,state);
      assert.ok(mine,'봇에 세션 없음 '+s.date);
      assert.equal(mine.week,s.week,s.date);assert.equal(mine.idx,s.day,s.date);
      assert.deepEqual(mine.items.map(x=>x.name),s.exercises.map(x=>x.name),'종목 목록 '+s.date);
      const text=plan.dayMessage(s.date,state);
      assert.ok(text.includes(`${s.week}주차`));
      s.exercises.forEach((e,i)=>{
        const it=mine.items[i],label=`${s.date} ${e.name}`;
        assert.equal(it.kg,e.kg,label+' kg');assert.equal(it.sets,e.sets,label+' sets');assert.equal(it.reps,e.reps,label+' reps');assert.equal(it.main,e.main,label+' main');
        if(it.plan){
          assert.deepEqual(it.plan.map(p=>[p.kg,p.reps,!!p.amrap]),e.rows.map(r=>[r.kg,r.reps,!!r.amrap]),label+' 세트별');
          e.rows.forEach((r,ri)=>assert.ok(text.includes(`${ri+1}세트 ${r.kg}kg ${r.amrap?`최대한 (최소 ${r.reps}회)`:`${r.reps}회`}`),`${label} 메시지 ${ri+1}세트`));
          assert.ok(text.includes(`(기준값 ${it.tm}kg)`));
        }else assert.ok(text.includes(`${e.sets}세트 × ${e.reps}회`)&&(e.kg==null||text.includes(` ${e.kg}kg`)),label+' 메시지');
      });
    }
    /* 증량 확인: 5주차(2번째 사이클)는 스쿼트·데드 +5, 벤치·OHP +2.5 */
    const t1=plan.tmFor(state,1),t5=plan.tmFor(state,5),t9=plan.tmFor(state,9);
    assert.deepEqual({...t1},{sq:125,bp:95,dl:122.5,ohp:57.5});
    assert.deepEqual({sq:t5.sq-t1.sq,bp:t5.bp-t1.bp,dl:t5.dl-t1.dl,ohp:t5.ohp-t1.ohp},{sq:5,bp:2.5,dl:5,ohp:2.5});
    assert.deepEqual({sq:t9.sq-t1.sq,bp:t9.bp-t1.bp,dl:t9.dl-t1.dl,ohp:t9.ohp-t1.ohp},{sq:10,bp:5,dl:10,ohp:5});
    assert.deepEqual({...w.Training.tmFor(5)},{...t5});assert.deepEqual({...w.Training.tmFor(9)},{...t9});
    const mon5=sessions.find(s=>s.week===5&&s.day===0),sq5=mon5.exercises[0];
    assert.deepEqual(sq5.rows.map(r=>r.kg),[85,97.5,110]);   /* 5주차(사이클 2의 1주차) 스쿼트: TM 130 × 65·75·85% */
  }finally{w.close();}
});
test('사이트와 일치: 1RM을 바꾸면 사이트와 봇이 똑같이 그 사이클부터 증량을 다시 센다',()=>{
  const monday=d=>{d=new Date(d);d.setDate(d.getDate()-((d.getDay()+6)%7));return C.iso(d);};
  const now=new Date(),mon=monday(now);
  for(const [back,date] of [[0,'2026-10-19'],[4,'2026-11-16']]){   /* 사이클 1 / 사이클 2(5주차)에서 변경 */
    const start=C.add(mon,-7*back*1),dom=boot(siteStorage({'bigthree500.week.v1':{week:1+back,start,checks:{}},'bigthree500.tm.v1':{sq:{b:140,c:1},bp:{b:105,c:1},dl:{b:135,c:1},ohp:{b:65,c:1}}})),w=dom.window;
    try{
      const T=w.Training;
      /* 사이트: 시작일 = 이번 주 월요일 − back주 → realWeek = 1+back. tm 기록은 사이클 1 기준으로 심어 둠 */
      T.inputs.bp.value=110;T.inputs.sq.value=150;T.render();
      let st=fresh();st=plan.setValue(st,'bp',110,date);st=plan.setValue(st,'sq',150,date);
      for(const wk of [1+back,5+back,9+back,13+back])assert.deepEqual({...plan.tmFor(st,wk)},{...T.tmFor(wk)},`date ${date} week ${wk}`);
    }finally{w.close();}
  }
});

/* ---------- /1rm ---------- */
test('/1rm: 최대 무게를 저장하고 기준값을 다시 잡아 다음 처방이 바뀐다 (사이클 안/뒤)',async()=>{
  const c=ctx({state:owned()}),now=sg('2026-10-22 10:00');
  const before=plan.dayMessage('2026-10-26',c.store.state);
  assert.match(before,/1세트 87\.5kg 3회/);   /* 기준값 125 → 70% */
  const r=await say(c,'/1rm 스쿼트 145',now);
  assert.equal(c.store.state.rec.sq,145);assert.deepEqual(c.store.state.base.sq,{b:145,c:1});
  assert.match(r,/145kg/);assert.match(r,/기준값은 130kg/);
  const want=C.mainSets(C.tmOf(145),P.WAVE[1]).map(s=>s.kg);assert.deepEqual(want,[90,105,117.5]);
  want.forEach((kg,i)=>assert.ok(r.includes(`${i+1}세트 ${kg}kg ${i===2?'최대한 (최소 3회)':'3회'}`),r));
  assert.match(r,/10월 26일\(월\)/);
  assert.notEqual(plan.dayMessage('2026-10-26',c.store.state),before);
  /* 별칭·형식 */
  assert.match(await say(c,'/1rm 벤치 110kg',now),/벤치 최대 무게\(1RM\)를 110kg/);assert.equal(c.store.state.rec.bp,110);
  await say(c,'/1RM@daily3500bot 데드 140',now);assert.equal(c.store.state.rec.dl,140);
  await say(c,'/1rm OHP 67.5',now);assert.equal(c.store.state.rec.ohp,67.5);
  await say(c,'/1rm 오버헤드 70',now);assert.equal(c.store.state.rec.ohp,70);
  await say(c,'/1rm sq 142.5',now);assert.equal(c.store.state.rec.sq,142.5);
  /* 체중 */
  const bw=await say(c,'/1rm 체중 78.5',now);assert.match(bw,/체중을 78\.5kg/);assert.equal(c.store.state.bw,78.5);assert.deepEqual(c.store.state.rec,{sq:142.5,bp:110,dl:140,ohp:70});
  /* 범위 밖·형식 오류는 저장 안 함 */
  const saves=c.store.saves;
  for(const bad of ['/1rm 스쿼트 500','/1rm 스쿼트 10','/1rm 체중 20','/1rm 체중 250','/1rm 스쿼트','/1rm 런지 100','/1rm 스쿼트 abc','/1rm'])assert.match(await say(c,bad,now),/\/1rm|사이로/,bad);
  assert.equal(c.store.saves,saves);
  /* 사이클 2(5주차)에서 바꾸면 그 사이클부터 다시 센다 */
  const c2=ctx({state:owned()});
  await say(c2,'/1rm 스쿼트 150',sg('2026-11-16 10:00'));
  assert.deepEqual(c2.store.state.base.sq,{b:150,c:2});
  assert.equal(plan.tmFor(c2.store.state,5).sq,135);assert.equal(plan.tmFor(c2.store.state,8).sq,135);assert.equal(plan.tmFor(c2.store.state,9).sq,140);
  assert.equal(plan.tmFor(fresh(),5).sq,130);   /* 바꾸기 전엔 125+5 */
  /* 값이 그대로면 기준 기록은 그대로 */
  const c3=ctx({state:owned()});await say(c3,'/1rm 스쿼트 140',sg('2026-11-16 10:00'));assert.deepEqual(c3.store.state.base.sq,{b:140,c:1});
});
test('/1rm /amrap: 저장소가 없으면 저장 못 했다고 알린다',async()=>{
  const c=ctx({configured:false,state:null}),now=sg('2026-10-22 10:00');
  const out=await bot.handleUpdate(hook(1,'/1rm 스쿼트 145'),{now,store:c.store,tg:c.tg,env:{TELEGRAM_CHAT_ID:'1'}});
  assert.deepEqual(out.replies,['저장소(Upstash Redis)가 아직 연결 안 돼서 저장 못 했어요.']);
  const out2=await bot.handleUpdate(hook(1,'/amrap 데드 100 5'),{now,store:c.store,tg:c.tg,env:{TELEGRAM_CHAT_ID:'1'}});
  assert.deepEqual(out2.replies,['저장소(Upstash Redis)가 아직 연결 안 돼서 저장 못 했어요.']);
  assert.equal(c.store.saves,0);
});

/* ---------- /amrap ---------- */
test('/amrap: 추정 1RM이 더 높으면 올리고, 최소 횟수 미달이면 10% 낮추기 명령을 주고, 디로드 주는 바꾸지 않는다',async()=>{
  const tue=sg('2026-10-27 18:00');   /* 2주차 화요일: 벤치 3회 최소, 마지막 세트 85kg */
  const c=ctx({state:owned()});
  const up=await say(c,'/amrap 벤치 85 8',tue);
  assert.equal(C.amrap(85,8),107.5);
  assert.equal(c.store.state.rec.bp,107.5);assert.deepEqual(c.store.state.base.bp,{b:107.5,c:1});
  assert.match(up,/105 → 107\.5kg/);
  assert.deepEqual(c.store.state.log,[{lift:'bp',kg:85,reps:8,est:107.5,date:'2026-10-27'}]);
  assert.equal(plan.tmFor(c.store.state,2).bp,C.tmOf(107.5));
  /* 미달 → 1RM 그대로 + 바로 보낼 수 있는 /1rm 명령 */
  const low=ctx({state:owned()});
  const miss=await say(low,'/amrap 벤치 85 2',tue);
  assert.equal(low.store.state.rec.bp,105);assert.match(miss,/최소 3회를 못 채웠어요/);assert.match(miss,/^\/1rm 벤치 95$/m);
  assert.equal(low.store.state.log.length,1);
  await say(low,'/1rm 벤치 95',tue);assert.equal(low.store.state.rec.bp,95);assert.deepEqual(low.store.state.base.bp,{b:95,c:1});
  /* 현재 기준값이 가리키는 값보다 높지 않으면 유지 (1주차 80kg × 5회 → 추정 92.5) */
  const keep=ctx({state:owned()});
  const same=await say(keep,'/amrap 벤치 80 5',sg('2026-10-20 18:00'));
  assert.equal(C.amrap(80,5),92.5);assert.equal(keep.store.state.rec.bp,105);assert.match(same,/그대로 둘게요/);
  /* 디로드(4주차): 기록만 */
  const dl=ctx({state:owned()});
  const rec=await say(dl,'/amrap 벤치 60 15',sg('2026-11-10 18:00'));
  assert.equal(dl.store.state.rec.bp,105);assert.match(rec,/회복 주/);assert.equal(dl.store.state.log.length,1);assert.equal(dl.store.state.log[0].est,80);
  /* 사이클 2(5주차 3회 최소 1회): 기준값이 5kg 올라간 뒤에도 같은 식 — cur = TM/0.9 */
  const late=ctx({state:owned()});
  const wk7=sg('2026-12-01 18:00');   /* 7주차 화요일: 벤치 TM 97.5, 마지막 세트 .95 × 97.5 → 92.5 × 1+ */
  assert.equal(plan.weekAt('2026-12-01'),7);
  await say(late,'/amrap 벤치 92.5 7',wk7);   /* 추정 floor(92.5×(1+7/30)/2.5)×2.5 = 112.5 > cur 107.5 */
  assert.equal(late.store.state.rec.bp,112.5);assert.deepEqual(late.store.state.base.bp,{b:112.5,c:2});
  /* 잘못된 입력 */
  const bad=ctx({state:owned()});
  for(const t of ['/amrap 벤치 85','/amrap 체중 80 5','/amrap 벤치 85 0','/amrap 벤치 85 2.5','/amrap 벤치 900 5','/amrap 런지 85 5'])assert.match(await say(bad,t,tue),/\/amrap|\/1rm|사이로/,t);
  assert.equal(bad.store.saves,0);
  /* 로그는 100개까지 */
  const many=ctx({state:{...owned(),log:Array.from({length:100},(_,i)=>({lift:'sq',kg:60,reps:5,est:70,date:'2026-10-0'+(i%9+1)}))}});
  await say(many,'/amrap 벤치 80 5',sg('2026-10-20 18:00'));
  assert.equal(many.store.state.log.length,100);assert.equal(many.store.state.log.at(-1).lift,'bp');
});

/* ---------- 쉬는 날·시간대 ---------- */
test('주말·플랜 시작 전: 쉬는 날 + 다음 운동 미리보기, 내일 미리보기',async()=>{
  const c=ctx({state:owned()});
  for(const when of ['2026-10-24 09:00','2026-10-25 21:00']){
    const r=await say(c,'/today',sg(when));
    assert.match(r,/오늘은 쉬는 날이에요\./);assert.match(r,/다음 운동 미리보기/);assert.match(r,/💪 10\/26 \(월\) · 하체/);assert.match(r,/2주차 · 3회 · 3회 · 최대한/);assert.match(r,/1세트 87\.5kg 3회/);
  }
  const tm=await say(c,'내일',sg('2026-10-23 12:00'));   /* 금요일 → 토요일 */
  assert.match(tm,/😴 10\/24 \(토\)/);assert.match(tm,/내일은 쉬는 날이에요\./);assert.match(tm,/💪 10\/26 \(월\)/);
  const tm2=await say(c,'/tomorrow@daily3500bot',sg('2026-10-22 12:00'));
  assert.match(tm2,/💪 내일 · 10\/23 \(금\) · 하체 볼륨 · 약점/);
  const pre=await say(c,'/today',sg('2026-10-15 09:00'));
  assert.match(pre,/플랜 시작 전 — 10월 19일\(월\)부터/);assert.match(pre,/쉬는 날/);assert.match(pre,/💪 10\/19 \(월\) · 하체/);
  const preWeek=await say(c,'/week',sg('2026-10-15 09:00'));assert.match(preWeek,/플랜 시작 전/);assert.match(preWeek,/1주차 \(10\/19 ~ 10\/23\)/);
  assert.match(await say(c,'/status',sg('2026-10-15 09:00')),/플랜 시작 전/);
});
test('시간대: 서버 시간이 아니라 싱가포르 날짜 (UTC 23:30은 이미 다음 날)',async t=>{
  assert.equal(plan.sgToday(new Date('2026-10-22T15:59:00Z')),'2026-10-22');
  assert.equal(plan.sgToday(new Date('2026-10-22T16:00:00Z')),'2026-10-23');
  const c=ctx({state:owned()});
  const r=await say(c,'/today',new Date('2026-10-22T23:30:00Z'));   /* 싱가포르 금요일 07:30 */
  assert.match(r,/💪 10\/23 \(금\) · 하체 볼륨 · 약점/);
  const sat=await say(c,'/today',new Date('2026-10-23T16:30:00Z'));assert.match(sat,/😴 10\/24 \(토\)/);   /* UTC는 아직 금요일 */
  const sun=await say(c,'/today',new Date('2026-10-24T20:00:00Z'));assert.match(sun,/😴 10\/25 \(일\)/);
  const mon=await say(c,'/today',new Date('2026-10-25T16:00:00Z'));assert.match(mon,/💪 10\/26 \(월\)/);   /* 일요일 UTC 16시 = 월요일 00시 */
  const oldTZ=process.env.TZ;process.env.TZ='America/Los_Angeles';t.after(()=>{if(oldTZ===undefined)delete process.env.TZ;else process.env.TZ=oldTZ;});
  assert.equal(plan.sgToday(new Date('2026-10-22T23:30:00Z')),'2026-10-23');
  assert.match(await say(c,'/today',new Date('2026-10-22T23:30:00Z')),/💪 10\/23 \(금\)/);
  assert.equal(plan.weekAt('2026-10-26'),2);assert.equal(plan.weekAt('2026-11-16'),5);assert.equal(plan.weekAt('2026-10-18'),1);
});

/* ---------- 메시지 모양 ---------- */
test('명령: 한글 단어·@봇이름·/week·/status·/help·모르는 말',async()=>{
  const c=ctx({state:owned()}),now=sg('2026-10-22 10:00');
  const today=await say(c,'/today',now);
  for(const w of ['오늘','/today@daily3500bot','/TODAY','오늘!'])assert.equal(await say(c,w,now),today,w);
  const week=await say(c,'/week',now);
  assert.equal(await say(c,'이번주',now),week);assert.equal(await say(c,'이번 주',now),week);
  assert.match(week,/📅 1주차 \(10\/19 ~ 10\/23\) · 5회 · 5회 · 최대한/);assert.match(week,/목 10\/22 · 어깨 · 팔 ◀ 오늘/);
  assert.match(week,/백스쿼트 82\.5 · 95 · 107\.5kg \(마지막 세트 최대한\)/);assert.match(week,/그 외 7가지 운동/);
  assert.match(week,/금 10\/23 · 하체 볼륨 · 약점\n프론트 스쿼트 77\.5kg · 4세트 × 5회/);
  const stat=await say(c,'/status',now);assert.equal(await say(c,'기록',now),stat);
  assert.match(stat,/스쿼트 140kg/);assert.match(stat,/합계 380kg/);assert.match(stat,/500kg까지 120kg 남았어요/);assert.match(stat,/1주차 \(4주 묶음 1번째\) 기준값/);assert.match(stat,/스쿼트 125kg/);assert.match(stat,/오버헤드 프레스 57\.5kg/);
  const help=await say(c,'/help',now);assert.equal(await say(c,'도움말',now),help);assert.match(help,/\/1rm 스쿼트 145/);assert.match(help,/\/amrap 데드 107\.5 6/);
  assert.match(await say(c,'안녕 뭐해?',now),/잘 모르겠어요[\s\S]*\/help|\/today/);
  /* 상태에 마지막 세트 기록이 보인다 + 500 달성 */
  const done=ctx({state:{...owned(),rec:{sq:180,bp:120,dl:200,ohp:65}}});
  assert.match(await say(done,'/status',now),/500kg 달성/);
  await say(c,'/amrap 데드 105 6',sg('2026-10-21 18:00'));
  assert.match(await say(c,'/status',now),/10\/21 데드리프트 105kg × 6회 → 추정 /);
});
test('디로드 주 메시지: 가벼운 회복 주 안내, 최대한/기록 안내 없음',()=>{
  const m=plan.dayMessage('2026-11-11',fresh());   /* 4주차 수요일 */
  assert.match(m,/4주차 · 가벼운 회복 주 · 5회 · 5회 · 5회/);assert.match(m,/회복 주예요/);
  assert.ok(!/최대한|\/amrap/.test(m));assert.match(m,/기준값 122\.5kg\)\n1세트 50kg 5회\n2세트 62\.5kg 5회\n3세트 72\.5kg 5회/);   /* 기준값 122.5 × 40·50·60% */
  assert.ok(!/가벼운 반복\)/.test(m),'디로드엔 가벼운 반복 없음');
  assert.match(plan.weekMessage('2026-11-11',fresh()),/가벼운 회복 주/);
});
test('말투 규칙: TM·FSL·AMRAP·RPE·+ 없음, HTML은 <b>만, 모든 날·모든 응답 검사',async()=>{
  const texts=[],st=fresh();
  for(let d='2026-10-15';d<='2027-01-10';d=plan.addDays(d,1))texts.push(plan.dayMessage(d,st),plan.dayMessage(d,st,plan.addDays(d,-1)));
  for(let d='2026-10-15';d<='2027-01-10';d=plan.addDays(d,7))texts.push(plan.weekMessage(d,st),plan.statusMessage(st,d));
  const c=ctx({state:owned()}),now=sg('2026-10-27 18:00');
  for(const m of ['/start','/help','뭐라고','/1rm 스쿼트 145','/1rm 스쿼트 9999','/1rm','/amrap 벤치 85 8','/amrap 벤치 85 2','/amrap 벤치 85','/status','/week'])texts.push(await say(c,m,now));
  assert.ok(texts.length>200);
  for(const text of texts){
    assert.ok(!/\bTM\b|FSL|AMRAP|RPE|\+/.test(text),text);
    assert.ok(!/<(?!\/?b>)/.test(text)&&!/&(?!amp;|lt;|gt;)/.test(text),text);
    assert.ok(text.length<3800);
  }
  /* 동적 텍스트는 HTML 이스케이프 */
  const orig=P.DAYS[0].ex[7].n;P.DAYS[0].ex[7].n='A&B <i>';
  try{const m=plan.dayMessage('2026-10-19',st);assert.ok(m.includes('A&amp;B &lt;i&gt;')&&!m.includes('<i>'));}finally{P.DAYS[0].ex[7].n=orig;}
});

/* ---------- 크론 ---------- */
test('크론: CRON_SECRET이 있으면 Bearer 필수, 없으면 vercel-cron UA, 주인 없거나 쉬는 날이면 보내지 않는다',async t=>{
  t.mock.timers.enable({apis:['Date'],now:new Date('2026-10-21T23:00:00Z')});   /* 싱가포르 목요일 07:00 */
  withEnv(t,{TELEGRAM_BOT_TOKEN:TOKEN,KV_REST_API_URL:KV_URL,KV_REST_API_TOKEN:KV_TOKEN,CRON_SECRET:'s-'+crypto.randomBytes(6).toString('hex')});
  const f=mockFetch(t),run=async headers=>{const res=fakeRes();await cronRoute(fakeReq('GET',headers),res);return res;};
  f.kv.set('bot:state',JSON.stringify({...fresh(),owner:'42'}));
  for(const h of [{},{'user-agent':'vercel-cron/1.0'},{authorization:'Bearer wrong'},{authorization:process.env.CRON_SECRET}])assert.equal((await run(h)).statusCode,401);
  assert.equal(f.sends().length,0);
  let res=await run({authorization:`Bearer ${process.env.CRON_SECRET}`});
  assert.equal(res.statusCode,200);assert.deepEqual(res.json,{ok:true,sent:true,date:'2026-10-22'});
  assert.equal(f.sends().length,1);assert.equal(f.sends()[0].body.chat_id,'42');assert.match(f.sends()[0].body.text,/💪 10\/22 \(목\) · 어깨 · 팔/);assert.equal(f.sends()[0].body.parse_mode,'HTML');
  /* CRON_SECRET 없음 → UA */
  delete process.env.CRON_SECRET;
  assert.equal((await run({})).statusCode,401);assert.equal((await run({'user-agent':'Mozilla/5.0'})).statusCode,401);
  assert.equal((await run({'user-agent':'vercel-cron/1.0'})).statusCode,200);assert.equal(f.sends().length,2);
  /* 주인 없음 */
  f.kv.set('bot:state',JSON.stringify({...fresh(),owner:null}));
  res=await run({'user-agent':'vercel-cron/1.0'});assert.equal(res.statusCode,200);assert.ok(res.json.skipped);assert.equal(f.sends().length,2);
  f.kv.delete('bot:state');
  res=await run({'user-agent':'vercel-cron/1.0'});assert.equal(res.statusCode,200);assert.ok(res.json.skipped);assert.equal(f.sends().length,2);
  /* TELEGRAM_CHAT_ID가 주인 대신 */
  process.env.TELEGRAM_CHAT_ID='99';
  res=await run({'user-agent':'vercel-cron/1.0'});assert.equal(res.json.sent,true);assert.equal(f.sends().at(-1).body.chat_id,'99');
  /* 쉬는 날(토요일)은 건너뜀 */
  t.mock.timers.setTime(new Date('2026-10-23T23:00:00Z').getTime());   /* 싱가포르 토요일 */
  res=await run({'user-agent':'vercel-cron/1.0'});assert.equal(res.statusCode,200);assert.match(res.json.skipped,/쉬는 날/);assert.equal(f.sends().length,3);
});
test('vercel.json: 크론 하나만 (일~목 23:00 UTC = 싱가포르 월~금 07:00), 다른 설정 없음',()=>{
  const v=JSON.parse(fs.readFileSync(path.join(dir,'vercel.json'),'utf8'));
  assert.deepEqual(v,{crons:[{path:'/api/cron',schedule:'0 23 * * 0-4'}]});
});

/* ---------- 설정 ---------- */
test('/api/setup: 웹훅(비밀값·message만·대기 메시지 버림)과 명령어 등록, 토큰은 출력하지 않는다',async t=>{
  withEnv(t,{TELEGRAM_BOT_TOKEN:TOKEN,VERCEL_PROJECT_PRODUCTION_URL:'3-500.vercel.app'});
  let f=mockFetch(t);
  let res=fakeRes();await setupRoute(fakeReq('GET',{host:'preview.example'}),res);
  assert.equal(res.statusCode,200);const j=res.json;assert.equal(j.ok,true);assert.equal(j.webhook,'https://3-500.vercel.app/api/telegram');assert.equal(j.storage.configured,false);
  assert.ok(!res.body.includes(TOKEN));
  const [hook1,cmds]=f.calls;
  assert.equal(hook1.url,`https://api.telegram.org/bot${TOKEN}/setWebhook`);
  assert.deepEqual(hook1.body,{url:'https://3-500.vercel.app/api/telegram',secret_token:SECRET,allowed_updates:['message'],drop_pending_updates:true});
  assert.equal(cmds.url,`https://api.telegram.org/bot${TOKEN}/setMyCommands`);
  const names=cmds.body.commands.map(x=>x.command);
  for(const n of ['today','tomorrow','week','status','1rm','amrap','help'])assert.ok(names.includes(n),n);
  assert.ok(cmds.body.commands.every(x=>/^[a-z0-9_]{1,32}$/.test(x.command)&&/[가-힣]/.test(x.description)&&x.description.length<=256));
  /* 호스트 헤더 대체, 저장소 연결 표시 */
  withEnv(t,{TELEGRAM_BOT_TOKEN:TOKEN,UPSTASH_REDIS_REST_URL:KV_URL,UPSTASH_REDIS_REST_TOKEN:KV_TOKEN});
  f=mockFetch(t);res=fakeRes();await setupRoute(fakeReq('GET',{host:'my.host.test'}),res);
  assert.equal(res.json.webhook,'https://my.host.test/api/telegram');assert.equal(res.json.storage.configured,true);
  /* 텔레그램이 거절하면 502 + 사유 */
  f=mockFetch(t,{tgReply:()=>({ok:false,description:'Unauthorized'})});res=fakeRes();await setupRoute(fakeReq('GET',{host:'x.test'}),res);
  assert.equal(res.statusCode,502);assert.match(res.json.message,/Unauthorized/);assert.ok(!res.body.includes(TOKEN));
  /* 토큰 없음 */
  withEnv(t,{});res=fakeRes();await setupRoute(fakeReq('GET',{host:'x.test'}),res);
  assert.equal(res.statusCode,500);assert.equal(res.json.message,'TELEGRAM_BOT_TOKEN 환경변수가 없어요. Vercel → Settings → Environment Variables에 넣고 다시 배포하세요.');
});

/* ---------- 저장소 ---------- */
test('저장소: Upstash REST에 JSON 명령 배열을 Bearer로 POST, 환경변수 두 가지 이름, 없으면 기본값·쓰기 없음',async t=>{
  withEnv(t,{KV_REST_API_URL:KV_URL+'/',KV_REST_API_TOKEN:KV_TOKEN});
  const f=mockFetch(t);let s=createStore();
  assert.equal(s.configured,true);
  const d=await s.load('2026-10-19');
  assert.deepEqual(d,{owner:null,rec:{sq:140,bp:105,dl:135,ohp:65},bw:78,base:{sq:{b:140,c:1},bp:{b:105,c:1},dl:{b:135,c:1},ohp:{b:65,c:1}},log:[]});
  assert.equal((await s.load('2026-11-16')).base.sq.c,2,'처음 쓰는 날의 사이클로 기준을 잡는다');
  d.owner='3';d.log=Array.from({length:130},(_,i)=>({lift:'sq',kg:60,reps:5,est:70,date:'2026-10-19',i}));
  assert.deepEqual(await s.save(d),{saved:true});
  assert.equal(f.state().log.length,100);
  assert.equal((await s.load('2026-10-19')).owner,'3');
  const get=f.calls[0],set=f.calls[2];
  assert.equal(get.url,KV_URL);assert.equal(get.opts.method,'POST');assert.equal(get.opts.headers.Authorization,`Bearer ${KV_TOKEN}`);assert.deepEqual(get.body,['GET','bot:state']);
  assert.equal(set.body[0],'SET');assert.equal(set.body[1],'bot:state');assert.equal(typeof set.body[2],'string');
  /* 망가진 값은 정리, 읽기 실패는 던진다 */
  f.kv.set('bot:state',JSON.stringify({owner:7,rec:{sq:'x',bp:110},bw:-1,base:{bp:{b:99,c:3}},log:'?'}));
  const n=await s.load('2026-10-19');assert.deepEqual([n.owner,n.rec.sq,n.rec.bp,n.bw,n.base.bp,n.log],['7',140,110,78,{b:110,c:1},[]]);
  f.kv.set('bot:state','not json');await assert.rejects(()=>s.load('2026-10-19'));
  withEnv(t,{KV_REST_API_URL:KV_URL,KV_REST_API_TOKEN:KV_TOKEN});mockFetch(t,{kvFail:true});await assert.rejects(()=>createStore().load('2026-10-19'),/Upstash/);
  /* Upstash 이름 */
  withEnv(t,{UPSTASH_REDIS_REST_URL:KV_URL,UPSTASH_REDIS_REST_TOKEN:KV_TOKEN});const f2=mockFetch(t);s=createStore();assert.equal(s.configured,true);await s.load('2026-10-19');assert.equal(f2.calls[0].opts.headers.Authorization,`Bearer ${KV_TOKEN}`);
  /* 없음 */
  withEnv(t,{});const f3=mockFetch(t);s=createStore();assert.equal(s.configured,false);
  assert.equal((await s.load('2026-10-19')).rec.sq,140);assert.deepEqual(await s.save(d),{saved:false});assert.equal(f3.calls.length,0);
});
