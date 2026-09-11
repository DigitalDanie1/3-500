
(function(){
  var KEY = 'bigthree500.v1';

  var LIFTS = [
    {k:'sq', name:'스쿼트',    target:180, def:130},
    {k:'bp', name:'벤치',      target:120, def:100},
    {k:'dl', name:'데드리프트', target:200, def:160}
  ];

  var PHASES = [
    {lab:'페이즈 1', sub:'1~6개월 · 79kg',   sq:145,   bp:107.5, dl:172.5, bw:79},
    {lab:'페이즈 2', sub:'7~12개월 · 81kg',  sq:157.5, bp:112.5, dl:185,   bw:81},
    {lab:'페이즈 3', sub:'13~18개월 · 83kg', sq:167.5, bp:115,   dl:197.5, bw:83},
    {lab:'페이즈 4', sub:'19~24개월 · 84kg', sq:180,   bp:120,   dl:200,   bw:84}
  ];

  var WAVE = [
    {wk:'1주차', scheme:'5 × 5', pct:0.70,  note:'빠르고 가볍게. 마지막 세트에 3회는 남아야 합니다. 안 남으면 추정치가 높은 겁니다.'},
    {wk:'2주차', scheme:'5 × 4', pct:0.775, note:'바 속도는 그대로, 무게만 올립니다. RPE 7. 아직 버티는 렙은 없습니다.'},
    {wk:'3주차', scheme:'4 × 3', pct:0.85,  note:'RPE 8. 마지막 세트가 정직한 세트입니다. 블록이 먹혔는지 알려주는 주차.'},
    {wk:'4주차', scheme:'2 × 5', pct:0.55, note:'회복 주차. 모든 메인 2 × 5, 보조 2세트. 다음 블록은 기록을 검토한 뒤 시작하세요.'}
  ];

  var SIZES = [25,20,15,10,5,2.5,1.25];
  var $ = function(id){ return document.getElementById(id); };
  var inputs = {sq:$('iSq'), bp:$('iBp'), dl:$('iDl'), bw:$('iBw')};

  function r25(x){ return Math.round(x/2.5)*2.5; }
  function fmt(x){ return (Math.round(x*100)/100).toString(); }

  function plates(total){
    var per = (total - 20)/2, out = [];
    if (per <= 0) return out;
    for (var i=0;i<SIZES.length;i++){
      while (per >= SIZES[i] - 1e-6){ out.push(SIZES[i]); per = Math.round((per-SIZES[i])*100)/100; }
    }
    return out;
  }
  function plateHTML(total){
    var p = plates(total);
    if (!p.length) return '<span class="pct">바만</span>';
    var s = '';
    for (var i=0;i<p.length;i++) s += '<i data-p="'+p[i]+'">'+p[i]+'</i>';
    return s;
  }

  function read(){
    var v = {};
    ['sq','bp','dl','bw'].forEach(function(k){
      var n = parseFloat(inputs[k].value);
      if (!isFinite(n) || n <= 0) n = k==='bw' ? 76 : LIFTS.filter(function(l){return l.k===k;})[0].def;
      v[k] = n;
    });
    return v;
  }

  function save(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(e){} }
  function restore(){
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var v = JSON.parse(raw);
      ['sq','bp','dl','bw'].forEach(function(k){
        if (typeof v[k] === 'number' && isFinite(v[k]) && v[k] > 0) inputs[k].value = v[k];
      });
    } catch(e){}
  }

  function render(){
    var v = read();
    var total = v.sq + v.bp + v.dl;
    var gap = Math.max(0, 500 - total);

    $('rTotal').textContent = fmt(total);
    $('rGap').textContent = gap > 0 ? fmt(gap) + ' kg' : '달성';
    $('hGap').textContent = fmt(gap);

    var scale = Math.max(500, total);
    ['sq','bp','dl'].forEach(function(k){
      $('m' + k.charAt(0).toUpperCase() + k.slice(1))
        .style.setProperty('--p', (v[k]/scale*100) + '%');
    });

    var rows = '', tTot = 0;
    LIFTS.forEach(function(l){
      var now = v[l.k];
      tTot += l.target;
      rows += '<tr>'
        + '<td><span class="liftname"><span class="chipdot '+l.k+'"></span>'+l.name+'</span></td>'
        + '<td><span class="num">'+fmt(now)+'</span></td>'
        + '<td><span class="num">'+l.target+'</span></td>'
        + '<td><span class="delta">'+(l.target-now >= 0 ? '+' : '')+fmt(l.target-now)+'</span></td>'
        + '<td><span class="dim">'+(now/v.bw).toFixed(2)+'배</span></td>'
        + '<td><span class="dim">'+(l.target/84).toFixed(2)+'배</span></td>'
        + '</tr>';
    });
    rows += '<tr class="sum">'
      + '<td>합계</td>'
      + '<td><span class="num">'+fmt(total)+'</span></td>'
      + '<td><span class="num">'+tTot+'</span></td>'
      + '<td><span class="delta">'+(tTot-total >= 0 ? '+' : '')+fmt(tTot-total)+'</span></td>'
      + '<td><span class="dim">'+(total/v.bw).toFixed(2)+'배</span></td>'
      + '<td><span class="dim">'+(tTot/84).toFixed(2)+'배</span></td>'
      + '</tr>';
    $('ledgerBody').innerHTML = rows;

    var cols = [{lab:'현재', sub:'오늘 · '+fmt(v.bw)+'kg', sq:v.sq, bp:v.bp, dl:v.dl}].concat(PHASES);
    var FLOOR = 350, TOP = 510, html = '';
    cols.forEach(function(c){
      var t = c.sq + c.bp + c.dl;
      var frac = Math.max(0.04, Math.min(1, (t - FLOOR)/(TOP - FLOOR)));
      var seg = function(cls, val){
        return '<div class="seg '+cls+'" style="--p:'+(val/t*frac*100)+'%"></div>';
      };
      html += '<div class="col">'
        + '<div class="coltot">'+fmt(t)+'</div>'
        + '<div class="colbar">'+seg('sq',c.sq)+seg('bp',c.bp)+seg('dl',c.dl)+'</div>'
        + '<div class="collab">'+c.lab+'</div>'
        + '<div class="colsub">'+c.sub+'</div>'
        + '<div class="colsplit">'
          + '<span><i class="chipdot sq"></i>'+fmt(c.sq)+'</span>'
          + '<span><i class="chipdot bp"></i>'+fmt(c.bp)+'</span>'
          + '<span><i class="chipdot dl"></i>'+fmt(c.dl)+'</span>'
        + '</div>'
        + '</div>';
    });
    $('chart').innerHTML = html;

    var w = '';
    WAVE.forEach(function(row){
      var cell = function(base){
        var kg = r25(base * row.pct);
        return '<td><div class="wavecell"><span class="num">'+fmt(kg)+'</span><span class="pl">'+plateHTML(kg)+'</span></div></td>';
      };
      w += '<tr>'
        + '<td><span class="scheme">'+row.wk+'</span><br><span class="pct">'+Math.round(row.pct*1000)/10+'%</span></td>'
        + '<td><span class="scheme">'+row.scheme+'</span></td>'
        + cell(v.sq) + cell(v.bp) + cell(v.dl)
        + '<td style="text-align:left"><span class="wknote">'+row.note+'</span></td>'
        + '</tr>';
    });
    $('waveBody').innerHTML = w;

    $('fProtein').textContent = Math.round(v.bw * 2) + ' g';
    $('fCalHi').textContent = (Math.round(v.bw * 39 / 50) * 50).toLocaleString();
    $('fCalLo').textContent = (Math.round(v.bw * 34.5 / 50) * 50).toLocaleString();

    save(v);
    renderWeek(v);
  }


  /* ─────────── 주간 실행 탭 ─────────── */
  var TARGETS = {sq:180, bp:120, dl:200};
  var TOTAL_WEEKS = 104, LAST_BLOCK = 25;   /* 블록 인덱스 0~25 = 26블록 = 104주 */
  /* 페이즈 체크포인트에서의 종목별 진행률 (로드맵 탭의 숫자와 정확히 일치) */
  var CP = [
    {b:0,  sq:0,    bp:0,     dl:0},       /* 시작 */
    {b:6,  sq:0.30, bp:0.375, dl:0.3125},  /* 26주차 · 6개월 · 425 */
    {b:12, sq:0.55, bp:0.625, dl:0.625},   /* 52주차 · 12개월 · 455 */
    {b:19, sq:0.75, bp:0.75,  dl:0.9375},  /* 78주차 · 18개월 · 480 */
    {b:25, sq:1,    bp:1,     dl:1}        /* 104주차 · 24개월 · 500 */
  ];
  var DOW = ['월','화','수','목','금','토','일'];

  var DAYS = [
    {tag:'DAY 1', dow:0, name:'스쿼트 고강도', mc:'sq', ex:[
      {n:'백스쿼트', main:'sq'},
      {n:'벤치프레스', s:'4 × 6', pct:0.70, of:'bp'},
      {n:'루마니안 데드리프트', s:'3 × 8', pct:0.50, of:'dl'},
      {n:'중량 턱걸이', s:'4 × 6', note:'RPE 8'},
      {n:'앱 롤아웃', s:'3 × 10', note:'천천히'}
    ]},
    {tag:'DAY 2', dow:1, name:'데드리프트 고강도', mc:'dl', ex:[
      {n:'데드리프트', main:'dl'},
      {n:'오버헤드 프레스', s:'4 × 6', pct:0.60, of:'bp'},
      {n:'바벨 로우', s:'4 × 8', pct:0.50, of:'dl'},
      {n:'레그컬', s:'3 × 12', note:'RPE 8'},
      {n:'페이스풀', s:'3 × 15', note:'가볍게'}
    ]},
    {tag:'DAY 3', dow:3, name:'벤치 고강도', mc:'bp', ex:[
      {n:'벤치프레스', main:'bp'},
      {n:'포즈 스쿼트', s:'4 × 5', pct:0.65, of:'sq'},
      {n:'클로즈그립 벤치', s:'3 × 8', pct:0.60, of:'bp'},
      {n:'랫풀다운', s:'4 × 10', note:'RPE 8'},
      {n:'삼두 + 후면 삼각근', s:'3 × 12', note:'RPE 8'}
    ]},
    {tag:'DAY 4', dow:5, name:'볼륨 & 약점', mc:null, ex:[
      {n:'프론트 스쿼트', s:'4 × 5', pct:0.55, of:'sq'},
      {n:'인클라인 / 스포토 프레스', s:'4 × 8', pct:0.55, of:'bp'},
      {n:'데피싯 데드리프트', s:'4 × 4', pct:0.70, of:'dl'},
      {n:'불가리안 스플릿 스쿼트', s:'3 × 10', note:'덤벨, RPE 8'},
      {n:'컬, 케이블 로우, 복근', s:'3 × 12', note:'RPE 8'}
    ]}
  ];

  var HABITS = [
    {n:'훈련 세션', d:'훈련일만', trainOnly:true},
    {n:'단백질 목표', d:function(v){ return Math.round(v.bw*2)+'g'; }},
    {n:'아침 공복 체중 기록', d:''},
    {n:'수면 7.5~8시간', d:''},
    {n:'물 3~3.5L', d:''},
    {n:'크레아틴 5g', d:''},
    {n:'훈련 기록 (무게·횟수·체감)', d:'훈련일만', trainOnly:true}
  ];

  var wState = {week:1, start:null, checks:{}};
  var WKEY = 'bigthree500.week.v1';

  function wSave(){ try{ localStorage.setItem(WKEY, JSON.stringify(wState)); }catch(e){} }
  function wRestore(){
    try{
      var v = JSON.parse(localStorage.getItem(WKEY) || 'null');
      if (v && typeof v === 'object'){
        if (v.week >= 1 && v.week <= TOTAL_WEEKS) wState.week = v.week;
        if (typeof v.start === 'string') wState.start = v.start;
        if (v.checks && typeof v.checks === 'object') wState.checks = v.checks;
      }
    }catch(e){}
  }

  function mondayOf(d){
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay()+6) % 7));
    return x;
  }
  function iso(d){
    return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
  }
  function parseISO(t){
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t || '');
    return m ? new Date(+m[1], +m[2]-1, +m[3]) : null;
  }
  function addDays(d, n){
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate()+n);
    return x;
  }
  function md(d){ return (d.getMonth()+1) + '.' + d.getDate(); }

  function frac(block, k){
    if (block <= 0) return 0;
    if (block >= LAST_BLOCK) return 1;
    for (var i=0;i<CP.length-1;i++){
      if (block >= CP[i].b && block <= CP[i+1].b){
        var t = (block - CP[i].b) / (CP[i+1].b - CP[i].b);
        return CP[i][k] + (CP[i+1][k] - CP[i][k]) * t;
      }
    }
    return 1;
  }
  function tmFor(v, block){ return {sq:v.sq, bp:v.bp, dl:v.dl}; }
  function phaseOf(block){ return block <= 6 ? 1 : block <= 12 ? 2 : block <= 19 ? 3 : 4; }

  function renderWeek(v){
    var week = wState.week;
    var block = Math.floor((week-1)/4);
    var wib = ((week-1) % 4) + 1;
    var row = WAVE[wib-1];
    var tm = tmFor(v, block);
    var phase = phaseOf(block);

    $('wTitle').textContent = week + '주차';
    $('wMeta').textContent = '페이즈 ' + phase + ' · 블록 ' + (block+1) + ' / ' + (LAST_BLOCK+1) + ' · 블록 내 ' + wib + '주차 · ' +
      Math.ceil(week/(52/12)) + '개월차';

    var start = parseISO($('wStart').value) || mondayOf(new Date());
    var mon = addDays(start, (week-1)*7);
    $('wDates').textContent = mon.getFullYear() + '. ' + md(mon) + ' – ' + md(addDays(mon,6));

    /* 배너 */
    var msg = '';
    if (wib === 4) msg = '<b>디로드 주차.</b> 모든 메인은 55%로 2 × 5, 보조 운동은 2세트. 다음 블록의 중량은 기록을 확인하고 조정하세요.';
    else if (wib === 3) msg = '<b>강도 주차.</b> 마지막 세트가 정직한 세트입니다. 여기서 정해진 횟수를 두 블록 연속 놓치면 무게를 더하지 말고 무거운 3회로 재측정하세요.';
    else if (week === 1) msg = '<b>첫 주.</b> 데드리프트는 추정치 위에 서 있습니다. 이번 주에 무거운 3회로 실제 값을 확인하고 <b>현재 1RM</b> 칸에 입력하세요.';
    else if (phase >= 3 && wib === 1) msg = '<b>페이즈 ' + phase + '.</b> 기록과 컨디션을 검토하고 약점 보완에 집중하세요. 날짜만으로 중량이 증가하지 않습니다.';
    $('wBanner').innerHTML = msg;
    $('wBanner').hidden = !msg;

    /* 메인 무게 카드 */
    var names = {sq:'스쿼트', bp:'벤치', dl:'데드리프트'};
    var cards = '';
    ['sq','bp','dl'].forEach(function(k){
      var kg = r25(tm[k] * row.pct);
      var back = null;
      cards += '<div class="lcard">'
        + '<div class="top"><span class="chipdot '+k+'"></span>'+names[k]+'</div>'
        + '<div class="sch">'+row.scheme+'</div>'
        + '<div class="kg">'+fmt(kg)+'<em>kg</em></div>'
        + '<span class="pl" aria-label="한쪽 원판">'+plateHTML(kg)+'</span><div class="sub">20kg 바 · 한쪽 원판</div>'
        + '<div class="sub">기준 1RM '+fmt(tm[k])+'kg의 '+(Math.round(row.pct*1000)/10)+'%</div>'
        + (back ? '<div class="backoff">주 후반 백오프 2 × 5 · <b>'+fmt(back)+'kg</b></div>' : '')
        + '</div>';
    });
    $('wLifts').innerHTML = cards;

    /* 요일별 훈련 */
    var days = '';
    DAYS.forEach(function(d){
      var date = addDays(mon, d.dow);
      var rows = '';
      d.ex.forEach(function(e){
        var kg = '', cls = 'kgv', sch = wib === 4 && e.s ? e.s.replace(/^\d+/, '2') : e.s;
        if (e.main){
          kg = fmt(r25(tm[e.main] * row.pct)) + 'kg';
          sch = row.scheme;
        } else if (e.pct){
          var w = r25(tm[e.of] * e.pct);
          kg = fmt(wib === 4 ? r25(w * 0.85) : w) + 'kg';
        } else {
          kg = e.note; cls = 'kgv soft';
        }
        rows += '<div class="ex w3'+(e.main ? ' main' : '')+'"'+(e.main ? ' style="--mc:var(--p'+({sq:'25',bp:'20',dl:'15'}[e.main])+')"' : '')+'>'
          + '<span class="n">'+e.n+'</span>'
          + '<span class="s">'+sch+'</span>'
          + '<span class="'+cls+'">'+kg+'</span>'
          + '</div>';
      });
      days += '<div class="day">'
        + '<div class="daytag">'+d.tag+' · '+DOW[d.dow]+'요일 · '+md(date)+'</div>'
        + '<h3>'+d.name+'</h3>' + rows
        + '</div>';
    });
    $('wDays').innerHTML = days;

    /* 매일 체크리스트 */
    var trainDows = DAYS.map(function(d){ return d.dow; });
    var g = '<div class="dc hd lab" style="justify-content:flex-start"><b>'+week+'주차</b></div>';
    for (var i=0;i<7;i++){
      var dt = addDays(mon, i), isT = trainDows.indexOf(i) >= 0;
      g += '<div class="dc hd'+(isT ? ' train' : '')+'"><b>'+DOW[i]+'</b><span>'+md(dt)+'</span></div>';
    }
    var wk = wState.checks[week] || {};
    HABITS.forEach(function(h, hi){
      var d = typeof h.d === 'function' ? h.d(v) : h.d;
      g += '<div class="dc lab">'+h.n+(d ? '<small>'+d+'</small>' : '')+'</div>';
      for (var i=0;i<7;i++){
        var isT = trainDows.indexOf(i) >= 0;
        if (h.trainOnly && !isT){ g += '<div class="dc off"><span class="dash">·</span></div>'; continue; }
        var id = hi + '-' + i;
        g += '<div class="dc'+(isT ? ' train' : '')+'">'
          + '<input type="checkbox" data-k="'+id+'"'+(wk[id] ? ' checked' : '')
          + ' aria-label="'+h.n+' '+DOW[i]+'요일"></div>';
      }
    });
    $('wDaily').innerHTML = g;

    $('wPrev').disabled = week <= 1;
    $('wNext').disabled = week >= TOTAL_WEEKS;
    document.dispatchEvent(new CustomEvent('training-render')); 
  }

  function goWeek(n){
    wState.week = Math.min(TOTAL_WEEKS, Math.max(1, n));
    wSave();
    renderWeek(read());
    $('wTitle').scrollIntoView({block:'nearest'});
  }

  function initWeekTab(){
    wRestore();
    if (!wState.start){ wState.start = iso(mondayOf(new Date())); wSave(); }  /* 첫 방문에 시작일 고정 */
    $('wStart').value = wState.start;

    $('wPrev').addEventListener('click', function(){ goWeek(wState.week-1); });
    $('wNext').addEventListener('click', function(){ goWeek(wState.week+1); });
    $('wJump1').addEventListener('click', function(){ goWeek(1); });
    $('wToday').addEventListener('click', function(){
      var st = parseISO($('wStart').value) || mondayOf(new Date());
      var diff = Math.floor((mondayOf(new Date()) - st) / 604800000);
      goWeek(diff + 1);
    });
    $('wStart').addEventListener('change', function(){
      var picked = parseISO($('wStart').value); if (!picked) return; wState.start = iso(mondayOf(picked)); $('wStart').value = wState.start; wSave(); renderWeek(read());
    });
    $('wDaily').addEventListener('change', function(e){
      var el = e.target;
      if (!el || el.type !== 'checkbox') return;
      var wk = wState.checks[wState.week] || (wState.checks[wState.week] = {});
      if (el.checked) wk[el.getAttribute('data-k')] = 1;
      else delete wk[el.getAttribute('data-k')];
      wSave();
    });

    var tabs = [{b:$('tabPlan'), p:$('pane-plan')}, {b:$('tabWeek'), p:$('pane-week')}];
    function select(i){
      tabs.forEach(function(t, j){
        t.b.setAttribute('aria-selected', i === j ? 'true' : 'false');
        t.p.hidden = i !== j;
      });
      try{ localStorage.setItem('bigthree500.tab', i); }catch(e){}
    }
    tabs.forEach(function(t, i){
      t.b.addEventListener('click', function(){ select(i); });
      t.b.addEventListener('keydown', function(e){
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){
          e.preventDefault();
          var n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length-1)) % tabs.length;
          select(n); tabs[n].b.focus();
        }
      });
    });
    var saved = 1;
    try{ saved = localStorage.getItem('bigthree500.tab') === '0' ? 0 : 1; }catch(e){}
    select(saved === 1 ? 1 : 0);
  }

  window.Training = {read:read, render:render, renderWeek:renderWeek, state:wState, days:DAYS, wave:WAVE, inputs:inputs, goWeek:goWeek, saveWeek:wSave, plates:plateHTML};
  restore();
  initWeekTab();
  ['sq','bp','dl','bw'].forEach(function(k){
    
    inputs[k].addEventListener('change', function(){ if(!inputs[k].checkValidity() || !inputs[k].value) { inputs[k].reportValidity(); return; } render(); });
  });
  render();
})();
