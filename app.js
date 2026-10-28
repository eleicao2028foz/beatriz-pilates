(()=>{
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const app=$('#app'),title=$('#title'),back=$('#back'),scrim=$('#scrim');
const order=['inicio','dores','dor-costas','dor-pescoco','dor-ombro','dor-joelho','aulas','aula-postura','aula-tonus','aula-equilibrio','aula-mobilidade','aula-estresse','horarios','sobre','local'];
const tabs=['inicio','dores','aulas','sobre','local'];
const tabOf=id=>id.startsWith('dor-')?'dores':id.startsWith('aula-')?'aulas':id==='horarios'?'aulas':id;
let cur='inicio';

function go(id,push=true,instant=false){
  if(!order.includes(id)) id='inicio';
  closeSheets(); stopVideos();
  if(id===cur && !instant) return;
  const from=$('#'+cur),to=$('#'+id);
  const fwd=order.indexOf(id)>order.indexOf(cur);
  to.style.transition=from.style.transition=instant?'none':'';
  // posiciona a tela que entra do lado certo, sem animar
  to.style.transition='none'; to.classList.remove('on','out'); to.style.transform='translateX('+(fwd?24:-24)+'px)';
  void to.offsetWidth; to.style.transition=''; to.style.transform='';
  from.classList.remove('on'); from.classList.toggle('out',fwd); if(!fwd) from.classList.remove('out');
  if(!fwd) from.style.transform='translateX(24px)'; else from.style.transform='';
  to.classList.add('on'); to.scrollTop=0;
  setTimeout(()=>{from.style.transform=''},350);
  cur=id;
  title.textContent=to.dataset.title||'';
  back.hidden=id==='inicio';
  app.classList.toggle('home',id==='inicio'); app.classList.toggle('nofab',id.startsWith('dor-')||id.startsWith('aula-'));
  $$('#tabbar button').forEach(b=>b.classList.toggle('on',b.dataset.go===tabOf(id)));
  if(push) history.pushState({s:id},'','#'+id);
  if(navigator.vibrate) try{navigator.vibrate(8)}catch(e){}
}
function openSheet(id){ closeSheets(); $('#'+id).classList.add('on'); scrim.classList.add('on'); history.pushState({s:cur,sheet:id},'','#'+cur); }
function closeSheets(fromPop){ const was=$$('.sheet.on').length; $$('.sheet.on').forEach(s=>s.classList.remove('on')); scrim.classList.remove('on'); }

document.addEventListener('click',e=>{
  const g=e.target.closest('[data-go]'); if(g){ go(g.dataset.go); return; }
  const s=e.target.closest('[data-sheet]'); if(s){ openSheet(s.dataset.sheet); return; }
  if(e.target.closest('[data-close]')||e.target===scrim){ if($$('.sheet.on').length) history.back(); return; }
  const p=e.target.closest('[data-ph]'); if(p) e.preventDefault();
});
back.addEventListener('click',()=>{ if(history.state&&history.state.s&&history.state.s!=='inicio') history.back(); else go('inicio',false); });
addEventListener('popstate',e=>{
  if($$('.sheet.on').length && !(e.state&&e.state.sheet)){ closeSheets(true); return; }
  const id=(e.state&&e.state.s)||location.hash.slice(1)||'inicio'; go(id,false);
});

// swipe horizontal entre telas (borda a borda não conflita com o carrossel)
let x0=null,y0=null,t0=0;
$('#screens').addEventListener('touchstart',e=>{ if(e.target.closest('.swipe')){x0=null;return;} const t=e.touches[0];x0=t.clientX;y0=t.clientY;t0=Date.now()},{passive:true});
$('#screens').addEventListener('touchend',e=>{ if(x0===null)return; const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0; x0=null;
  if(Math.abs(dx)>70&&Math.abs(dy)<45&&Date.now()-t0<600){ if(!tabs.includes(cur))return; const i=tabs.indexOf(cur)+(dx<0?1:-1); if(i>=0&&i<tabs.length) go(tabs[i]); } },{passive:true});

// ---- vídeos por região (data/videos.json) ----
const ICON={costas:'i-costas',pescoco:'i-pescoco',ombro:'i-ombro',joelho:'i-joelho','aulas-postura':'i-postura','aulas-tonus':'i-tonus','aulas-equilibrio':'i-equilibrio','aulas-mobilidade':'i-mobilidade','aulas-estresse':'i-estresse'};
const NS='http://www.w3.org/2000/svg';
const svgUse=(id,cls)=>{const s=document.createElementNS(NS,'svg');s.setAttribute('class',cls||'ln');const u=document.createElementNS(NS,'use');u.setAttribute('href','#'+id);s.appendChild(u);return s;};
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;};
function parseVideo(url){
  url=(url||'').trim(); if(!url) return null;
  let m;
  if((m=url.match(/instagram\.com\/(?:[\w.]+\/)?(reels?|p|tv)\/([\w-]+)/i))){
    const kind=m[1].toLowerCase().startsWith('reel')?'reel':m[1].toLowerCase(); const link='https://www.instagram.com/'+kind+'/'+m[2]+'/';
    return {type:'instagram',src:link+'embed/',link};
  }
  if((m=url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/i)))
    return {type:'iframe',src:'https://www.youtube-nocookie.com/embed/'+m[1]+'?autoplay=1&playsinline=1&rel=0&modestbranding=1'};
  if((m=url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([\w]+))?/i)))
    return {type:'iframe',src:'https://player.vimeo.com/video/'+m[1]+'?autoplay=1&playsinline=1'+(m[2]?'&h='+m[2]:'')};
  return {type:'file',src:url};
}
function stopVideos(){
  $$('.vframe.playing').forEach(f=>{
    const v=f.querySelector('video'); if(v){try{v.pause()}catch(e){}}
    f.querySelectorAll('video,iframe').forEach(n=>n.remove()); f.classList.remove('playing','ig');
  });
}
function play(frame,item){
  const v=parseVideo(item.videoUrl); if(!v) return;
  stopVideos();
  let node;
  if(v.type==='instagram'){
    node=el('iframe'); node.src=v.src; node.title=item.title; node.loading='lazy'; node.scrolling='no';
    node.allow='autoplay; encrypted-media; picture-in-picture; fullscreen'; node.allowFullscreen=true; node.referrerPolicy='strict-origin-when-cross-origin';
    frame.classList.add('ig');
  } else if(v.type==='iframe'){
    node=el('iframe'); node.src=v.src; node.title=item.title; node.loading='lazy';
    node.allow='autoplay; fullscreen; picture-in-picture; encrypted-media'; node.allowFullscreen=true; node.referrerPolicy='strict-origin-when-cross-origin';
  } else {
    node=el('video'); node.controls=true; node.preload='metadata'; node.setAttribute('playsinline',''); node.setAttribute('webkit-playsinline','');
    node.playsInline=true; if(item.poster) node.poster=item.poster; node.src=v.src; node.setAttribute('aria-label',item.title);
    node.addEventListener('error',()=>{ frame.classList.remove('playing'); node.remove(); frame.classList.add('err'); });
  }
  frame.appendChild(node); frame.classList.add('playing'); frame.classList.remove('err');
  if(node.tagName==='VIDEO'){ const p=node.play(); if(p&&p.catch) p.catch(()=>{}); }
}
function card(item,n){
  const a=el('article','vcard'); a.dataset.id=item.id||'';
  const head=el('div','vc-head');
  if(n) head.appendChild(el('span','vc-num',String(n)));
  const tx=el('div','vc-tx'); tx.appendChild(el('h3',null,item.title||'')); if(item.subtitle) tx.appendChild(el('p',null,item.subtitle)); head.appendChild(tx);
  if(item.duration) head.appendChild(el('span','vc-dur',item.duration));
  a.appendChild(head);
  const fr=el('div','vframe'); const has=!!parseVideo(item.videoUrl);
  if(item.poster) fr.style.backgroundImage='url("'+String(item.poster).replace(/"/g,'%22')+'")'; else fr.classList.add('nopost');
  if(!item.poster) fr.appendChild(svgUse(ICON[item.id]||ICON[item.region]||'i-aulas','ln vbg'));
  const b=el('button','vplay'); b.type='button';
  const tri=document.createElementNS(NS,'svg'); tri.setAttribute('viewBox','0 0 24 24'); tri.setAttribute('class','vtri'); const pa=document.createElementNS(NS,'path'); pa.setAttribute('d','M8 5.5v13l11-6.5z'); pa.setAttribute('fill','currentColor'); tri.appendChild(pa); b.appendChild(tri);
  if(has){ b.setAttribute('aria-label','Assistir: '+item.title); b.addEventListener('click',()=>play(fr,item)); }
  else { fr.classList.add('soon'); b.disabled=true; b.setAttribute('aria-label','Vídeo em breve: '+item.title); const m=el('mark','ph vsoon','Vídeo em breve'); fr.appendChild(m); }
  fr.appendChild(b);
  const er=el('div','verr','Não foi possível carregar o vídeo.'); fr.appendChild(er);
  a.appendChild(fr);
  const pv=parseVideo(item.videoUrl);
  if(pv&&pv.type==='instagram'){
    const l=el('a','ig-link'); l.href=pv.link; l.target='_blank'; l.rel='noopener';
    l.appendChild(svgUse('i-ig','ln')); l.appendChild(document.createTextNode('Assistir no Instagram')); a.appendChild(l);
  }
  return a;
}
async function loadVideos(){
  let data=[];
  try{ const r=await fetch('data/videos.json',{cache:'no-cache'}); data=await r.json(); }catch(e){}
  $$('.vlist').forEach(l=>{
    const reg=l.dataset.region; l.textContent='';
    const items=(Array.isArray(data)?data:[]).filter(v=>v.region===reg&&(!l.dataset.id||v.id===l.dataset.id)); const single=!!l.dataset.id;
    if(!items.length){ l.appendChild(el('p','note','Os vídeos desta região aparecem aqui.')); return; }
    items.forEach((it,i)=>l.appendChild(card(Object.assign({region:reg},it),single?0:i+1)));
  });
}
loadVideos();

// instalação
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
if(standalone) $('#install').style.display='none';
let dip=null; addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;const b=$('#do-install');b.hidden=false;});
$('#do-install').addEventListener('click',async()=>{ if(!dip)return; dip.prompt(); await dip.userChoice; dip=null; $('#do-install').hidden=true; });

// bloqueia zoom por gesto (iOS)
['gesturestart','gesturechange'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault()));

if('serviceWorker' in navigator && location.protocol.startsWith('http')) { const had=!!navigator.serviceWorker.controller; let rl=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(rl||!had) return; rl=true; location.reload(); });
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js').then(r=>r.update&&r.update()).catch(()=>{})); }

const h=location.hash.slice(1);
history.replaceState({s:'inicio'},'','#inicio');
if(order.includes(h)&&h!=='inicio') go(h,true,true); else { app.classList.add('home'); }
})();
