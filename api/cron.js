'use strict';
/* 매일 아침 7시(싱가포르) 오늘 운동 푸시. vercel.json crons: 23:00 UTC 일~목 = 싱가포르 월~금 07:00 */
const plan = require('./_lib/plan.js');
const {safeEq, safeMsg, sendJson, createTelegram} = require('./_lib/bot.js');
const {createStore} = require('./_lib/store.js');

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET, h = req.headers || {};
  const ok = secret ? safeEq(h.authorization, `Bearer ${secret}`) : String(h['user-agent'] || '').startsWith('vercel-cron');
  if (!ok) return sendJson(res, 401, {ok: false, error: 'unauthorized'});
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return sendJson(res, 500, {ok: false, error: 'TELEGRAM_BOT_TOKEN 환경변수가 없어요'});
  try {
    const date = plan.sgToday(new Date()), state = await createStore().load(date), owner = state.owner || process.env.TELEGRAM_CHAT_ID;
    if (!owner) return sendJson(res, 200, {ok: true, skipped: '주인이 없어요 — 봇에 /start 를 먼저 보내세요', date});
    if (!plan.sessionFor(date, state)) return sendJson(res, 200, {ok: true, skipped: '오늘은 쉬는 날이에요', date});
    await createTelegram(token).send(owner, plan.dayMessage(date, state));
    sendJson(res, 200, {ok: true, sent: true, date});
  } catch (e) {
    console.error('cron:', safeMsg(e, token));
    sendJson(res, 500, {ok: false, error: safeMsg(e, token)});
  }
};
