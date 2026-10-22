'use strict';
/* 텔레그램 웹훅. 로직은 _lib/bot.js의 handleUpdate — 여기는 인증·파싱·응답만. */
const {handleUpdate, secretOf, safeEq, safeMsg, sendJson, readBody, createTelegram} = require('./_lib/bot.js');
const {createStore} = require('./_lib/store.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, {ok: false, error: 'POST만 받아요'});
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return sendJson(res, 500, {ok: false, error: 'TELEGRAM_BOT_TOKEN 환경변수가 없어요'});
  if (!safeEq(req.headers['x-telegram-bot-api-secret-token'], secretOf(token))) return sendJson(res, 401, {ok: false});
  try {
    const update = await readBody(req);
    await handleUpdate(update, {now: new Date(), store: createStore(), tg: createTelegram(token)});
  } catch (e) {
    console.error('telegram:', safeMsg(e, token));   /* 텔레그램에는 항상 200 — 안 그러면 같은 메시지를 계속 다시 보낸다 */
  }
  sendJson(res, 200, {ok: true});
};
