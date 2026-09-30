const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../core.js');
const {JSDOM}=require('jsdom');
const dir=path.join(__dirname,'..');
function boot(storage={}){const dom=new JSDOM(fs.readFileSync(path.join(dir,'index.html'),'utf8'),{url:'https://example.test',runScripts:'outside-only'});const w=dom.window;w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};for(const [k,v] of Object.entries(storage))w.localStorage.setItem(k,JSON.stringify(v));for(const file of ['core.js','guides.js','legacy.js','app.js'])w.eval(fs.readFileSync(path.join(dir,file),'utf8'));return dom;}
function click(w,s){const el=w.document.querySelector(s);assert.ok(el,'Missing '+s);el.click();}
function change(w,s,value){const el=w.document.querySelector(s);assert.ok(el,'Missing '+s);el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}));}
test('warmups stay below work, use loadable steps and handle light bars',()=>{assert.deepEqual(C.warmup(90).map(x=>[x.kg,x.reps]),[[20,8],[35,5],[52.5,3],[70,1]]);assert.deepEqual(C.warmup(20),[]);for(const bar of [15,20])for(let kg=bar;kg<=300;kg+=2.5){const r=C.warmup(kg,bar);assert.ok(r.every((x,i)=>x.kg<kg&&x.kg>=bar&&x.kg%2.5===0&&(!i||x.kg>r[i-1].kg)));}assert.equal(C.warmup(112.5,20,true)[0].kg,40);});
test('valid dates, 8-week review and postponement',()=>{assert.equal(C.date('2026-02-30'),null);assert.equal(C.add('2026-12-20',56),'2027-02-14');assert.equal(C.due('2026-09-11','2026-09-11').date,'2026-11-06');assert.equal(C.due('2026-09-11','2026-11-07').overdue,true);assert.equal(C.due(null,'2026-09-11').unknown,true);assert.equal(C.due(null,'2026-09-11','2026-09-18').days,7);});
test('estimate validation and deload prescriptions',()=>{assert.equal(C.estimate(145,3),159.5);assert.equal(C.estimate(0,3),null);assert.equal(C.estimate(100,1),null);const p=C.prescription({main:'sq'}, {scheme:'2 × 5',pct:.55},4,{sq:130});assert.deepEqual(p,{kg:72.5,sets:2,reps:5});assert.deepEqual(C.prescription({s:'4 × 6',pct:.7,of:'bp'},{},4,{bp:100}),{kg:60,sets:2,reps:6});});
test('legacy values migrate without overwriting and tabs default to training',()=>{const dom=boot({'bigthree500.v1':{sq:150,bp:110,dl:180,bw:80}}),w=dom.window;try{assert.equal(w.Training.read().sq,150);assert.equal(w.document.getElementById('pane-week').hidden,false);assert.match(w.document.getElementById('today').textContent,/운동 시작/);assert.equal(w.document.getElementById('rTotal').textContent,'440');w.Training.goWeek(101);assert.match(w.document.getElementById('wLifts').textContent,/150kg/);}finally{w.close();}});
test('session set saves and restores, rejects blank RPE, guide opens',()=>{const dom=boot(),w=dom.window;try{click(w,'[data-action="pick-day"][data-day="0"]');click(w,'[data-action="start"]');click(w,'[data-done="0:0"]');assert.equal(w.document.querySelector('[data-done="0:0"]').checked,false);change(w,'[data-row="0:0:rpe"]','8');click(w,'[data-done="0:0"]');assert.equal(w.document.querySelector('[data-done="0:0"]').checked,true);const data=JSON.parse(w.localStorage.getItem('bigthree500.training.v2'));assert.equal(Object.values(data.sessions)[0].exercises[0].rows[0].rpe,8);click(w,'[data-guide="백스쿼트"]');assert.equal(w.document.getElementById('guide-dialog').open,true);assert.match(w.document.getElementById('guide-body').textContent,/흔한 실수/);const next=boot({'bigthree500.training.v2':data});try{click(next.window,'[data-action="pick-day"][data-day="0"]');click(next.window,'[data-action="start"]');assert.equal(next.window.document.querySelector('[data-done="0:0"]').checked,true);}finally{next.window.close();}}finally{w.close();}});
test('assessment saves actual vs estimate, updates baseline and due date',()=>{const dom=boot(),w=dom.window;try{click(w,'[data-action="test"][data-lift="dl"]');change(w,'#test-kg','145');change(w,'#test-reps','3');w.document.getElementById('test-form-check').checked=true;w.document.getElementById('test-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(w.Training.read().dl,159.5);const data=JSON.parse(w.localStorage.getItem('bigthree500.training.v2'));assert.equal(data.measurements[0].kind,'estimate');assert.match(w.document.getElementById('assessment').textContent,/56일 남음/);assert.match(w.document.getElementById('history').textContent,/추정/);click(w,'[data-action="test"][data-lift="sq"]');change(w,'#test-kind','actual');change(w,'#test-kg','140');w.document.getElementById('test-form-check').checked=true;w.document.getElementById('test-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(w.Training.read().sq,140);assert.match(w.document.getElementById('history').textContent,/실측/);}finally{w.close();}});
test('all expanded exercises have guides and no duplicate IDs',()=>{const dom=boot(),w=dom.window;try{const ids=[...w.document.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);for(let i=0;i<5;i++){click(w,`[data-action="pick-day"][data-day="${i}"]`);click(w,'[data-action="start"]');const data=JSON.parse(w.localStorage.getItem('bigthree500.training.v2'));for(const e of Object.values(data.sessions).at(-1).exercises)assert.ok(w.ExerciseGuides[e.name],e.name);}}finally{w.close();}});
function thisMonday(){const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
test('5/3/1: training max is 90% of 1RM, waves and light back-off sets (FSL), fixed increments per cycle, rebase on edit',()=>{
  const W={sets:[[.65,5],[.75,5],[.85,5,'+']]};
  assert.deepEqual(C.mainSets(C.tmOf(105),W).map(s=>[s.kg,s.reps,s.amrap]),[[62.5,5,false],[72.5,5,false],[80,5,true]]);
  assert.deepEqual(C.prescription({fsl:'bp'},W,1,{bp:105}),{sets:5,reps:5,kg:62.5});
  assert.equal(C.prescription({fsl:'bp'},{sets:[[.4,5],[.5,5],[.6,5]]},4,{bp:105}).sets,0);
  const dom=boot({'bigthree500.v1':{sq:130,bp:105,dl:160,ohp:65,bw:76},'bigthree500.week.v1':{week:1,start:thisMonday(),checks:{}}}),w=dom.window;
  try{
    const T=w.Training;
    assert.deepEqual({...T.tmFor(1)},{sq:117.5,bp:95,dl:145,ohp:57.5});
    assert.deepEqual({...T.tmFor(5)},{sq:122.5,bp:97.5,dl:150,ohp:60});
    assert.deepEqual({...T.tmFor(9)},{sq:127.5,bp:100,dl:155,ohp:62.5});
    T.inputs.bp.value=110;T.render();
    assert.equal(T.tmFor(1).bp,100);assert.equal(T.tmFor(5).bp,102.5);
    assert.match(w.document.getElementById('wLifts').textContent,/OHP/);
  }finally{w.close();}
});
test('AMRAP last set raises the baseline, flags missed minimums, and skips deload',()=>{
  assert.equal(C.amrap(85,8),107.5);assert.equal(C.amrap(85,14),112.5);assert.equal(C.amrap(0,5),null);
  const base={'bigthree500.v1':{sq:130,bp:105,dl:160,ohp:65,bw:76},'bigthree500.week.v1':{week:2,start:thisMonday(),checks:{}}};
  const dom=boot(base),w=dom.window;
  try{
    w.Training.goWeek(2);
    click(w,'[data-action="pick-day"][data-day="1"]');click(w,'[data-action="start"]');
    const rows=[...w.document.querySelectorAll('.set-row')].filter(r=>r.querySelector('[data-row^="0:"]'));
    assert.equal(rows.length,3);assert.ok(rows[2].classList.contains('amrap'));assert.ok(!rows[0].classList.contains('amrap'));
    assert.equal(w.document.querySelector('[data-row="0:2:kg"]').value,'85');
    change(w,'[data-row="0:2:kg"]','85');change(w,'[data-row="0:2:reps"]','8');change(w,'[data-row="0:2:rpe"]','10');
    click(w,'[data-done="0:2"]');
    assert.equal(w.Training.read().bp,107.5);
    assert.match(w.document.getElementById('session-feedback').textContent,/107\.5kg로 올렸습니다/);
    const m=JSON.parse(w.localStorage.getItem('bigthree500.training.v2')).measurements.at(-1);
    assert.equal(m.source,'amrap');assert.equal(m.value,107.5);
  }finally{w.close();}
  const low=boot(base),lw=low.window;
  try{
    lw.Training.goWeek(2);
    click(lw,'[data-action="pick-day"][data-day="1"]');click(lw,'[data-action="start"]');
    change(lw,'[data-row="0:2:reps"]','2');change(lw,'[data-row="0:2:rpe"]','10');
    click(lw,'[data-done="0:2"]');
    assert.equal(lw.Training.read().bp,105);
    assert.match(lw.document.getElementById('session-feedback').textContent,/최소 3회를 못 채웠습니다/);
    click(lw,'[data-reset-lift="bp"]');
    assert.equal(lw.Training.read().bp,95);
  }finally{lw.close();}
  const rec=boot({...base,'bigthree500.week.v1':{week:4,start:thisMonday(),checks:{}}}),rw=rec.window;
  try{
    rw.Training.goWeek(4);
    click(rw,'[data-action="pick-day"][data-day="1"]');click(rw,'[data-action="start"]');
    assert.equal(rw.document.querySelectorAll('.set-row.amrap').length,0);
    const data=JSON.parse(rw.localStorage.getItem('bigthree500.training.v2'));
    assert.ok(!Object.values(data.sessions).at(-1).exercises.some(e=>/가벼운 반복/.test(e.name)));
  }finally{rw.close();}
});
