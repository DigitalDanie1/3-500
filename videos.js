/* 영상 — 실제로 재생되는 것만 골라 확인한 유튜브 영상. 썸네일을 누르면 그 자리에서 재생. */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const SEC=[{"id": "deadlift", "name": "데드리프트", "sub": "지금 가장 많이 오를 종목. 바닥에서 떼는 구간부터.", "v": [{"id": "FD-MMp1DwPo", "t": "완벽한 데드리프트 '4가지' 단계별 법칙 (f.스포츠재활석사들)", "ch": "모멘트핏 록코치", "en": false, "why": "처음부터 단계별로. 데드가 스쿼트보다 낮다면 여기서 시작."}, {"id": "CsoReWY0zPo", "t": "데드리프트 가벼워지는 시작 자세(구독자 자세 체크)", "ch": "라이노스트렝스", "en": false, "why": "바닥에서 떼는 첫 동작. 금요일 멈춤 데드와 같은 구간."}, {"id": "xoWsyPiYqAw", "t": "완벽한 데드리프트 자세를 위한 5가지 체크포인트", "ch": "어썸블리스 AwesomeBLISS", "en": false, "why": "세트 들어가기 전에 확인할 체크포인트."}, {"id": "h8Xabl0zArU", "t": "[약점 보완] 데드리프트 기량 늘리기 - 중간 구간 힘 기르기", "ch": "운동학자", "en": false, "why": "무릎 근처에서 막힐 때 — 중간 구간 힘 기르기."}, {"id": "Mehwx_lbs9A", "t": "이렇게 하면 안되는 무게가 됩니다! 데드리프트 고중량 드는 방법", "ch": "바디101", "en": false, "why": "무게가 올라가면 자세가 어디서 무너지는지."}, {"id": "gCPyCmhWeAc", "t": "데드리프트가 당신의 '허리'를 박살내는 진짜 이유!? (feat. 통증없는 데드리프트 자세)", "ch": "어썸블리스 AwesomeBLISS", "en": false, "why": "허리가 먼저 아프면 이것부터."}, {"id": "ZaTM37cfiDs", "t": "How To Deadlift With Perfect Technique (Step By Step)", "ch": "Jeff Nippard", "en": true, "why": "정강이와 바 거리부터 시작하는 5단계 셋업."}, {"id": "WaNb5HDniYE", "t": "Deadlift Set-up and Body Shape", "ch": "Alan Thrall (Untamed Strength)", "en": true, "why": "체형마다 시작 자세가 다르다는 것."}, {"id": "edBFYfRVguo", "t": "Deadlift Tips with Ben Pollack | JTSstrength.com", "ch": "Juggernaut Training Systems", "en": true, "why": "합계 925kg 선수 벤 폴락의 데드 팁."}, {"id": "edJMMhbWUHI", "t": "데드리프트 중량을 늘리기 위한 세계적으로 유명한 데드 루틴 [Coan/Phillipi]", "ch": "세계적으로 유명한 운동 정보", "en": false, "why": "데드 전용 루틴. 나중에 데드가 정체되면 참고 — 5/3/1과 동시에 하지는 말 것."}]}, {"id": "squat", "name": "스쿼트", "sub": "바 위치·랙에서 빼기·보폭·앉는 방향.", "v": [{"id": "xypDd2p7ZGs", "t": "스쿼트, 제대로 자세 잡기: 벤 폴락 (삼대중량 900kg) 에게 배워보자 pt.1", "ch": "운동학자", "en": false, "why": "합계 925kg 선수 벤 폴락의 스쿼트 1편 — 바 위치와 그립."}, {"id": "FlGyhbaIsCU", "t": "스쿼트, 제대로 자세 잡기: 벤 폴락 (삼대중량 900kg) 에게 배워보자 pt.2", "ch": "운동학자", "en": false, "why": "2편 — 랙에서 바를 빼는 법과 보폭."}, {"id": "nIyMucBIxco", "t": "고중량 스쿼트하는 방법은 따로 있습니다 | 파워리프팅 자세", "ch": "어썸블리스 AwesomeBLISS", "en": false, "why": "고중량 스쿼트 — 로우바·하이바, 견착, 브레이싱."}, {"id": "3Vze2ZH26H4", "t": "스쿼트는 무릎이 아닌 \"이것\"으로 하는것 입니다 _ 전 역도 국가대표 천정평 코치의 구독자 자세 점검_스쿼트 (Squat)", "ch": "크라토스", "en": false, "why": "전 역도 국가대표 코치의 구독자 자세 점검."}, {"id": "O-Y1LHweoTg", "t": "역도 스쿼트 자세 배우기!!! 하이바/로우바 스쿼트 자세 비교 squat !!!", "ch": "1RM", "en": false, "why": "하이바와 로우바, 어느 쪽으로 할지 정할 때."}, {"id": "J_ekvFybels", "t": "How to Squat: The Definitive Guide", "ch": "Calgary Barbell", "en": true, "why": "파워리프팅 팀 Calgary Barbell의 스쿼트 총정리."}, {"id": "PPmvh7gBTi0", "t": "Do You Have A Perfect Squat? (Find Out)", "ch": "Jeff Nippard", "en": true, "why": "5가지 체크로 내 스쿼트 점검."}, {"id": "sdeQjm7avi8", "t": "The Fastest Way To Blow Up Your Squat (4 Science-Based Steps)", "ch": "Jeff Nippard", "en": true, "why": "스쿼트 중량을 빠르게 올리는 4단계."}, {"id": "v-mQm_droHg", "t": "HOW TO FRONT SQUAT: Build Bigger Quads & A Stronger Squat", "ch": "Jeff Nippard", "en": true, "why": "금요일 프론트 스쿼트 자세."}]}, {"id": "brace", "name": "복압 · 기본기", "sub": "스쿼트와 데드 둘 다 결국 이걸로 듭니다.", "v": [{"id": "22E0TVhNzLo", "t": "복압으로 허리를 보호하는 법. 스쿼트 데드리프트 필수 스킬 발살바 호흡.", "ch": "건지부부", "en": false, "why": "숨 잡는 법(발살바 호흡). 무거워질수록 이게 전부."}, {"id": "uiQtGl9qXnE", "t": "스쿼트 벤치 데드가 완벽하게 안되는 가장 근본적인 이유", "ch": "파워게르만POGER", "en": false, "why": "세 종목이 다 같이 안 될 때의 공통 원인."}]}, {"id": "program", "name": "5/3/1 · 3대 500", "sub": "지금 하는 프로그램이 왜 이렇게 생겼는지.", "v": [{"id": "6mLqzb_ePRQ", "t": "짐 웬들러 531 운동 프로그램의 완벽한 설명과 모든 용어 해석", "ch": "세계적으로 유명한 운동 정보", "en": false, "why": "지금 하는 프로그램. 기준값·최대한 세트·가벼운 반복이 왜 있는지."}, {"id": "UcTGPSAijpg", "t": "알렌의 운동 프로그램 리뷰#3(짐웬들러531)", "ch": "라이노스트렝스 - 운동정보", "en": false, "why": "5/3/1의 장단점 리뷰."}, {"id": "KQw-hsFMVkc", "t": "Jim Wendler 5/3/1 Program Explained - Best Intermediate Program?", "ch": "Ben Winney", "en": true, "why": "5/3/1 구조 영어 설명."}, {"id": "UP1uCq6mWfI", "t": "중학교 선생님이 헬린이에서 3대 500까지 걸린 기간", "ch": "세계적으로 유명한 운동 정보", "en": false, "why": "헬린이에서 3대 500까지 실제로 걸린 기간."}, {"id": "PmtfHixFYog", "t": "3대 500 못하는 트레이너도 있나?", "ch": "트레이브니티", "en": false, "why": "3대 500이 어느 정도 숫자인지 감 잡기."}, {"id": "M6T28KIZCrg", "t": "중급자 3대 떡상 루틴 분석 5편 nSuns 5/3/1 스트렝스 근력 루틴 정체기 파괴 (nSuns review)", "ch": "수행자TV", "en": false, "why": "5/3/1로 정체가 오면 고려할 변형(nSuns)."}]}, {"id": "bench", "name": "벤치", "sub": "", "v": [{"id": "86wxeW3NEUk", "t": "벤치 프레스, 제대로 자세 잡기: (벤폴락 삼대중량 900kg)에게 배워보자 pt.2", "ch": "운동학자", "en": false, "why": "벤 폴락의 벤치 — 발 위치, 아치, 그립."}]}];
const KEY='bigthree500.watched.v1';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let W={};try{W=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){}
const saveW=()=>{try{localStorage.setItem(KEY,JSON.stringify(W));}catch(e){}};
function card(v){
  return `<article class="vcard${W[v.id]?' seen':''}" id="v-${v.id}">
    <button class="vthumb" data-play="${v.id}" aria-label="${esc(v.t)} 재생">
      <img src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt="" loading="lazy" width="320" height="180">
      <span class="vplay" aria-hidden="true">&#9654;</span>${v.en?'<span class="ven">EN</span>':''}
    </button>
    <div class="vmeta">
      <p class="vwhy">${esc(v.why)}</p>
      <h3 class="vt">${esc(v.t)}</h3>
      <div class="vch">${esc(v.ch)}</div>
      <div class="vact"><label class="vseen"><input type="checkbox" data-seen="${v.id}"${W[v.id]?' checked':''}> 봤음</label>
        <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener noreferrer">유튜브에서 열기 &#8599;</a></div>
    </div>
  </article>`;
}
function render(){
  const host=$('pane-video');if(!host)return;
  const total=SEC.reduce((n,s)=>n+s.v.length,0),seen=SEC.reduce((n,s)=>n+s.v.filter(v=>W[v.id]).length,0);
  host.innerHTML=`<section class="sec">
      <div class="eyebrow">영상 · 데드와 스쿼트 먼저</div>
      <h2>보고 따라 할 영상만 골랐어요.</h2>
      <p class="body">전부 실제로 재생되는지 하나씩 확인한 영상이에요. 썸네일을 누르면 이 화면에서 바로 재생돼요. 한국어가 먼저고, 영어 영상은 <b>EN</b> 표시가 붙어 있어요 (유튜브 자막 → 자동 번역 → 한국어로 보면 돼요). 지금까지 <b>${seen} / ${total}</b>개 봤어요.</p>
      <nav class="vjump">${SEC.map(s=>`<a href="#vs-${s.id}">${esc(s.name)} <small>${s.v.length}</small></a>`).join('')}</nav>
    </section>
    ${SEC.map(s=>`<section class="sec" id="vs-${s.id}">
      <div class="eyebrow">${esc(s.name)}</div>${s.sub?`<p class="body vsub">${esc(s.sub)}</p>`:''}
      <div class="vgrid">${s.v.map(card).join('')}</div>
    </section>`).join('')}
    <p class="fnote">영상은 각 채널의 콘텐츠예요. 자세 판단이 어려우면 측면에서 찍어 직접 비교해 보세요.</p>`;
}
document.addEventListener('click',e=>{
  const t=e.target.closest?e.target.closest('[data-play],[data-video-sec]'):null;if(!t)return;
  if(t.dataset.play){
    const id=t.dataset.play;
    t.outerHTML=`<div class="vframe"><iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;
    if(!W[id]){W[id]=1;saveW();const cb=document.querySelector(`[data-seen="${id}"]`);if(cb)cb.checked=true;document.getElementById('v-'+id)?.classList.add('seen');}
  } else if(t.dataset.videoSec){
    const d=$('guide-dialog');if(d&&d.open){if(d.close)d.close();else d.removeAttribute('open');}
    const tab=$('tabVideo');if(tab)tab.click();
    const sec=$('vs-'+t.dataset.videoSec);if(sec&&sec.scrollIntoView)sec.scrollIntoView({block:'start'});
  }
});
document.addEventListener('change',e=>{
  if(!e.target.dataset||!e.target.dataset.seen)return;
  const id=e.target.dataset.seen;if(e.target.checked)W[id]=1;else delete W[id];saveW();
  document.getElementById('v-'+id)?.classList.toggle('seen',!!W[id]);
});
root.Videos={SEC,render,secFor:name=>/데드|RDL/.test(name)&&!/루마니안/.test(name)?'deadlift':/스쿼트/.test(name)?'squat':/벤치/.test(name)?'bench':null};
render();
})(typeof window!=='undefined'?window:globalThis);
