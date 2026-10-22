'use strict';
/* Upstash Redis REST 저장소 — 의존성 없이 fetch만 쓴다. 키 하나(bot:state)에 JSON으로 통째 저장.
   환경변수가 없으면 configured=false: 읽기는 기본값, 쓰기는 아무것도 안 하고 {saved:false}를 돌려준다. */
const plan = require('./plan.js');

const KEY = 'bot:state';

function createStore(env = process.env) {
  const url = (env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || '').replace(/\/+$/, '');
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || '';
  const configured = !!(url && token);

  async function cmd(args) {
    const res = await fetch(url, {method: 'POST', headers: {Authorization: `Bearer ${token}`, 'content-type': 'application/json'}, body: JSON.stringify(args)});
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j.error) throw new Error(`Upstash ${args[0]} 실패: ${j.error || res.status}`);
    return j.result;
  }

  return {
    configured,
    /* date: 오늘(싱가포르) — 처음 쓸 때 증량 기준 사이클을 잡는 데 쓴다. 읽기 실패는 던진다(기본값으로 덮어쓰지 않도록) */
    async load(date) {
      if (!configured) return plan.defaultState(date);
      const raw = await cmd(['GET', KEY]);
      let parsed = null;
      if (raw) { try { parsed = JSON.parse(raw); } catch (e) { throw new Error('저장된 상태를 읽지 못했어요'); } }
      return plan.normalizeState(parsed, date);
    },
    async save(state) {
      if (!configured) return {saved: false};
      await cmd(['SET', KEY, JSON.stringify({...state, log: state.log.slice(-100)})]);
      return {saved: true};
    }
  };
}

module.exports = {createStore, KEY};
