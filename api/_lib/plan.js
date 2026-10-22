'use strict';
/* 텔레그램 봇의 플랜 계산 — 사이트(core.js·plan-data.js·legacy.js tmFor·app.js rx)와 같은 수식을 쓴다.
   전부 순수 함수: 오늘 날짜(싱가포르)와 상태를 인자로 받는다. 날짜는 'YYYY-MM-DD' 문자열(싱가포르 달력 기준). */
const C = require('../../core.js');
const P = require('../../plan-data.js');

const TZ = 'Asia/Singapore';
const LIFT_KEYS = ['sq', 'bp', 'dl', 'ohp'];
const LIFT_NAME = {sq: '스쿼트', bp: '벤치', dl: '데드리프트', ohp: '오버헤드 프레스'};
const CMD_NAME = {sq: '스쿼트', bp: '벤치', dl: '데드', ohp: '오버헤드'};   /* /amrap 예시용 짧은 이름 */
const DOW = ['월', '화', '수', '목', '금', '토', '일'];
const GOAL = 500;

const esc = s => String(s).replace(/[&<>]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[c]));
const fmt = x => String(Math.round(x * 100) / 100);
/* 운동 이름에 든 '+'는 '/'로 */
const disp = n => esc(String(n).replace(/\s*\+\s*/g, ' / '));

/* ---- 날짜 (서버 시간대와 무관하게 UTC 일수로 계산) ---- */
const dn = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) / 86400000; };
const addDays = (s, n) => new Date((dn(s) + n) * 86400000).toISOString().slice(0, 10);
const dowOf = s => (new Date(dn(s) * 86400000).getUTCDay() + 6) % 7;   /* 월=0 … 일=6 */
const mondayOf = s => addDays(s, -dowOf(s));
const md = s => `${+s.slice(5, 7)}/${+s.slice(8)}`;
const mdKo = s => `${+s.slice(5, 7)}월 ${+s.slice(8)}일(${DOW[dowOf(s)]})`;
function sgToday(now) {
  const p = {};
  for (const x of new Intl.DateTimeFormat('en-US', {timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(now)) p[x.type] = x.value;
  return `${p.year}-${p.month}-${p.day}`;
}
const toISO = d => d instanceof Date ? sgToday(d) : d;

/* ---- 주차 ---- */
/* 플랜 시작 전이면 1주차(미리보기) */
const weekAt = date => Math.max(1, Math.floor((dn(mondayOf(date)) - dn(P.PLAN_START)) / 7) + 1);
const weekInfo = week => ({week, wib: (week - 1) % 4 + 1, wave: P.WAVE[(week - 1) % 4], cycle: P.cycleOf(week), mon: addDays(P.PLAN_START, (week - 1) * 7)});

/* ---- 상태 ---- */
function defaultState(date) {
  const rec = {...P.PLAN_REC, ohp: P.LIFTS.find(l => l.k === 'ohp').def}, c = P.cycleOf(weekAt(date)), base = {};
  for (const k of LIFT_KEYS) base[k] = {b: rec[k], c};
  return {owner: null, rec, bw: 78, base, log: []};
}
/* 저장소에서 읽은 값을 안전하게 정리 */
function normalizeState(raw, date) {
  const d = defaultState(date), r = raw && typeof raw === 'object' ? raw : {}, num = (x, def) => Number.isFinite(x) && x > 0 ? x : def;
  const rec = {}, base = {};
  for (const k of LIFT_KEYS) {
    rec[k] = num(r.rec && r.rec[k], d.rec[k]);
    const b = r.base && r.base[k];
    base[k] = b && b.b === rec[k] && Number.isFinite(b.c) ? {b: b.b, c: b.c} : {b: rec[k], c: d.base[k].c};
  }
  return {owner: r.owner != null ? String(r.owner) : null, rec, bw: num(r.bw, d.bw), base, log: Array.isArray(r.log) ? r.log.slice(-100) : []};
}
/* legacy tmBase와 같은 규칙: 1RM이 바뀌었는데 기준 기록이 없으면 지금 사이클부터 다시 센다 */
function fixBase(state, date) {
  const cyc = P.cycleOf(weekAt(date)), base = {...state.base};
  let changed = false;
  for (const k of LIFT_KEYS) if (!base[k] || base[k].b !== state.rec[k]) { base[k] = {b: state.rec[k], c: cyc}; changed = true; }
  return changed ? {...state, base} : state;
}
const vOf = st => ({...st.rec, bw: st.bw || 78});
/* legacy tmFor: TM = 1RM × 90% + (사이클 − 기준 사이클) × 증량 */
function tmFor(state, week) {
  const cyc = P.cycleOf(week), o = {};
  for (const k of LIFT_KEYS) {
    const b = state.base && state.base[k], c = b && b.b === state.rec[k] ? b.c : cyc;
    o[k] = C.tmOf(state.rec[k]) + Math.max(0, cyc - c) * P.INC[k];
  }
  return o;
}

/* ---- 하루 처방 (app.js exercises/rx) ---- */
function session(date, st) {
  if (date < P.PLAN_START) return null;
  const dow = dowOf(date), idx = P.DAYS.findIndex(d => d.dow === dow);
  if (idx < 0) return null;
  const week = weekAt(date), info = weekInfo(week), tm = tmFor(st, week), v = vOf(st), day = P.DAYS[idx];
  const items = day.ex.map(e => ({...e})).map(e => ({e, rx: C.prescription(e, info.wave, info.wib, v, tm)})).filter(x => x.rx.sets > 0)
    .map(({e, rx}) => ({name: e.n, main: e.main || null, fsl: e.fsl || null, note: e.note || '', kg: rx.kg, sets: rx.sets, reps: rx.reps, plan: rx.plan || null, tm: rx.tm}));
  return {date, dow, idx, day, ...info, tm, items};
}
const sessionFor = (date, state) => { date = toISO(date); return session(date, fixBase(state, date)); };
function nextSession(date, st) {
  const from = addDays(date, 1) < P.PLAN_START ? P.PLAN_START : addDays(date, 1);
  for (let i = 0; i < 8; i++) { const s = session(addDays(from, i), st); if (s) return s; }
  return null;
}
/* 그 종목 메인 운동이 있는 가장 가까운 날 (오늘 포함) */
function nextMain(lift, date, st) {
  const from = date < P.PLAN_START ? P.PLAN_START : date;
  for (let i = 0; i < 15; i++) {
    const s = session(addDays(from, i), st), it = s && s.items.find(x => x.main === lift);
    if (it) return {s, it};
  }
  return null;
}

/* ---- 메시지 ---- */
const mainBlock = it => `<b>${disp(it.name)}</b> (기준값 ${fmt(it.tm)}kg)\n` +
  it.plan.map((p, i) => `${i + 1}세트 ${fmt(p.kg)}kg ${p.amrap ? `최대한 (최소 ${p.reps}회)` : `${p.reps}회`}`).join('\n');
const exLine = it => `${disp(it.name)}${it.kg != null ? ` ${fmt(it.kg)}kg${/한쪽/.test(it.note) ? ' (한쪽)' : ''}` : ''} · ${it.sets}세트 × ${it.reps}회`;
const waveLine = s => `${s.week}주차 · ${s.wib === 4 ? '가벼운 회복 주 · ' : ''}${s.wave.scheme}`;
const hasMax = it => !!(it && it.plan && it.plan[it.plan.length - 1].amrap);

function dayBody(s, tag = '') {
  const lines = [`💪 ${tag}${md(s.date)} (${DOW[s.dow]}) · ${esc(s.day.name)}`, waveLine(s)];
  if (s.wib === 4) lines.push('이번 주는 가볍게 쉬어가는 회복 주예요. 무게를 올리지 말고 자세만 다듬어요. 보조 운동은 2세트만 해요.');
  const main = s.items.find(x => x.main), rest = s.items.filter(x => !x.main);
  if (main) lines.push('', mainBlock(main));
  if (rest.length) lines.push('', ...rest.map(exLine));
  if (hasMax(main)) {
    const last = main.plan[main.plan.length - 1];
    lines.push('', `마지막 세트 기록하기: /amrap ${CMD_NAME[main.main]} ${fmt(last.kg)} ${last.reps + 3}`, '(최대한 = 자세가 무너지기 직전까지. 마지막 숫자는 실제로 한 횟수로 바꿔요)');
  }
  return lines.join('\n');
}

/* date: 보여줄 날, today: 지금 날짜(기본 date) */
function dayMessage(date, state, today) {
  date = toISO(date); today = today ? toISO(today) : date;
  const st = fixBase(state, today), s = session(date, st);
  if (s) return dayBody(s, date === today ? '' : date === addDays(today, 1) ? '내일 · ' : '');
  const who = date === today ? '오늘' : date === addDays(today, 1) ? '내일' : '이 날';
  const head = [`😴 ${md(date)} (${DOW[dowOf(date)]})`];
  if (date < P.PLAN_START) head.push(`⏳ 플랜 시작 전 — ${mdKo(P.PLAN_START)}부터 1주차예요.`);
  head.push(`${who}은 쉬는 날이에요.${date < P.PLAN_START ? '' : ' 헬스장은 쉬고, 걷기·산책 정도만 가볍게 해요.'}`);
  const next = nextSession(date, st);
  if (next) head.push('', '▼ 다음 운동 미리보기', '', dayBody(next));
  return head.join('\n');
}

function mainSummary(it) {
  const kgs = it.plan.map(p => fmt(p.kg)).join(' · ');
  return `${disp(it.name)} ${kgs}kg${hasMax(it) ? ' (마지막 세트 최대한)' : ''}`;
}
function weekMessage(date, state) {
  date = toISO(date);
  const st = fixBase(state, date), week = weekAt(date), info = weekInfo(week), pre = date < P.PLAN_START;
  const out = [`📅 ${week}주차 (${md(info.mon)} ~ ${md(addDays(info.mon, 4))}) · ${info.wib === 4 ? '가벼운 회복 주 · ' : ''}${info.wave.scheme}`];
  if (pre) out.push(`⏳ 플랜 시작 전 — ${mdKo(P.PLAN_START)}부터예요. 1주차 미리보기입니다.`);
  for (const day of P.DAYS) {
    const d = addDays(info.mon, day.dow), s = session(d, st);
    const first = s.items[0];
    out.push('', `${DOW[day.dow]} ${md(d)} · ${esc(day.name)}${d === date ? ' ◀ 오늘' : ''}`,
      first.plan ? mainSummary(first) : exLine(first),
      `그 외 ${s.items.length - 1}가지 운동`);
  }
  return out.join('\n');
}

function statusMessage(state, date) {
  date = toISO(date);
  const st = fixBase(state, date), week = weekAt(date), info = weekInfo(week), tm = tmFor(st, week), r = st.rec;
  const total = r.sq + r.bp + r.dl, left = GOAL - total;
  const out = ['📊 지금 기록'];
  if (date < P.PLAN_START) out.push(`⏳ 플랜 시작 전 — ${mdKo(P.PLAN_START)}부터 1주차예요. 아래 기준값은 1주차 기준이에요.`);
  out.push('', '최대 무게 (1RM)', ...LIFT_KEYS.map(k => `${LIFT_NAME[k]} ${fmt(r[k])}kg`),
    '', `합계 ${fmt(total)}kg (스쿼트·벤치·데드리프트) — ${left > 0 ? `${GOAL}kg까지 ${fmt(left)}kg 남았어요` : `${GOAL}kg 달성! 🎉`}`,
    `체중 ${fmt(st.bw)}kg`,
    '', `이번 주 ${info.week}주차 (4주 묶음 ${info.cycle}번째) 기준값`, ...LIFT_KEYS.map(k => `${LIFT_NAME[k]} ${fmt(tm[k])}kg`),
    '기준값은 세트 무게를 계산하는 기준이에요. 4주마다 조금씩 올라가요.');
  const recent = st.log.slice(-3).reverse();
  if (recent.length) out.push('', '최근 마지막 세트 기록', ...recent.map(l => `${md(l.date)} ${LIFT_NAME[l.lift]} ${fmt(l.kg)}kg × ${l.reps}회${l.est ? ` → 추정 ${fmt(l.est)}kg` : ''}`));
  return out.join('\n');
}

/* ---- 값 바꾸기 (/1rm, /amrap) ---- */
const LIMITS = {bw: [30, 200], lift: [20, 400]};
/* 1RM이 바뀌면 그 사이클부터 증량을 다시 센다 (사이트와 같은 규칙) */
function setValue(state, key, kg, date) {
  date = toISO(date);
  const st = fixBase(state, date);
  if (key === 'bw') return {...st, bw: kg};
  const base = {...st.base};
  if (st.rec[key] !== kg) base[key] = {b: kg, c: P.cycleOf(weekAt(date))};
  return {...st, rec: {...st.rec, [key]: kg}, base};
}
/* app.js AMRAP 처리와 같은 규칙: 최소 횟수 미달 → 10% 낮추기 안내, 추정치 > 현재 기준 → 1RM 상향, 디로드 → 변경 없음 */
function applyAmrap(state, lift, kg, reps, date) {
  date = toISO(date);
  const st = fixBase(state, date), week = weekAt(date), info = weekInfo(week), tm = tmFor(st, week);
  const plan = C.prescription({main: lift}, info.wave, info.wib, vOf(st), tm).plan, last = plan[plan.length - 1];
  const est = C.amrap(kg, reps), one = st.rec[lift], cur = Math.round(tm[lift] / 0.9 / 2.5) * 2.5;
  const log = [...st.log, {lift, kg, reps, est, date}].slice(-100);
  const res = {est, one, cur, min: last.reps, resetTo: Math.round(one * 0.9 / 2.5) * 2.5};
  if (!last.amrap) return {...res, kind: 'deload', state: {...st, log}};
  if (reps < last.reps) return {...res, kind: 'miss', state: {...st, log}};
  if (est && est > cur) return {...res, kind: 'raise', state: {...setValue(st, lift, est, date), log}};
  return {...res, kind: 'keep', state: {...st, log}};
}

module.exports = {TZ, LIFT_KEYS, LIFT_NAME, CMD_NAME, DOW, LIMITS, esc, fmt, addDays, dowOf, mondayOf, md, mdKo, sgToday, weekAt, weekInfo,
  defaultState, normalizeState, fixBase, tmFor, sessionFor, nextSession, nextMain, mainBlock, waveLine, dayMessage, weekMessage, statusMessage, setValue, applyAmrap};
