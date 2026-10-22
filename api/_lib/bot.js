'use strict';
/* 텔레그램 봇 로직. 라우트(api/telegram.js)는 얇은 래퍼 — 여기 handleUpdate가 테스트 대상. */
const crypto = require('crypto');
const plan = require('./plan.js');

const secretOf = token => crypto.createHash('sha256').update(String(token)).digest('hex').slice(0, 32);
function safeEq(a, b) {
  const x = Buffer.from(String(a == null ? '' : a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
/* 로그에 토큰이 섞여 나가지 않게 */
const safeMsg = (e, token) => { const m = String(e && e.message || e); return token ? m.split(token).join('***') : m; };

function sendJson(res, code, obj) {
  res.statusCode = code;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj, null, 2));
}
async function readBody(req) {
  let b = req.body;
  if (b === undefined && typeof req.on === 'function') {
    b = await new Promise((ok, no) => { const c = []; req.on('data', x => c.push(x)); req.on('end', () => ok(Buffer.concat(c).toString('utf8'))); req.on('error', no); });
  }
  if (Buffer.isBuffer(b)) b = b.toString('utf8');
  return typeof b === 'string' ? JSON.parse(b) : b;
}

function createTelegram(token) {
  const call = async (method, body) => {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)});
    return res.json().catch(() => ({ok: false, description: `HTTP ${res.status}`}));
  };
  return {
    call,
    async send(chatId, text) {
      const j = await call('sendMessage', {chat_id: chatId, text: String(text).slice(0, 4000), parse_mode: 'HTML', disable_web_page_preview: true});
      if (!j.ok) throw new Error(`Telegram sendMessage 실패: ${j.description}`);
    }
  };
}

/* ---- 말 알아듣기 ---- */
const CMD_ALIAS = {'오늘': 'today', '내일': 'tomorrow', '이번주': 'week', '기록': 'status', '도움말': 'help', '시작': 'start'};
const LIFT_ALIAS = {
  sq: 'sq', '스쿼트': 'sq', '스쿼': 'sq', '백스쿼트': 'sq', squat: 'sq',
  bp: 'bp', '벤치': 'bp', '벤치프레스': 'bp', bench: 'bp',
  dl: 'dl', '데드': 'dl', '데드리프트': 'dl', deadlift: 'dl',
  ohp: 'ohp', '오버헤드': 'ohp', '오버헤드프레스': 'ohp',
  bw: 'bw', '체중': 'bw'
};
const liftKey = s => LIFT_ALIAS[String(s || '').toLowerCase()] || null;
const num = s => { const t = String(s || '').replace(/kg$/i, '').replace(',', '.'); return /^\d+(\.\d+)?$/.test(t) ? Math.round(parseFloat(t) * 100) / 100 : NaN; };
function parse(text) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.startsWith('/')) {
    const [head, ...args] = t.split(' '), name = head.slice(1).split('@')[0].toLowerCase();
    return {name: CMD_ALIAS[name] || name, args};
  }
  const flat = t.replace(/[\s!?.~]/g, '');
  return {name: CMD_ALIAS[flat] || '', args: []};
}

const HELP = [
  '쓸 수 있는 말이에요',
  '/today 또는 "오늘" — 오늘 운동',
  '/tomorrow 또는 "내일" — 내일 운동',
  '/week 또는 "이번주" — 이번 주 전체',
  '/status 또는 "기록" — 지금 최대 무게와 500kg까지 남은 무게',
  '/1rm 스쿼트 145 — 최대 무게(1RM) 바꾸기 (스쿼트·벤치·데드·오버헤드, 체중도 가능)',
  '/amrap 데드 107.5 6 — 마지막 세트 기록하기 (종목 · 무게 · 실제로 한 횟수)'
].join('\n');
const WELCOME = ['안녕하세요! 3대 500 운동 도우미예요 🏋️', '운동하는 날 아침 7시(싱가포르 시간)에 오늘 운동을 보내드려요.', '', HELP].join('\n');
const NEED_STORE = '저장소(Upstash Redis)가 아직 연결 안 돼서 저장 못 했어요.';

async function handleUpdate(update, {now = new Date(), store, tg, env = process.env} = {}) {
  const m = update && update.message;
  if (!m || !m.chat || typeof m.text !== 'string') return {replies: []};
  const chatId = String(m.chat.id), date = plan.sgToday(now), replies = [];
  const say = async t => { replies.push(t); await tg.send(chatId, t); };
  try {
    let state = await store.load(date);
    const owner = state.owner || env.TELEGRAM_CHAT_ID || null, cmd = parse(m.text);
    if (!owner) {   /* 첫 /start가 주인 */
      if (cmd.name !== 'start') { await say('먼저 /start 를 보내주세요.'); return {replies}; }
      if (store.configured) { state = {...state, owner: chatId}; await store.save(state); }
      await say(WELCOME + '\n\n' + plan.dayMessage(date, state) + (store.configured ? '' : `\n\n${NEED_STORE} 연결하기 전까지는 이 봇을 내 것으로 잠글 수 없어요.`));
      return {replies};
    }
    if (String(owner) !== chatId) { await say('개인용 봇이에요.'); return {replies}; }

    switch (cmd.name) {
      case 'start': await say(WELCOME + '\n\n' + plan.dayMessage(date, state)); break;
      case 'today': await say(plan.dayMessage(date, state)); break;
      case 'tomorrow': await say(plan.dayMessage(plan.addDays(date, 1), state, date)); break;
      case 'week': await say(plan.weekMessage(date, state)); break;
      case 'status': await say(plan.statusMessage(state, date)); break;
      case 'help': await say(HELP); break;
      case '1rm': await say(await setCmd(cmd.args, state, date, store)); break;
      case 'amrap': await say(await amrapCmd(cmd.args, state, date, store)); break;
      default: await say('무슨 말인지 잘 모르겠어요. 이렇게 보내보세요.\n\n' + HELP);
    }
  } catch (e) {
    console.error('handleUpdate:', safeMsg(e));
    try { await tg.send(chatId, '잠깐 문제가 생겼어요. 잠시 뒤에 다시 보내주세요.'); } catch (e2) { console.error('reply:', safeMsg(e2)); }
  }
  return {replies};
}

/* /1rm 스쿼트 145 */
async function setCmd(args, state, date, store) {
  const key = liftKey(args[0]), kg = num(args[1]);
  if (!key || args.length < 2) return '이렇게 보내주세요: /1rm 스쿼트 145\n종목은 스쿼트·벤치·데드·오버헤드·체중 중에서 골라요.';
  const [lo, hi] = key === 'bw' ? plan.LIMITS.bw : plan.LIMITS.lift, label = key === 'bw' ? '체중' : plan.LIFT_NAME[key];
  if (!(kg >= lo && kg <= hi)) return `${label}: ${lo}~${hi}kg 사이로 입력해주세요. 예: /1rm ${key === 'bw' ? '체중 78.5' : '스쿼트 145'}`;
  if (!store.configured) return NEED_STORE;
  const next = plan.setValue(state, key, kg, date);
  await store.save(next);
  if (key === 'bw') return `✅ 체중을 ${plan.fmt(kg)}kg으로 저장했어요. 체중으로 계산하는 보조 운동 무게에 반영돼요.`;
  const week = plan.weekAt(date), tm = plan.tmFor(next, week)[key], out = [`✅ ${label} 최대 무게(1RM)를 ${plan.fmt(kg)}kg으로 저장했어요.`, `이번 주 기준값은 ${plan.fmt(tm)}kg이에요.`];
  const nm = plan.nextMain(key, date, next);
  if (nm) out.push('', `다음 ${label} 운동 — ${plan.mdKo(nm.s.date)}`, plan.waveLine(nm.s), plan.mainBlock(nm.it));
  return out.join('\n');
}

/* /amrap 데드 107.5 6 */
async function amrapCmd(args, state, date, store) {
  const key = liftKey(args[0]), kg = num(args[1]), reps = num(args[2]);
  if (key === 'bw') return '체중은 이렇게 바꿔요: /1rm 체중 78.5';
  if (!key || args.length < 3) return '이렇게 보내주세요: /amrap 데드 107.5 6\n(종목 · 마지막 세트 무게 · 실제로 한 횟수)';
  if (!(kg > 0 && kg <= 500) || !Number.isInteger(reps) || reps < 1 || reps > 50) return '무게는 1~500kg, 횟수는 1~50회 사이로 입력해주세요. 예: /amrap 데드 107.5 6';
  if (!store.configured) return NEED_STORE;
  const r = plan.applyAmrap(state, key, kg, reps, date), label = plan.LIFT_NAME[key], head = `${label} ${plan.fmt(kg)}kg × ${reps}회`;
  await store.save(r.state);
  if (r.kind === 'deload') return `📝 ${head} 기록했어요.\n이번 주는 가볍게 쉬어가는 회복 주라 최대 무게는 바꾸지 않아요.`;
  if (r.kind === 'miss') return `📝 ${head} 기록했어요.\n${label} 최소 ${r.min}회를 못 채웠어요. 이럴 땐 기준값을 10% 낮춰서 다시 쌓는 게 맞아요.\n낮추려면 아래를 그대로 보내주세요:\n/1rm ${plan.CMD_NAME[key]} ${plan.fmt(r.resetTo)}`;
  if (r.kind === 'raise') return `🔥 ${head} → 추정 최대 무게 ${plan.fmt(r.est)}kg\n${label} 최대 무게(1RM)를 ${plan.fmt(r.one)} → ${plan.fmt(r.est)}kg로 올렸어요. 다음 운동부터 새 기준값으로 계산해요.`;
  return `📝 ${head} → 추정 ${r.est ? plan.fmt(r.est) + 'kg' : '계산 불가'}\n지금 기준값이 가리키는 ${plan.fmt(r.cur)}kg보다 높지 않아서 그대로 둘게요.`;
}

module.exports = {handleUpdate, secretOf, safeEq, safeMsg, sendJson, readBody, createTelegram, parse, liftKey, HELP, NEED_STORE};
