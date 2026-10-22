'use strict';
/* 한 번만 여는 설정 페이지: 웹훅 등록 + 명령어 목록. 토큰은 절대 출력하지 않는다. */
const {secretOf, safeMsg, sendJson, createTelegram} = require('./_lib/bot.js');
const {createStore} = require('./_lib/store.js');

const COMMANDS = [
  ['today', '오늘 운동 보기'], ['tomorrow', '내일 운동 보기'], ['week', '이번 주 전체 보기'], ['status', '지금 기록과 500kg까지 남은 무게'],
  ['1rm', '최대 무게 바꾸기 (예: /1rm 스쿼트 145)'], ['amrap', '마지막 세트 기록하기 (예: /amrap 데드 107.5 6)'], ['help', '쓰는 법 보기']
].map(([command, description]) => ({command, description}));

module.exports = async (req, res) => {
  if (req.method !== 'GET') return sendJson(res, 405, {ok: false, message: '브라우저로 주소를 열어주세요 (GET)'});
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return sendJson(res, 500, {ok: false, message: 'TELEGRAM_BOT_TOKEN 환경변수가 없어요. Vercel → Settings → Environment Variables에 넣고 다시 배포하세요.'});
  const url = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || req.headers.host}/api/telegram`;
  const storage = createStore().configured
    ? {configured: true, message: '저장소 연결됨'}
    : {configured: false, message: '저장소(Upstash Redis)가 아직 연결 안 됐어요. 연결하고 다시 배포하기 전에는 최대 무게를 저장할 수 없어요.'};
  try {
    const tg = createTelegram(token);
    const hook = await tg.call('setWebhook', {url, secret_token: secretOf(token), allowed_updates: ['message'], drop_pending_updates: true});
    if (!hook.ok) return sendJson(res, 502, {ok: false, message: `웹훅 등록에 실패했어요: ${hook.description}`, webhook: url, storage});
    const cmds = await tg.call('setMyCommands', {commands: COMMANDS});
    sendJson(res, 200, {ok: true, message: '연결 완료! 이제 텔레그램 봇에 /start 를 보내세요.', webhook: url, commands: cmds.ok ? '명령어 목록 등록됨' : `명령어 목록 등록 실패: ${cmds.description}`, storage});
  } catch (e) {
    sendJson(res, 502, {ok: false, message: `텔레그램에 연결하지 못했어요: ${safeMsg(e, token)}`, webhook: url, storage});
  }
};
