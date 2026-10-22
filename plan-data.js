(function(root){
  'use strict';
  /* 사이트(legacy.js)와 텔레그램 봇(api/_lib/plan.js)이 같이 쓰는 플랜 데이터 — 순수 데이터만 둔다. */
  const LIFTS = [
    {k:'sq', name:'스쿼트',    target:180, def:140},
    {k:'bp', name:'벤치',      target:120, def:105},
    {k:'dl', name:'데드리프트', target:200, def:135},
    {k:'ohp', name:'OHP', target:0, def:65}
  ];

  /* 5/3/1 — 퍼센트는 1RM이 아니라 기준값(TM = 1RM × 90%) 대비.
     마지막 세트 '+'는 횟수 제한 없음(AMRAP). 4주차는 디로드. */
  const WAVE = [
    {wk:'1주차', label:'5s',    scheme:'5회 · 5회 · 최대한', sets:[[.65,5],[.75,5],[.85,5,'+']], amrap:true,
     note:'마지막 세트(5+)는 끝까지. 5회는 최소치이고, 목표는 그 이상입니다.'},
    {wk:'2주차', label:'3s',    scheme:'3회 · 3회 · 최대한', sets:[[.70,3],[.80,3],[.90,3,'+']], amrap:true,
     note:'마지막 세트(3+)는 끝까지. 여기서 8회 이상 나오면 1RM이 자동으로 올라갑니다.'},
    {wk:'3주차', label:'5/3/1', scheme:'5회 · 3회 · 최대한', sets:[[.75,5],[.85,3],[.95,1,'+']], amrap:true,
     note:'가장 무거운 주. 1+는 1회가 최소치입니다 — 자세가 버티는 데까지 계속 가세요.'},
    {wk:'4주차', label:'디로드', scheme:'5회 · 5회 · 5회',  sets:[[.40,5],[.50,5],[.60,5]],
     note:'디로드. 가벼운 반복 없음, 보조 운동도 2세트. 다음 주에 기준값이 올라갑니다.'}
  ];
  const INC = {sq:5, dl:5, bp:2.5, ohp:2.5};   /* 사이클마다 TM 증량 (5/3/1 표준) */

  /* st = 근력 블록, hy = 근비대 블록.  sets = [1주,2주,3주,4주] */
  const DAYS = [
    {tag:'DAY 1', dow:0, name:'하체', sub:'스쿼트 고강도 + 대퇴사두·종아리',
     ex:[
      {n:'백스쿼트', main:'sq', tier:'s'},
      {n:'백스쿼트 (가벼운 반복)', fsl:'sq', sets:5, tier:'s'},
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
      {n:'벤치프레스 (가벼운 반복)', fsl:'bp', sets:5, tier:'s'},
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
      {n:'데드리프트 (가벼운 반복)', fsl:'dl', sets:3, tier:'s'},
      {n:'바벨 로우', reps:8, sets:[4,4,4,2], pct:0.50, of:'dl', tier:'s'},
      {n:'랫풀다운', reps:12, sets:[3,4,4,2], est:['bw',0.80], tech:'마지막 세트 레스트-포즈', note:'와이드 · 광배 폭', tier:'h'},
      {n:'체스트 서포티드 로우', reps:12, sets:[3,4,4,2], est:['bw',0.70], tech:'마지막 세트 레스트-포즈', note:'중간 등 두께', tier:'h'},
      {n:'시티드 케이블 로우', reps:12, sets:[3,4,4,2], est:['bw',0.78], note:'클로즈그립', tier:'h'},
      {n:'스트레이트암 풀다운', reps:15, sets:[3,3,4,2], est:['bw',0.35], tech:'마지막 세트 드롭', note:'광배 고립', tier:'h'},
      {n:'바벨 슈러그', reps:12, sets:[3,4,4,2], est:['dl',0.45], note:'맨 위 1초', tier:'h'},
      {n:'인클라인 덤벨 컬', reps:12, sets:[3,3,4,2], est:['bp',0.12], note:'한쪽', tier:'h'}
     ]},
    {tag:'DAY 4', dow:3, name:'어깨 · 팔', sub:'OHP 고강도 + 벤치 2회차 + 삼각근 3갈래·팔',
     ex:[
      {n:'오버헤드 프레스', main:'ohp', tier:'s'},
      {n:'오버헤드 프레스 (가벼운 반복)', fsl:'ohp', sets:5, tier:'s'},
      {n:'포즈 / 스포토 벤치', reps:5, sets:[3,3,3,2], pct:0.65, of:'bp', tier:'s'},
      {n:'사이드 레터럴 레이즈', reps:15, sets:[4,4,5,2], est:['bw',0.10], tech:'마지막 세트 드롭', note:'한쪽 · 덤벨', tier:'h'},
      {n:'케이블 사이드 레터럴', reps:15, sets:[3,3,4,2], est:['bw',0.09], tech:'3단 드롭세트', note:'한쪽', tier:'h'},
      {n:'리어 델트 플라이', reps:15, sets:[3,4,4,2], est:['bw',0.10], tech:'마지막 세트 드롭', note:'한쪽', tier:'h'},
      {n:'페이스풀', reps:15, sets:[3,4,4,2], est:['bw',0.33], note:'가볍게', tier:'h'},
      {n:'삼두 + 이두 슈퍼셋', reps:12, sets:[3,4,4,2], tech:'슈퍼셋', note:'2회 남기고', tier:'h'},
      {n:'시티드 카프 레이즈', reps:15, sets:[3,4,4,2], est:['bw',0.35], tier:'h'}
     ]},
    {tag:'DAY 5', dow:4, name:'하체 볼륨 · 약점', sub:'데드 연습 + 스쿼트 2회차 + 둔근·햄',
     ex:[
      {n:'프론트 스쿼트', reps:5, sets:[4,4,4,2], pct:0.55, of:'sq', tier:'s'},
      {n:'멈춤 데드리프트', reps:3, sets:[5,5,5,2], pct:0.65, of:'dl', tier:'s'},
      {n:'불가리안 스플릿 스쿼트', reps:10, sets:[3,3,4,2], est:['bw',0.20], note:'덤벨 한쪽', tier:'h'},
      {n:'힙 쓰러스트', reps:12, sets:[3,4,4,2], est:['sq',0.65], tier:'h'},
      {n:'라잉 레그컬', reps:15, sets:[3,3,4,2], est:['bw',0.33], tier:'h'},
      {n:'케이블 크런치', reps:12, sets:[3,3,4,2], est:['bw',0.45], tier:'h'}
     ]}
  ];

  /* 새 플랜(실제 기록) 시작일과 1RM */
  const PLAN_START = '2026-10-19', PLAN_REC = {sq:140, bp:105, dl:135};
  function cycleOf(week){ return Math.floor((week-1)/4) + 1; }
  const api = {LIFTS, WAVE, INC, DAYS, PLAN_START, PLAN_REC, cycleOf};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.PlanData=api;
})(typeof window!=='undefined'?window:globalThis);
