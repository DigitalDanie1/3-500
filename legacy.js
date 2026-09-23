
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
    {wk:'1주차', scheme:'5세트 × 5회', pct:0.75,  label:'볼륨',  note:'마지막 세트에 2~3회 남는 무게. 4회 이상 남으면 기준 1RM이 낮게 잡힌 겁니다.'},
    {wk:'2주차', scheme:'5세트 × 4회', pct:0.80,  label:'기반', note:'RPE 8 (2회 남기고). 바 속도가 눈에 띄게 떨어지면 그 세트에서 멈추세요.'},
    {wk:'3주차', scheme:'4세트 × 3회', pct:0.875, label:'강도 정점',  note:'RPE 9 (1회 남기고). 블록에서 가장 힘든 날입니다. 여기서 횟수를 놓치면 다음 블록에 무게를 올리지 마세요.'},
    {wk:'4주차', scheme:'2세트 × 5회', pct:0.60, label:'회복', note:'회복 주차입니다. 강도를 올린 만큼 이 주는 반드시 지키세요 — 건너뛰면 3주차에서 무너집니다.'}
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



  /* ─────────── 운동 사전 ─────────── */
  var MUS = {chest:'가슴',dfront:'어깨 (앞·옆)',dback:'어깨 (뒤)',trap:'승모근',lat:'광배근',
    biceps:'이두',triceps:'삼두',forearm:'전완',abs:'복근',erector:'척추기립근',
    glute:'둔근',ham:'햄스트링',quad:'대퇴사두',calf:'종아리'};

  var EX = (typeof window!=='undefined' && window.ExerciseGuides) || {};
  var EX_UNUSED = {
  '백스쿼트':{en:'Back Squat',
    d:'바를 승모근 위에 얹고 고관절과 무릎을 함께 접어 앉았다 일어서는 동작. 3대 측정의 첫 종목입니다.',
    p:['quad','glute'], s:['erector','abs','ham'],
    cue:['발끝보다 무릎을 살짝 바깥으로 밀며 내려간다','고관절이 무릎보다 아래로 갈 때까지 (평행 아래)','복압을 채우고 바를 등 전체로 받친다'],
    err:['무릎이 안으로 말리는 것','상체가 먼저 서면서 바가 앞으로 빠지는 것'],
    why:'합계에서 여유가 가장 많은 종목. 남은 110kg 중 50kg이 여기서 나옵니다.'},
  '벤치프레스':{en:'Bench Press',
    d:'벤치에 누워 바를 가슴까지 내렸다 미는 동작. 3대 중 가장 느리게 오르는 종목입니다.',
    p:['chest','triceps'], s:['dfront'],
    cue:['견갑을 모아 뒤로 내리고 그 자세를 끝까지 유지','바는 가슴 아래쪽(명치 근처)에 닿는다','발로 바닥을 밀어 다리까지 쓴다'],
    err:['견갑이 풀리며 어깨가 앞으로 나오는 것','가슴에서 바운스로 튕기는 것'],
    why:'이미 최고 종목이라 상승분은 20kg만 배정했습니다. 대신 절대 빠뜨리면 안 됩니다.'},
  '데드리프트':{en:'Deadlift',
    d:'바닥의 바를 고관절과 무릎으로 세워 올려 락아웃하는 동작.',
    p:['erector','glute','ham'], s:['lat','trap','forearm','quad'],
    cue:['바는 정강이에 붙여 수직으로 올린다','등을 편 채 가슴을 세우고 광배로 바를 몸쪽에 고정','락아웃은 골반을 밀어 마무리, 뒤로 젖히지 않는다'],
    err:['엉덩이가 먼저 올라가며 등이 말리는 것','바가 몸에서 떨어져 앞으로 나가는 것'],
    why:'추정치 160에서 200까지 40kg. 첫 주에 무거운 3회로 실제 값부터 확인해야 합니다.'},
  '루마니안 데드리프트':{en:'Romanian Deadlift',
    d:'무릎을 거의 편 채 고관절만 접어 바를 정강이 중간까지 내렸다 세우는 동작.',
    p:['ham','glute'], s:['erector'],
    cue:['무릎 각도를 고정하고 엉덩이를 뒤로 보낸다','햄스트링이 당기는 지점에서 멈춘다 (바닥까지 안 내려도 된다)','등은 끝까지 편 상태'],
    err:['스쿼트처럼 무릎을 접는 것','등을 말아서 더 내리려는 것'],
    why:'데드리프트의 시작 구간을 담당하는 햄스트링·둔근을 허리 피로 없이 키웁니다.'},
  '레그 프레스':{en:'Leg Press',
    d:'기계에 앉아 발판을 다리로 미는 동작.',
    p:['quad','glute'], s:['ham'],
    cue:['무릎이 90도 아래로 깊게 내려간다','허리가 시트에서 뜨지 않는 범위까지만','무릎을 완전히 잠그지 않는다'],
    err:['너무 얕게 미는 것','골반이 말리며 허리가 뜨는 것'],
    why:'스쿼트로 허리를 더 태우지 않고 대퇴사두 볼륨만 추가합니다.'},
  '레그컬':{en:'Leg Curl',
    d:'기계에서 무릎을 굽혀 뒤꿈치를 엉덩이 쪽으로 당기는 동작.',
    p:['ham'], s:['calf'],
    cue:['골반을 패드에 붙여 고정','수축 지점에서 1초 멈춘다','내릴 때 3초에 걸쳐 천천히'],
    err:['반동으로 던지는 것','골반이 들리는 것'],
    why:'무릎을 지나는 햄스트링 기능. 스쿼트·데드 중량이 올라갈수록 부상 방지 값이 커집니다.'},
  '행잉 레그레이즈':{en:'Hanging Leg Raise',
    d:'바에 매달려 다리를 들어 올리는 복근 운동.',
    p:['abs'], s:['forearm','lat'],
    cue:['골반을 말아 올리는 게 핵심이다 (다리만 드는 게 아니다)','흔들림 없이 통제한다','내릴 때 천천히'],
    err:['반동으로 몸을 흔드는 것','골반은 그대로 두고 다리만 드는 것'],
    why:'스쿼트·데드에서 복압을 유지하는 능력이 곧 중량입니다.'},
  '인클라인 덤벨 프레스':{en:'Incline Dumbbell Press',
    d:'30~45도 경사 벤치에서 덤벨을 미는 동작.',
    p:['chest','dfront'], s:['triceps'],
    cue:['견갑을 모아 고정','덤벨은 가슴 위쪽 라인으로','팔꿈치를 몸통에서 45도 정도로'],
    err:['경사를 너무 높여 어깨 운동이 되는 것','맨 위에서 덤벨을 부딪히는 것'],
    why:'벤치의 상부 가슴 약점을 메웁니다. 벤치 정체 구간에서 가장 효과가 큽니다.'},
  '중량 딥스':{en:'Weighted Dip',
    d:'평행봉에서 몸을 내렸다 미는 동작. 벨트에 원판을 달아 중량을 더합니다.',
    p:['chest','triceps'], s:['dfront'],
    cue:['상체를 살짝 앞으로 기울여 가슴에 싣는다','어깨가 팔꿈치보다 살짝 아래까지','어깨를 으쓱하지 않는다'],
    err:['너무 깊게 내려 어깨 앞이 눌리는 것','반동으로 튕겨 올라오는 것'],
    why:'삼두와 가슴 하부를 동시에. 벤치 락아웃 구간에 직접 반영됩니다.'},
  '케이블 플라이':{en:'Cable Fly',
    d:'케이블을 양쪽에서 모아 가슴을 조이는 동작.',
    p:['chest'], s:['dfront'],
    cue:['팔꿈치 각도를 살짝 굽힌 채 고정','모으는 지점에서 1초','가벼운 무게로 범위를 크게'],
    err:['프레스처럼 팔을 펴고 미는 것','무게를 올려 어깨로 끌어오는 것'],
    why:'프레스로 채우기 힘든 가슴 신장 구간 볼륨입니다.'},
  '삼두 푸시다운':{en:'Triceps Pushdown',
    d:'케이블을 아래로 밀어 펴는 삼두 고립 운동.',
    p:['triceps'], s:[],
    cue:['팔꿈치를 몸통에 붙여 고정','끝까지 펴서 1초','상체를 숙여 체중으로 밀지 않는다'],
    err:['팔꿈치가 앞뒤로 움직이는 것','어깨로 눌러 내리는 것'],
    why:'벤치 상단 락아웃은 삼두가 만듭니다.'},
  '바벨 로우':{en:'Barbell Row',
    d:'상체를 숙인 채 바를 배꼽 쪽으로 당기는 동작.',
    p:['lat','trap'], s:['biceps','erector','dback'],
    cue:['상체 각도를 45도 이하로 고정','팔꿈치를 뒤로 보내며 배꼽 쪽으로','수축에서 견갑을 모은다'],
    err:['상체를 세우며 반동으로 당기는 것','등이 말리는 것'],
    why:'데드리프트에서 바를 몸에 붙이는 힘이 여기서 나옵니다.'},
  '랫풀다운':{en:'Lat Pulldown',
    d:'바를 가슴 위쪽으로 당겨 내리는 광배 운동.',
    p:['lat'], s:['biceps','dback'],
    cue:['가슴을 세우고 쇄골 쪽으로 당긴다','견갑을 먼저 내리고 팔이 따라온다','목 뒤로 당기지 않는다'],
    err:['몸을 뒤로 눕혀 반동 쓰는 것','팔로만 당기는 것'],
    why:'광배 크기는 벤치 안정성과 데드 락아웃 모두에 영향을 줍니다.'},
  '시티드 케이블 로우':{en:'Seated Cable Row',
    d:'앉아서 케이블을 배 쪽으로 당기는 동작.',
    p:['lat','trap'], s:['biceps'],
    cue:['상체는 세운 채 고정','견갑을 모으고 1초','늘릴 때 등이 말리지 않게'],
    err:['상체를 앞뒤로 흔드는 것','어깨가 으쓱 올라가는 것'],
    why:'중간 등 두께. 바벨 로우보다 허리 부담 없이 볼륨을 채웁니다.'},
  '바벨 컬':{en:'Barbell Curl',
    d:'바를 팔꿈치만 굽혀 올리는 이두 운동.',
    p:['biceps'], s:['forearm'],
    cue:['팔꿈치를 몸통 옆에 고정','내릴 때 3초','손목을 꺾지 않는다'],
    err:['허리로 반동 주는 것','팔꿈치가 앞으로 나가는 것'],
    why:'로우·풀 계열에서 팔이 먼저 지치지 않게 합니다.'},
  '포즈 / 스포토 벤치':{en:'Paused / Spoto Press',
    d:'가슴에서 멈추거나(포즈), 가슴 2~3cm 위에서 멈췄다가(스포토) 미는 벤치 변형.',
    p:['chest','triceps'], s:['dfront'],
    cue:['멈춤 구간에서 긴장을 풀지 않는다','1~2초 완전 정지 후 폭발적으로','무게는 메인의 65%'],
    err:['멈춘 척만 하고 바운스로 넘어가는 것','무게를 메인 수준까지 올리는 것'],
    why:'시합 벤치는 정지 후 미는 동작입니다. 이 주 2회차 노출이 벤치 정체를 깹니다.'},
  '오버헤드 프레스':{en:'Overhead Press',
    d:'선 자세에서 바를 머리 위로 미는 동작.',
    p:['dfront'], s:['triceps','trap','abs'],
    cue:['갈비뼈를 닫고 엉덩이·복근으로 몸통을 잠근다','머리를 살짝 빼서 바가 수직으로 지나가게','락아웃에서 바가 귀 뒤에 온다'],
    err:['허리를 젖혀서 미는 것','바가 얼굴 앞으로 돌아 나가는 것'],
    why:'어깨와 삼두, 그리고 벤치를 받치는 상체 안정성.'},
  '사이드 레터럴 레이즈':{en:'Lateral Raise',
    d:'덤벨을 옆으로 들어 올리는 측면 삼각근 고립 운동.',
    p:['dfront'], s:['trap'],
    cue:['팔꿈치를 살짝 굽힌 채 어깨 높이까지','새끼손가락이 살짝 위로','가볍게 15회'],
    err:['반동으로 던지는 것','승모근이 먼저 올라가는 것'],
    why:'어깨 폭. 무겁게 할 필요가 전혀 없는 종목입니다.'},
  '페이스풀':{en:'Face Pull',
    d:'케이블을 얼굴 쪽으로 당기며 팔꿈치를 벌리는 동작.',
    p:['dback'], s:['trap'],
    cue:['손이 귀 옆으로 오게 당긴다','견갑을 모으며 외회전','가볍게, 15회'],
    err:['무겁게 해서 로우가 되는 것','팔꿈치가 아래로 처지는 것'],
    why:'벤치 볼륨이 늘수록 어깨 앞이 말립니다. 그걸 되돌리는 유지보수 종목입니다.'},
  '삼두 + 이두 슈퍼셋':{en:'Triceps + Biceps Superset',
    d:'삼두 종목과 이두 종목을 쉬지 않고 번갈아 수행합니다.',
    p:['triceps','biceps'], s:['forearm'],
    cue:['두 종목 사이에는 휴식 없이','세트 사이만 90초','무게보다 수축에 집중'],
    err:['무게 욕심으로 반동 쓰는 것'],
    why:'짧은 시간에 팔 볼륨. 벤치와 로우 양쪽의 보조 근육입니다.'},
  '프론트 스쿼트':{en:'Front Squat',
    d:'바를 쇄골 앞에 얹고 상체를 세운 채 앉는 스쿼트 변형.',
    p:['quad'], s:['abs','erector','glute'],
    cue:['팔꿈치를 최대한 높게 유지','상체를 끝까지 수직으로','백스쿼트의 55% 정도면 충분하다'],
    err:['팔꿈치가 떨어지며 바가 앞으로 굴러가는 것','상체가 숙여지는 것'],
    why:'백스쿼트에서 상체가 숙여지는 문제를 직접 고칩니다. 스쿼트 2회차 노출.'},
  '데피싯 데드리프트':{en:'Deficit Deadlift',
    d:'2~5cm 높이의 판 위에 서서 평소보다 낮은 지점에서 당기는 데드리프트.',
    p:['erector','glute','ham'], s:['quad','lat'],
    cue:['가동범위가 늘어난 만큼 무게는 메인의 60%','시작 자세를 더 낮게 잡되 등은 그대로','4회 이상 반복하지 않는다'],
    err:['무게 욕심으로 등이 말리는 것','판을 너무 높게 쓰는 것'],
    why:'데드리프트 바닥 구간이 약점이면 여기서 고쳐집니다. 데드 2회차 노출.'},
  '불가리안 스플릿 스쿼트':{en:'Bulgarian Split Squat',
    d:'뒷발을 벤치에 올리고 앞다리로만 앉았다 서는 동작.',
    p:['quad','glute'], s:['ham'],
    cue:['앞발에 체중 80%','상체를 앞으로 기울이면 둔근, 세우면 대퇴사두','덤벨로, 2회 남길 만큼만'],
    err:['뒷다리로 밀어내는 것','보폭이 너무 좁은 것'],
    why:'좌우 불균형 교정. 스쿼트 정체의 절반은 한쪽 다리가 약해서 생깁니다.'},
  '힙 쓰러스트':{en:'Hip Thrust',
    d:'등을 벤치에 대고 골반으로 바를 밀어 올리는 둔근 운동.',
    p:['glute'], s:['ham'],
    cue:['턱을 당겨 시선을 앞으로','락아웃에서 1초 조이기','허리로 젖히지 않고 골반만 민다'],
    err:['허리를 젖혀 각도를 만드는 것','가동범위를 반만 쓰는 것'],
    why:'데드리프트 락아웃과 스쿼트 상승 구간의 둔근 출력.'},
  '앱 롤아웃':{en:'Ab Wheel Rollout',
    d:'휠을 앞으로 굴리며 몸통을 펴는 복근 운동.',
    p:['abs'], s:['lat','erector'],
    cue:['허리가 꺾이지 않는 범위까지만','골반을 살짝 말아 고정','천천히 굴리고 천천히 돌아온다'],
    err:['허리를 꺾으면서 더 나가는 것','반동으로 돌아오는 것'],
    why:'안티 익스텐션. 데드리프트에서 등이 말리지 않게 하는 직접적인 능력입니다.'},
  '레그 익스텐션':{en:'Leg Extension',
    d:'기계에 앉아 무릎만 펴서 발판을 올리는 대퇴사두 고립 운동.',
    p:['quad'], s:[],
    cue:['끝까지 펴서 1초 조인다','내릴 때 3초에 걸쳐 천천히','골반이 시트에서 뜨지 않게'],
    err:['반동으로 차 올리는 것','가동범위를 반만 쓰는 것'],
    why:'스쿼트로는 채우기 힘든 대퇴직근 볼륨. 다리 굵기가 곧 스쿼트 잠재력입니다.'},
  '라잉 레그컬':{en:'Lying Leg Curl',
    d:'엎드려서 무릎을 굽혀 뒤꿈치를 엉덩이로 당기는 햄스트링 고립 운동.',
    p:['ham'], s:['calf'],
    cue:['골반을 패드에 눌러 고정','수축에서 1초 멈춤','내릴 때 천천히'],
    err:['골반이 들리는 것','반동으로 던지는 것'],
    why:'주 2회차 햄스트링 노출. 데드리프트 볼륨은 늘리지 않고 근육만 키웁니다.'},
  '스탠딩 카프 레이즈':{en:'Standing Calf Raise',
    d:'선 자세에서 뒤꿈치를 들어 올리는 종아리 운동. 무릎을 편 채라 비복근이 주로 쓰입니다.',
    p:['calf'], s:[],
    cue:['뒤꿈치를 최대한 아래로 내렸다가 최대한 위로','맨 위에서 1초 조이기','반동 없이 통제'],
    err:['가동범위를 반만 쓰는 것','무릎을 굽혀 반동 주는 것'],
    why:'종아리는 스쿼트·데드에서 발목 안정성을 담당하는데 이 프로그램에 유일하게 비어 있던 부위입니다.'},
  '시티드 카프 레이즈':{en:'Seated Calf Raise',
    d:'앉아서 무릎을 굽힌 채 뒤꿈치를 들어 올리는 종아리 운동. 가자미근이 주로 쓰입니다.',
    p:['calf'], s:[],
    cue:['무릎 90도 고정','아래로 완전히 늘렸다가 위로 완전히','15회를 천천히'],
    err:['빠르게 튕기는 것','무게만 올리고 범위를 줄이는 것'],
    why:'스탠딩과 각도가 달라 다른 근육을 씁니다. 둘 다 해야 종아리가 큽니다.'},
  '오버헤드 케이블 익스텐션':{en:'Overhead Cable Extension',
    d:'케이블을 머리 뒤로 넘겨 팔을 펴는 삼두 운동.',
    p:['triceps'], s:[],
    cue:['팔꿈치를 귀 옆에 고정','머리 뒤에서 완전히 늘린다','끝까지 펴서 1초'],
    err:['팔꿈치가 벌어지는 것','허리를 젖혀 미는 것'],
    why:'삼두 장두는 팔이 머리 위에 있을 때만 제대로 늘어납니다. 푸시다운만으로는 안 됩니다.'},
  '원암 덤벨 로우':{en:'One-Arm Dumbbell Row',
    d:'벤치에 한 손을 짚고 덤벨을 한쪽씩 당기는 등 운동.',
    p:['lat'], s:['biceps','trap'],
    cue:['팔꿈치를 골반 쪽으로 당긴다','아래에서 광배를 완전히 늘린다','상체를 비틀지 않는다'],
    err:['몸통을 회전시켜 반동 쓰는 것','팔로만 당기는 것'],
    why:'좌우 따로 하니 약한 쪽이 드러납니다. 데드리프트 그립 불균형의 원인이 여기입니다.'},
  '인클라인 덤벨 컬':{en:'Incline Dumbbell Curl',
    d:'경사 벤치에 기대 팔을 뒤로 늘어뜨린 채 하는 이두 운동.',
    p:['biceps'], s:['forearm'],
    cue:['팔을 완전히 늘어뜨린 상태에서 시작','팔꿈치를 뒤에 고정','내릴 때 3초'],
    err:['팔꿈치가 앞으로 나오는 것','반동으로 올리는 것'],
    why:'이두 장두가 최대로 늘어난 상태에서 수축시킵니다. 바벨 컬과 자극이 다릅니다.'},
  '리어 델트 플라이':{en:'Rear Delt Fly',
    d:'상체를 숙이거나 펙덱을 반대로 잡고 팔을 뒤로 벌리는 후면 삼각근 운동.',
    p:['dback'], s:['trap'],
    cue:['팔꿈치를 살짝 굽힌 채 고정','견갑을 모으지 말고 팔만 벌린다','가볍게, 15회'],
    err:['무겁게 해서 로우가 되는 것','승모근으로 으쓱하는 것'],
    why:'벤치 볼륨이 늘수록 어깨가 앞으로 말립니다. 페이스풀과 함께 자세를 되돌립니다.'},
  '케이블 크런치':{en:'Cable Crunch',
    d:'케이블을 잡고 무릎 꿇은 자세에서 상체를 말아 내리는 복근 운동.',
    p:['abs'], s:[],
    cue:['고관절이 아니라 척추를 마는 동작','수축에서 1초','골반은 고정'],
    err:['고관절만 접었다 펴는 것','팔로 당기는 것'],
    why:'중량을 실을 수 있는 유일한 복근 운동. 복압 강도가 곧 스쿼트·데드 중량입니다.'},
  '머신 체스트 프레스':{en:'Machine Chest Press',
    d:'고정 궤도 기계로 하는 가슴 프레스. 균형을 잡을 필요가 없어 실패 직전까지 안전하게 밀 수 있습니다.',
    p:['chest','triceps'], s:['dfront'],
    cue:['손잡이가 가슴 중간 높이에 오게 시트를 맞춘다','견갑을 등받이에 눌러 고정','마지막 세트는 무게를 25% 내려 실패까지 (드롭세트)'],
    err:['시트가 너무 높아 어깨 운동이 되는 것','팔을 완전히 잠가 장력을 푸는 것'],
    why:'프리웨이트로는 무서워서 못 미는 지점까지 밀 수 있습니다. 가슴이 고민이면 이 종목에서 가장 많이 벌 수 있습니다.'},
  '인클라인 케이블 플라이':{en:'Incline Cable Fly',
    d:'경사 벤치에 누워 케이블을 아래에서 위로 모으는 상부 가슴 고립 운동.',
    p:['chest'], s:['dfront'],
    cue:['케이블을 낮은 위치에 걸고 위로 모은다','팔꿈치 각도 고정, 모으는 지점에서 1초','늘어나는 구간에서 천천히'],
    err:['프레스처럼 미는 것','무게를 올려 어깨로 끌어오는 것'],
    why:'상부 가슴은 벤치만으로는 잘 안 붙습니다. 쇄골 아래가 비어 보이는 문제를 여기서 고칩니다.'},
  '체스트 서포티드 로우':{en:'Chest-Supported Row',
    d:'가슴을 패드에 대고 엎드린 자세로 당기는 로우. 허리를 쓰지 않습니다.',
    p:['lat','trap'], s:['biceps','dback'],
    cue:['가슴을 패드에서 떼지 않는다','팔꿈치를 뒤로 보내며 견갑을 모은다','수축에서 1초'],
    err:['가슴을 떼며 반동 쓰는 것','팔로만 당기는 것'],
    why:'데드리프트 다음날 허리 부담 없이 등 두께만 쌓습니다. 바벨 로우가 못 하는 역할입니다.'},
  '스트레이트암 풀다운':{en:'Straight-Arm Pulldown',
    d:'팔을 편 채 케이블을 허벅지까지 내리는 광배 고립 운동.',
    p:['lat'], s:['abs'],
    cue:['팔꿈치를 살짝 굽힌 채 끝까지 고정','광배로만 내린다 (삼두로 미는 게 아니다)','위에서 완전히 늘린다'],
    err:['팔꿈치를 굽혔다 펴며 삼두 운동이 되는 것','상체를 세웠다 숙였다 하는 것'],
    why:'이두가 개입하지 않는 유일한 광배 운동. 등 날 마지막에 광배만 태워서 마무리합니다.'},
  '바벨 슈러그':{en:'Barbell Shrug',
    d:'바를 들고 어깨를 귀 쪽으로 으쓱 올리는 승모근 운동.',
    p:['trap'], s:['forearm'],
    cue:['맨 위에서 1초 멈춘다','어깨를 돌리지 말고 수직으로만','스트랩을 써서 악력이 먼저 풀리지 않게'],
    err:['가동범위를 반만 쓰는 것','어깨를 회전시키는 것'],
    why:'승모근은 데드리프트 락아웃을 버티는 근육입니다. 상체 실루엣도 여기서 결정됩니다.'},
  '덤벨 숄더 프레스':{en:'Dumbbell Shoulder Press',
    d:'앉거나 선 자세에서 덤벨을 머리 위로 미는 어깨 운동.',
    p:['dfront'], s:['triceps','trap'],
    cue:['덤벨을 귀 옆 높이까지 내린다','손목이 팔꿈치 위에 수직으로','맨 위에서 부딪히지 않는다'],
    err:['너무 얕게 내리는 것','허리를 젖혀 미는 것'],
    why:'바벨 OHP보다 가동범위가 크고 좌우를 따로 씁니다. 어깨 볼륨의 핵심 한 종목.'},
  '케이블 사이드 레터럴':{en:'Cable Lateral Raise',
    d:'낮은 케이블을 몸 앞으로 가로질러 옆으로 들어 올리는 측면 삼각근 운동.',
    p:['dfront'], s:['trap'],
    cue:['케이블이 몸 뒤를 지나게 서서 아래에서부터 장력을 받는다','어깨 높이까지, 반동 없이','마지막 세트는 무게를 두 번 내려 3단 드롭세트'],
    err:['무겁게 해서 승모근으로 들어올리는 것','상체를 흔드는 것'],
    why:'덤벨은 맨 아래에서 장력이 0이지만 케이블은 처음부터 끝까지 걸립니다. 어깨 폭은 이 종목이 만듭니다.'},
  '모빌리티 (고관절·흉추·발목)':{en:'Mobility Work',
    d:'스쿼트와 데드리프트 자세를 만드는 세 관절의 가동범위 작업.',
    p:['erector','glute'], s:['ham','calf'],
    cue:['고관절: 90/90, 카우치 스트레치','흉추: 폼롤러 신전, 오픈북','발목: 벽에 무릎 밀기 (뒤꿈치 고정)'],
    err:['반동으로 튕기는 것','아픈 지점까지 밀어붙이는 것'],
    why:'스쿼트 깊이와 데드 시작 자세는 힘이 아니라 가동범위 문제인 경우가 많습니다.'},
  '플랭크 + 레그레이즈':{en:'Plank + Leg Raise',
    d:'헬스장 없이 집에서 하는 맨몸 복부 세트.',
    p:['abs'], s:['erector','glute'],
    cue:['플랭크는 골반을 살짝 말아 60초','레그레이즈는 허리를 바닥에 붙인 채','호흡을 멈추지 않는다'],
    err:['플랭크에서 엉덩이가 뜨거나 처지는 것','레그레이즈에서 허리가 뜨는 것'],
    why:'훈련하지 않는 이틀 동안 코어만은 유지합니다.'}
  };

  function keyOf(n){ return n.replace(/^\S+ · /, '').trim(); }

  /* 근육 맵 — 앞/뒤 실루엣에 주동근·협응근 하이라이트 */
  function muscleSVG(pri, sec){
    function z(m, shape){
      var c = pri.indexOf(m) >= 0 ? 'mzone on' : (sec.indexOf(m) >= 0 ? 'mzone sub' : 'mzone');
      return shape.replace('%C%', c);
    }
    var g = '';
    g += '<circle class="mbase" cx="85" cy="16" r="12"/><rect class="mbase" x="79" y="27" width="12" height="7" rx="2"/>';
    g += z('dfront','<ellipse class="%C%" cx="62" cy="43" rx="11" ry="9"/>');
    g += z('dfront','<ellipse class="%C%" cx="108" cy="43" rx="11" ry="9"/>');
    g += z('chest','<rect class="%C%" x="71" y="36" width="13" height="19" rx="4"/>');
    g += z('chest','<rect class="%C%" x="86" y="36" width="13" height="19" rx="4"/>');
    g += z('biceps','<rect class="%C%" x="52" y="55" width="10" height="20" rx="5"/>');
    g += z('biceps','<rect class="%C%" x="108" y="55" width="10" height="20" rx="5"/>');
    g += z('forearm','<rect class="%C%" x="48" y="77" width="9" height="22" rx="4.5"/>');
    g += z('forearm','<rect class="%C%" x="113" y="77" width="9" height="22" rx="4.5"/>');
    g += z('abs','<rect class="%C%" x="73" y="57" width="24" height="30" rx="4"/>');
    g += '<rect class="mbase" x="70" y="89" width="30" height="12" rx="4"/>';
    g += z('quad','<rect class="%C%" x="70" y="103" width="14" height="38" rx="6"/>');
    g += z('quad','<rect class="%C%" x="86" y="103" width="14" height="38" rx="6"/>');
    g += '<rect class="mbase" x="72" y="144" width="11" height="30" rx="5"/><rect class="mbase" x="87" y="144" width="11" height="30" rx="5"/>';
    g += '<text class="mlabel" x="85" y="190" text-anchor="middle">FRONT</text>';
    g += '<circle class="mbase" cx="255" cy="16" r="12"/>';
    g += z('trap','<polygon class="%C%" points="240,47 255,28 270,47 263,54 247,54"/>');
    g += z('dback','<ellipse class="%C%" cx="232" cy="43" rx="11" ry="9"/>');
    g += z('dback','<ellipse class="%C%" cx="278" cy="43" rx="11" ry="9"/>');
    g += z('lat','<polygon class="%C%" points="243,54 251,54 252,86 238,74"/>');
    g += z('lat','<polygon class="%C%" points="267,54 259,54 258,86 272,74"/>');
    g += z('triceps','<rect class="%C%" x="222" y="55" width="10" height="20" rx="5"/>');
    g += z('triceps','<rect class="%C%" x="278" y="55" width="10" height="20" rx="5"/>');
    g += z('forearm','<rect class="%C%" x="218" y="77" width="9" height="22" rx="4.5"/>');
    g += z('forearm','<rect class="%C%" x="283" y="77" width="9" height="22" rx="4.5"/>');
    g += z('erector','<rect class="%C%" x="251" y="55" width="8" height="33" rx="3"/>');
    g += z('glute','<ellipse class="%C%" cx="247" cy="96" rx="11" ry="9"/>');
    g += z('glute','<ellipse class="%C%" cx="263" cy="96" rx="11" ry="9"/>');
    g += z('ham','<rect class="%C%" x="240" y="107" width="14" height="34" rx="6"/>');
    g += z('ham','<rect class="%C%" x="256" y="107" width="14" height="34" rx="6"/>');
    g += z('calf','<rect class="%C%" x="242" y="144" width="11" height="30" rx="5"/>');
    g += z('calf','<rect class="%C%" x="257" y="144" width="11" height="30" rx="5"/>');
    g += '<text class="mlabel" x="255" y="190" text-anchor="middle">BACK</text>';
    return '<svg viewBox="0 0 340 198" role="img" aria-label="사용 근육 다이어그램">' + g + '</svg>';
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

  /* st = 근력 블록, hy = 근비대 블록.  sets = [1주,2주,3주,4주] */
  var DAYS = [
    {tag:'DAY 1', dow:0, name:'하체', sub:'스쿼트 고강도 + 대퇴사두·종아리',
     ex:[
      {n:'백스쿼트', main:'sq', tier:'s'},
      {n:'루마니안 데드리프트', reps:8, sets:[3,3,3,2], pct:0.50, of:'dl', tier:'s'},
      {n:'레그 프레스', reps:12, sets:[3,4,5,2], est:['sq',1.05], note:'기계마다 다름', tier:'h'},
      {n:'레그 익스텐션', reps:15, sets:[3,3,4,2], est:['bw',0.45], tier:'h'},
      {n:'레그컬', reps:12, sets:[3,4,4,2], est:['bw',0.40], tier:'h'},
      {n:'스탠딩 카프 레이즈', reps:12, sets:[4,4,5,2], est:['bw',0.80], tier:'h'},
      {n:'행잉 레그레이즈', reps:12, sets:[3,3,3,2], tier:'h'}
     ]},
    {tag:'DAY 2', dow:1, name:'가슴', sub:'벤치 고강도 + 가슴 3각도·삼두',
     ex:[
      {n:'벤치프레스', main:'bp', tier:'s'},
      {n:'인클라인 덤벨 프레스', reps:8, sets:[4,4,4,2], est:['bp',0.28], note:'한쪽', tier:'s'},
      {n:'머신 체스트 프레스', reps:10, sets:[3,4,4,2], est:['bp',0.55], tech:'마지막 세트 드롭', tier:'h'},
      {n:'인클라인 케이블 플라이', reps:15, sets:[3,4,4,2], est:['bp',0.13], tech:'마지막 세트 드롭', note:'한쪽 · 상부', tier:'h'},
      {n:'중량 딥스', reps:10, sets:[3,4,4,2], est:['bp',0.12,'+'], note:'벨트 · 하부', tier:'h'},
      {n:'오버헤드 케이블 익스텐션', reps:12, sets:[3,3,4,2], est:['bp',0.25], tier:'h'},
      {n:'삼두 푸시다운', reps:15, sets:[3,4,4,2], est:['bp',0.28], tech:'마지막 세트 드롭', tier:'h'}
     ]},
    {tag:'DAY 3', dow:2, name:'등', sub:'데드리프트 고강도 + 광배 폭·두께·승모',
     ex:[
      {n:'데드리프트', main:'dl', tier:'s'},
      {n:'바벨 로우', reps:8, sets:[4,4,4,2], pct:0.50, of:'dl', tier:'s'},
      {n:'랫풀다운', reps:12, sets:[3,4,4,2], est:['bw',0.80], tech:'마지막 세트 레스트-포즈', note:'와이드 · 광배 폭', tier:'h'},
      {n:'체스트 서포티드 로우', reps:12, sets:[3,4,4,2], est:['bw',0.70], tech:'마지막 세트 레스트-포즈', note:'중간 등 두께', tier:'h'},
      {n:'시티드 케이블 로우', reps:12, sets:[3,4,4,2], est:['bw',0.78], note:'클로즈그립', tier:'h'},
      {n:'스트레이트암 풀다운', reps:15, sets:[3,3,4,2], est:['bw',0.35], tech:'마지막 세트 드롭', note:'광배 고립', tier:'h'},
      {n:'바벨 슈러그', reps:12, sets:[3,4,4,2], est:['dl',0.45], note:'맨 위 1초', tier:'h'},
      {n:'인클라인 덤벨 컬', reps:12, sets:[3,3,4,2], est:['bp',0.12], note:'한쪽', tier:'h'}
     ]},
    {tag:'DAY 4', dow:3, name:'어깨 · 팔', sub:'벤치 2회차 + 삼각근 3갈래·팔',
     ex:[
      {n:'포즈 / 스포토 벤치', reps:6, sets:[4,4,4,2], pct:0.65, of:'bp', tier:'s'},
      {n:'오버헤드 프레스', reps:6, sets:[4,4,4,2], pct:0.60, of:'bp', tier:'s'},
      {n:'덤벨 숄더 프레스', reps:10, sets:[3,4,4,2], est:['bp',0.22], note:'한쪽', tier:'h'},
      {n:'사이드 레터럴 레이즈', reps:15, sets:[4,4,5,2], est:['bw',0.10], tech:'마지막 세트 드롭', note:'한쪽 · 덤벨', tier:'h'},
      {n:'케이블 사이드 레터럴', reps:15, sets:[3,3,4,2], est:['bw',0.09], tech:'3단 드롭세트', note:'한쪽', tier:'h'},
      {n:'리어 델트 플라이', reps:15, sets:[3,4,4,2], est:['bw',0.10], tech:'마지막 세트 드롭', note:'한쪽', tier:'h'},
      {n:'페이스풀', reps:15, sets:[3,4,4,2], est:['bw',0.33], note:'가볍게', tier:'h'},
      {n:'삼두 + 이두 슈퍼셋', reps:12, sets:[3,4,4,2], tech:'슈퍼셋', note:'2회 남기고', tier:'h'},
      {n:'시티드 카프 레이즈', reps:15, sets:[3,4,4,2], est:['bw',0.35], tier:'h'}
     ]},
    {tag:'DAY 5', dow:4, name:'하체 볼륨 · 약점', sub:'스쿼트·데드 2회차 + 둔근·햄',
     ex:[
      {n:'프론트 스쿼트', reps:5, sets:[4,4,4,2], pct:0.55, of:'sq', tier:'s'},
      {n:'데피싯 데드리프트', reps:4, sets:[4,4,4,2], pct:0.60, of:'dl', tier:'s'},
      {n:'불가리안 스플릿 스쿼트', reps:10, sets:[3,3,4,2], est:['bw',0.20], note:'덤벨 한쪽', tier:'h'},
      {n:'힙 쓰러스트', reps:12, sets:[3,4,4,2], est:['sq',0.65], tier:'h'},
      {n:'라잉 레그컬', reps:15, sets:[3,3,4,2], est:['bw',0.33], tier:'h'},
      {n:'케이블 크런치', reps:12, sets:[3,3,4,2], est:['bw',0.45], tier:'h'}
     ]}
  ];

  /* 토·일은 헬스장에 못 가는 날 — 집에서 하는 회복 */
  var WEEKEND = {tag:'주말 · 토 · 일 — 헬스장 X', name:'집에서 회복', ex:[
    {n:'토 · 걷기', s:'30~40분', note:'가볍게'},
    {n:'토 · 모빌리티 (고관절·흉추·발목)', s:'15분', note:'매트'},
    {n:'토 · 플랭크 + 레그레이즈', s:'3세트 × 12회', note:'맨몸'},
    {n:'일 · 산책', s:'20~30분', note:'완전 휴식'},
    {n:'일 · 다음 주 무게 확인', s:'5분', note:'기록 정리'}
  ]};

  var HABITS = [
    {n:'훈련 세션', d:'월~금', trainOnly:true},
    {n:'주말 회복 (걷기 · 모빌리티)', d:'토·일', weekendOnly:true},
    {n:'단백질 목표', d:function(v){ return Math.round(v.bw*2)+'g'; }},
    {n:'아침 공복 체중 기록', d:''},
    {n:'수면 7.5~8시간', d:''},
    {n:'물 3~3.5L', d:''},
    {n:'크레아틴 5g', d:''},
    {n:'훈련 기록 (무게·횟수·체감)', d:'월~금', trainOnly:true}
  ];

  /* 1RM 측정 주차 — 1주차(데드 확인), 이후 12주마다(디로드 직후 블록 1주차), 104주차 최종 시도 */
  var TEST_WEEKS = (function(){
    var a = [1];
    for (var w = 13; w <= 97; w += 12) a.push(w);
    a.push(104);
    return a;
  })();
  function isTest(w){ return TEST_WEEKS.indexOf(w) >= 0; }
  function nextTest(w){
    for (var i=0;i<TEST_WEEKS.length;i++) if (TEST_WEEKS[i] > w) return TEST_WEEKS[i];
    return null;
  }

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
  /* 기준 1RM은 네가 입력한 값 그대로다. 달력이 올려주지 않는다 —
     올리려면 측정 주차에 실제로 재서 직접 바꿔야 한다. */
  function tmFor(v, block){
    return {sq:v.sq, bp:v.bp, dl:v.dl};
  }
  /* 계획상의 목표치 (로드맵 차트 전용, 실제 처방에는 쓰지 않음) */
  function projected(v, block){
    var o = {};
    ['sq','bp','dl'].forEach(function(k){
      var target = Math.max(TARGETS[k], v[k]);
      o[k] = Math.round((v[k] + (target - v[k]) * frac(block, k)) / 1.25) * 1.25;
    });
    return o;
  }
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
    if (wib === 4) msg = '<b>회복 주차.</b> 메인은 전부 55%로 2세트 × 5회, 근비대 보조는 2세트에 무게 15% 감량. 이번 주는 가볍게 가는 게 목적입니다. 다음 블록을 시작하기 전에 기록을 보고 기준 1RM을 올릴지 직접 정하세요.';
    else if (wib === 3) msg = '<b>강도 · 볼륨 정점 주차.</b> 근력 쪽은 가장 무겁고, 근비대 쪽은 세트 수가 가장 많은 주입니다. 이번 주가 제일 힘들어야 정상입니다. 근력 세트에서 정해진 횟수를 두 블록 연속 놓치면 무게를 더하지 말고 무거운 3회로 재측정하세요.';
    else if (week === 1) msg = '<b>첫 주 — 강도 확인.</b> 1주차 마지막 세트에 <b>2~3회</b>가 남아야 정상입니다. 4회 이상 남으면 그 종목의 기준 1RM을 올리고, 하나도 안 남으면 내리세요.';
    else if (phase >= 3 && wib === 1) msg = '<b>페이즈 ' + phase + '.</b> 증가폭이 절반으로 줄었습니다. 무게는 이제 바가 아니라 약점 보완과 자세에서 나옵니다.';
    $('wBanner').innerHTML = msg;
    $('wBanner').hidden = !msg;

    /* 1RM 측정 주차 */
    var testing = isTest(week);
    $('wBadge').hidden = !testing;
    var nt = nextTest(week);
    $('wNextTest').innerHTML = testing
      ? '이번 주에 1RM을 다시 잽니다 · 다음 측정은 ' + (nt ? nt + '주차' : '없음')
      : (nt ? '다음 1RM 측정 &nbsp;<b>' + nt + '주차</b> &nbsp;— ' + (nt - week) + '주 남음' : '측정 일정 종료');
    $('wTest').hidden = !testing;
    if (testing){
      var final = week >= 101, first = week === 1;
      $('wProtoHd').textContent = first ? '1주차 — 데드리프트 실측'
        : final ? '104주차 — 500 시도' : week + '주차 — 1RM 재측정';
      $('wProtoWhy').innerHTML = first
        ? '데드리프트 <strong>160kg</strong>은 비율로 뽑은 추정치입니다. 이번 주에 실제 값을 확인하고 <strong>현재 1RM</strong> 칸에 넣으면 앞으로의 104주가 전부 다시 계산됩니다. 스쿼트·벤치는 이미 아는 숫자니 그대로 진행하세요.'
        : final
        ? '마지막 블록입니다. 3회가 아니라 <strong>진짜 싱글</strong>을 칩니다. 오프너(90%) → 세컨드(95%) → 서드(100%) 순으로, 시합처럼 세 번만.'
        : '지난 블록까지 12주 동안 무게를 더해 왔습니다. 계산상의 1RM이 실제와 벌어졌을 시점이라 여기서 맞춥니다. <strong>디로드 바로 다음 주</strong>라 몸이 가장 가벼운 타이밍입니다.';
      var pd = [
        {d:'월요일', l:'스쿼트', c:'25', w: first ? '측정 안 함 — 평소대로 진행' : (final ? '싱글: 90% → 95% → 100%' : '무거운 3회 1세트, RPE 9에서 정지')},
        {d:'화요일', l:'벤치',   c:'20', w: first ? '측정 안 함 — 평소대로 진행' : (final ? '싱글: 90% → 95% → 100%' : '무거운 3회 1세트, RPE 9에서 정지')},
        {d:'수요일', l:'데드리프트', c:'15', w: final ? '싱글: 90% → 95% → 100%' : '무거운 3회 1세트, RPE 9에서 정지'}
      ];
      $('wProtoDays').innerHTML = pd.map(function(x){
        return '<div class="pday"><div class="d">'+x.d+'</div>'
          + '<div class="l"><span class="chipdot" style="background:var(--p'+x.c+')"></span>'+x.l+'</div>'
          + '<div class="w">'+x.w+'</div></div>';
      }).join('');
    }

    /* 4주 파동 스트립 — 이번 주 퍼센트가 어디쯤인지 */
    $('wWave').innerHTML = WAVE.map(function(x, i){
      var cls = (i+1) === wib ? ' on' : ((i+1) < wib ? ' done' : '');
      return '<div class="w4cell'+cls+'">'
        + '<div class="wk">'+x.wk+' · '+x.label+'</div>'
        + '<div class="pc">'+(Math.round(x.pct*1000)/10)+'%</div>'
        + '<div class="sc">'+x.scheme+'</div>'
        + '</div>';
    }).join('');

    /* 무게가 나오는 식 — 출처를 숨기지 않는다 */
    var proj = projected(v, block);
    $('wFormula').innerHTML =
      '<b>네가 입력한 1RM</b> <span>스쿼트 '+fmt(tm.sq)+' · 벤치 '+fmt(tm.bp)+' · 데드 '+fmt(tm.dl)+'</span>'
      + '<em>×</em> <b>'+(Math.round(row.pct*1000)/10)+'%</b>'
      + '<span>= 아래 무게. 이 숫자는 네가 직접 바꾸기 전까지 안 움직입니다.</span>'
      + (proj.sq > tm.sq || proj.dl > tm.dl
          ? '<span style="width:100%;color:var(--faint)">계획상 이 시점 목표는 스쿼트 '+fmt(proj.sq)+' · 벤치 '+fmt(proj.bp)+' · 데드 '+fmt(proj.dl)+' — 측정 주차에 확인해서 직접 올리세요.</span>'
          : '');

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
        + '<span class="pl">'+plateHTML(kg)+'</span>'
        + '<div class="sub">입력한 1RM <b>'+fmt(tm[k])+'kg</b> × '+(Math.round(row.pct*1000)/10)+'% = <b>'+fmt(kg)+'kg</b></div>'
        + '</div>';
    });
    $('wLifts').innerHTML = cards;

    /* 요일별 훈련 — 근력 블록 + 근비대 블록 */
    var days = '';
    function exRow(e){
      var kg = '', cls = 'kgv', sch = '', sub = '';
      var ns = e.sets ? e.sets[wib-1] : 0;
      if (e.main){
        kg = fmt(r25(tm[e.main] * row.pct)) + 'kg';
        sch = row.scheme;
      } else {
        if (!ns) return '';
        sch = ns + '세트 × ' + e.reps + '회';
        if (e.pct){
          var w = r25(tm[e.of] * e.pct);
          kg = fmt(wib === 4 ? r25(w * 0.85) : w) + 'kg';
        } else if (e.est){
          var base = e.est[0] === 'bw' ? v.bw : tm[e.est[0]];
          var ew = r25(base * e.est[1]);
          if (wib === 4) ew = r25(ew * 0.85);
          kg = (e.est[2] === '+' ? '+' : '') + fmt(ew) + 'kg';
          sub = e.note || '';
        } else {
          kg = e.note || '맨몸'; cls = 'kgv soft';
        }
      }
      var key = keyOf(e.n), tag = EX[key] ? 'button' : 'div';
      return '<'+tag+(tag === 'button' ? ' type="button" data-guide="'+key+'"' : '')
        + ' class="ex w3'+(e.main ? ' main' : '')+'"'
        + (e.main ? ' style="--mc:var(--p'+({sq:'25',bp:'20',dl:'15'}[e.main])+')"' : '')+'>'
        + '<span class="n">'+e.n+(e.tech ? '<i class="tech">'+e.tech+'</i>' : '')+'</span>'
        + '<span class="s">'+sch+'</span>'
        + '<span class="'+cls+'">'+kg+(sub ? '<em>'+sub+'</em>' : '')+'</span>'
        + '</'+tag+'>';
    }
    DAYS.forEach(function(d){
      var date = addDays(mon, d.dow);
      days += '<div class="day">'
        + '<div class="daytag">'+d.tag+' · '+DOW[d.dow]+'요일 · '+md(date)+'</div>'
        + '<h3>'+d.name+'</h3>'
        + '<div class="tier"><b>근력</b><span>휴식 2~3분 · RPE 7~8</span></div>'
        + '<div class="exlist">'+d.ex.filter(function(e){return e.tier==='s';}).map(exRow).join('')+'</div>'
        + '<div class="tier hyp"><b>근비대</b><span>휴식 45~90초 · 마지막 세트 RPE 9~10</span></div>'
        + '<div class="exlist">'+d.ex.filter(function(e){return e.tier==='h';}).map(exRow).join('')+'</div>'
        + '</div>';
    });
    var wrows = '';
    WEEKEND.ex.forEach(function(e){
      var wk = keyOf(e.n), wtag = EX[wk] ? 'button' : 'div';
      wrows += '<'+wtag+(wtag === 'button' ? ' type="button" data-guide="'+wk+'"' : '')+' class="ex w3">'
        + '<span class="n">'+e.n+'</span><span class="s">'+e.s+'</span>'
        + '<span class="kgv soft">'+e.note+'</span></'+wtag+'>';
    });
    days += '<div class="day rest">'
      + '<div class="daytag">'+WEEKEND.tag+' · '+md(addDays(mon,5))+'–'+md(addDays(mon,6))+'</div>'
      + '<h3>'+WEEKEND.name+'</h3><div class="exlist">' + wrows + '</div>'
      + '</div>';
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
        if ((h.trainOnly && !isT) || (h.weekendOnly && i < 5)){
          g += '<div class="dc off"><span class="dash">·</span></div>'; continue;
        }
        var id = hi + '-' + i;
        g += '<div class="dc'+(isT ? ' train' : '')+'">'
          + '<input type="checkbox" data-k="'+id+'"'+(wk[id] ? ' checked' : '')
          + ' aria-label="'+h.n+' '+DOW[i]+'요일"></div>';
      }
    });
    $('wDaily').innerHTML = g;

    $('wPrev').disabled = week <= 1;
    $('wNext').disabled = week >= TOTAL_WEEKS;
  }

  function goWeek(n){
    wState.week = Math.min(TOTAL_WEEKS, Math.max(1, n));
    wSave();
    renderWeek(read());
    document.dispatchEvent(new CustomEvent('training:week'));
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
      wState.start = $('wStart').value; wSave(); renderWeek(read());
      document.dispatchEvent(new CustomEvent('training:week'));
    });
    function epCalc(){
      var w = parseFloat($('epW').value), n = parseInt($('epR').value, 10);
      if (!isFinite(w) || w <= 0 || !isFinite(n) || n < 1){ $('epOut').textContent = '—'; return null; }
      var one = n === 1 ? w : w * (1 + n/30);
      $('epOut').textContent = fmt(Math.round(one * 2) / 2);
      return r25(one);
    }
    $('epW').addEventListener('input', epCalc);
    $('epR').addEventListener('input', epCalc);
    document.querySelector('.epapply').addEventListener('click', function(e){
      var b = e.target.closest ? e.target.closest('[data-ap]') : null;
      if (!b) return;
      var val = epCalc();
      if (val == null) return;
      inputs[b.getAttribute('data-ap')].value = val;
      render();
      b.textContent = '적용됨 \u2713';
      setTimeout(function(){
        b.textContent = {sq:'스쿼트', bp:'벤치', dl:'데드리프트'}[b.getAttribute('data-ap')] + '에 적용';
      }, 1600);
    });
    epCalc();

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
    var saved = 1;   /* 기본값: 주간 실행 — 열면 오늘 훈련이 먼저 보인다 */
    try{ var t = localStorage.getItem('bigthree500.tab'); if (t !== null) saved = parseInt(t,10) === 0 ? 0 : 1; }catch(e){}
    select(saved);
  }

  restore();
  initWeekTab();
  ['sq','bp','dl','bw'].forEach(function(k){
    inputs[k].addEventListener('input', render);
    inputs[k].addEventListener('change', render);
  });
  render();

  window.Training = {
    read: read, render: render, renderWeek: renderWeek,
    state: wState, days: DAYS, wave: WAVE, inputs: inputs,
    goWeek: goWeek, saveWeek: wSave, plates: plateHTML, muscleSVG: muscleSVG
  };
})();