(()=>{
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const app=$('#app'),title=$('#title'),back=$('#back'),scrim=$('#scrim');
const order=['inicio','resultados','res-costas','res-pescoco','res-ombro','res-joelho','res-pernas','res-bracos','res-regiao','aulas','aula-postura','aula-tonus','aula-equilibrio','aula-mobilidade','aula-estresse','horarios','sobre','local'];
const tabs=['inicio','resultados','aulas','sobre','local'];
const isReg=id=>id.startsWith('regiao-'), secId=id=>isReg(id)?'res-regiao':id;
const tabOf=id=>id.startsWith('res-')?'resultados':id.startsWith('aula-')?'aulas':id==='horarios'?'aulas':id;
let cur='inicio';

function go(id,push=true,instant=false){
  if(!order.includes(secId(id))||(id==='res-regiao')) id='inicio';
  closeSheets(); stopVideos();
  if(id===cur && !instant) return;
  if(isReg(id)) fillRegiao(id.slice(7));
  const from=$('#'+secId(cur)),to=$('#'+secId(id));
  const fwd=order.indexOf(secId(id))>order.indexOf(secId(cur));
  to.style.transition=from.style.transition=instant?'none':'';
  // posiciona a tela que entra do lado certo, sem animar
  to.style.transition='none'; to.classList.remove('on','out'); to.style.transform='translateX('+(fwd?24:-24)+'px)';
  void to.offsetWidth; to.style.transition=''; to.style.transform='';
  from.classList.remove('on'); from.classList.toggle('out',fwd); if(!fwd) from.classList.remove('out');
  if(!fwd) from.style.transform='translateX(24px)'; else from.style.transform='';
  if(from===to){ to.classList.add('on'); from.style.transform=''; }
  to.classList.add('on'); to.scrollTop=0;
  setTimeout(()=>{from.style.transform=''},350);
  cur=id;
  title.textContent=to.dataset.title||'';
  back.hidden=id==='inicio';
  app.classList.toggle('home',id==='inicio'); app.classList.toggle('nofab',secId(id).startsWith('res-')||id.startsWith('aula-'));
  $$('#tabbar button').forEach(b=>b.classList.toggle('on',b.dataset.go===(isReg(id)?'inicio':tabOf(secId(id)))));
  corpo3dVisivel(id==='inicio');
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
$('#screens').addEventListener('touchstart',e=>{ if(e.target.closest('.swipe,.nosw')){x0=null;return;} const t=e.touches[0];x0=t.clientX;y0=t.clientY;t0=Date.now()},{passive:true});
$('#screens').addEventListener('touchend',e=>{ if(x0===null)return; const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0; x0=null;
  if(Math.abs(dx)>70&&Math.abs(dy)<45&&Date.now()-t0<600){ if(!tabs.includes(cur))return; const i=tabs.indexOf(cur)+(dx<0?1:-1); if(i>=0&&i<tabs.length) go(tabs[i]); } },{passive:true});

// ---- vídeos por região (data/videos.json) ----
const ICON={abdomen:'i-postura',biceps:'i-ombro',triceps:'i-ombro',antebraco:'i-ombro',cotovelo:'i-ombro',coxa:'i-joelho',perna:'i-joelho',costas:'i-costas',pescoco:'i-pescoco',ombro:'i-ombro',joelho:'i-joelho','aulas-postura':'i-postura','aulas-tonus':'i-tonus','aulas-equilibrio':'i-equilibrio','aulas-mobilidade':'i-mobilidade','aulas-estresse':'i-estresse'};
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
let VIDEOS=[]; let videosPronto;
async function loadVideos(){
  let data=[];
  try{ const r=await fetch('data/videos.json',{cache:'no-cache'}); data=await r.json(); }catch(e){}
  VIDEOS=Array.isArray(data)?data:[];
  $$('.vlist:not([data-dyn])').forEach(l=>{
    const regs=l.dataset.regions?l.dataset.regions.split(','):null; const reg=l.dataset.region; l.textContent='';
    const all=Array.isArray(data)?data:[];
    const items=regs?regs.flatMap(r=>all.filter(v=>v.region===r)):all.filter(v=>v.region===reg&&(!l.dataset.id||v.id===l.dataset.id)); const single=!!l.dataset.id;
    if(!items.length){ l.appendChild(el('p','note','Os vídeos desta região aparecem aqui.')); return; }
    items.forEach((it,i)=>l.appendChild(card(Object.assign({region:reg},it),single?0:i+1)));
  });
}
videosPronto=loadVideos();

// ---- v28: fichas de caso (aba Resultados) — dados em data/casos.json ----
function medidor(valor,rotulo,cls){
  const v=Math.max(0,Math.min(100,Math.round(Number(valor)||0)));
  const w=el('div','dor-med '+(cls||'')); w.setAttribute('role','img'); w.setAttribute('aria-label',rotulo+': dor '+v+' de 100');
  w.appendChild(el('span','dm-num',String(v)));
  const bars=el('div','dm-bars'); const N=20;
  for(let i=N;i>=1;i--){ const b=el('i'); const on=i*5<=v||(i===1&&v>0); if(on){ b.className='on'; b.style.setProperty('--t',((i-1)/(N-1)).toFixed(3)); } bars.appendChild(b); }
  const esc=el('div','dm-esc'); ['100','50','0'].forEach(t=>esc.appendChild(el('span',null,t)));
  const col=el('div','dm-col'); col.appendChild(esc); col.appendChild(bars); w.appendChild(col);
  w.appendChild(el('span','dm-lab',rotulo)); return w;
}
function fotoOuVazio(src,alt,cls){
  if(src){ const im=el('img',cls); im.src=src; im.alt=alt||''; im.loading='lazy'; im.decoding='async'; return im; }
  const d=el('div',(cls||'')+' foto-vazia'); d.appendChild(svgUse('i-aulas','ln')); d.appendChild(el('span',null,'Foto em breve')); return d;
}
function fichaCaso(c){
  const art=el('article','caso'); const ex=!!c.exemplo; const exs=t=>ex?t+' (exemplo)':t;
  // Avaliação
  const av=el('section','cs-bloco cs-av');
  const h=el('header','cs-h'); h.appendChild(el('h3',null,'Avaliação')); if(ex) h.appendChild(el('span','cs-tag','Exemplo')); av.appendChild(h);
  const top=el('div','cs-top');
  const dl=el('dl','cs-dados');
  if(c.nome){ dl.appendChild(el('dt',null,'Aluno(a)')); dl.appendChild(el('dd',null,c.nome)); }
  dl.appendChild(el('dt',null,'Idade')); dl.appendChild(el('dd',null,c.idade!=null&&c.idade!==''?exs(c.idade+' anos'):'—'));
  dl.appendChild(el('dt',null,'Queixa')); dl.appendChild(el('dd',null,c.queixa||'—'));
  dl.appendChild(el('dt',null,'Diagnóstico')); dl.appendChild(el('dd',null,c.diagnostico||'—'));
  top.appendChild(dl);
  const fw=el('figure','cs-foto'); fw.appendChild(fotoOuVazio(c.foto,c.fotoAlt)); top.appendChild(fw);
  av.appendChild(top);
  const mid=el('div','cs-mid');
  const bn=el('figure','cs-boneco');
  if(c.boneco){ const bi=el('img'); bi.src=c.boneco; bi.alt='Boneco com a região '+(c.regiaoNome||'da dor')+' marcada em vermelho'; bi.loading='lazy'; bn.appendChild(bi); }
  bn.appendChild(el('figcaption',null,c.regiaoNome||'')); mid.appendChild(bn);
  const meds=el('div','cs-meds'); meds.appendChild(el('p','cs-mt','Nível de dor · 0 a 100'));
  const row=el('div','cs-medrow'); row.appendChild(medidor(c.dorAntes,'Antes','antes'));
  if(c.dorDepois!=null&&c.dorDepois!=='') row.appendChild(medidor(c.dorDepois,'Depois','depois'));
  meds.appendChild(row); if(ex) meds.appendChild(el('p','cs-mini','Valores de exemplo.')); mid.appendChild(meds);
  av.appendChild(mid); art.appendChild(av);
  // Tratamento
  const tr=el('section','cs-bloco cs-tr');
  const h2=el('header','cs-h'); h2.appendChild(el('h3',null,'Tratamento')); if(ex) h2.appendChild(el('span','cs-tag','Exemplo')); tr.appendChild(h2);
  (c.exercicios||[]).forEach((e,i)=>{
    const f=el('figure','cs-ex'); f.appendChild(fotoOuVazio(e.foto,e.titulo,'cs-exfoto'));
    const cap=el('figcaption'); const t=el('div','cs-ext'); t.appendChild(el('span','cs-exn',String(i+1))); t.appendChild(el('strong',null,e.titulo||('Exercício '+(i+1)))); cap.appendChild(t);
    if(e.legenda) cap.appendChild(el('p',null,e.legenda));
    if(e.vezesPorSemana) cap.appendChild(el('span','cs-freq',e.vezesPorSemana+(Number(e.vezesPorSemana)===1?' vez':' vezes')+' por semana'));
    f.appendChild(cap); tr.appendChild(f);
  });
  art.appendChild(tr); return art;
}
async function loadCasos(){
  let d={}; try{ const r=await fetch('data/casos.json',{cache:'no-cache'}); d=await r.json(); }catch(e){}
  const all=Array.isArray(d.casos)?d.casos:[];
  $$('.casos[data-region]').forEach(box=>{
    const reg=box.dataset.region; box.textContent=''; const its=all.filter(c=>c.regiao===reg);
    if(!its.length){ const s=el('div','caso-breve'); const ic=el('div','pain-ic'); ic.appendChild(svgUse(ICON[reg]||'i-aulas','ln')); s.appendChild(ic);
      s.appendChild(el('h3',null,'Caso em breve')); s.appendChild(el('p',null,'Aqui vai aparecer a ficha de um caso desta região: a avaliação e os exercícios do tratamento, com autorização da pessoa.')); box.appendChild(s); return; }
    its.forEach(c=>box.appendChild(fichaCaso(c)));
  });
}
loadCasos();


// ---- corpo 3D interativo (Início): carrega só quando a aba abre ----
let REGDATA=null,regPromise=null;
const regioes=()=>regPromise||(regPromise=fetch('data/regioes.json',{cache:'no-cache'}).then(r=>r.json()).then(d=>REGDATA=d));
async function fillRegiao(key){
  const [d]=await Promise.all([regioes(),videosPronto]);
  const rg=d.regioes.find(r=>r.id===key); const sec=$('#res-regiao'); if(!rg) return;
  sec.dataset.title=rg.nome; if(cur==='regiao-'+key) title.textContent=rg.nome;
  $('#rg-h').textContent=rg.nome; $('#rg-ic').setAttribute('href','#'+(rg.icone||'i-costas'));
  const items=(rg.videos||[]).map(id=>VIDEOS.find(v=>v.id===id)).filter(Boolean);
  $('#rg-p').textContent=items.length>1?'Escolha um vídeo e veja o resultado de pessoas que a Bia já atendeu com incômodo nesta região.':'Um vídeo de uma pessoa que a Bia já atendeu, mostrando o resultado nesta região.';
  const l=$('#rg-list'); stopVideos(); l.textContent='';
  if(!items.length) l.appendChild(el('p','note','Os vídeos desta região aparecem aqui.'));
  items.forEach((it,i)=>l.appendChild(card(it,items.length>1?i+1:0)));
  $('#rg-wa').href='https://wa.me/5545999795418?text='+encodeURIComponent('Olá! Vi os resultados da região "'+rg.nome.toLowerCase()+'" no app e gostaria de agendar uma aula experimental.');
}
let C3=null,C3p=null; const body3d=$('#body3d'),tip=$('#b3-tip'); let tipReg=null;
function mostrarTip(reg,persist){
  tipReg=reg||null; if(!reg){ tip.hidden=true; tip.classList.remove('persist'); body3d.dataset.estado=C3?'ok':body3d.dataset.estado; return; }
  tip.querySelector('.b3-name').textContent=reg.nome; tip.classList.toggle('persist',!!persist); tip.hidden=false; if(persist) body3d.classList.add('tocou');
}
function abrirRegiao(reg){ if(reg) go('regiao-'+reg.id); }
function vistaBtns(v){ $$('.b3-ctl button').forEach(b=>b.classList.toggle('on',b.dataset.v===v)); }
function corpo3dVisivel(on){
  if(on){ if(!C3p) iniciar3d(); else if(C3){ C3.zerar(); mostrarTip(null); C3.pausar(false); } }
  else if(C3) C3.pausar(true);
}
function iniciar3d(){
  body3d.dataset.estado='loading';
  C3p=(async()=>{
    try{
      const [mod,dados]=await Promise.all([import('./js/corpo3d.js?v=28'),regioes()]);
      C3=await mod.iniciar(body3d,{modelo:dados.modelo||'modelo/corpo.glb',dados,debug:/[?&]dbg3d/.test(location.search),
        aoAbrir:abrirRegiao, aoSobre:(reg,persist)=>mostrarTip(reg,persist), aoMudar:({vista})=>vistaBtns(vista)});
      body3d.dataset.estado='ok'; window.__corpo3d=C3;
    }catch(e){
      body3d.dataset.estado='erro'; body3d.querySelector('.b3-msg').textContent='Não foi possível mostrar o corpo 3D neste aparelho. Veja as regiões na aba Resultados.'; console.warn('corpo3d',e);
    }
  })();
}
$$('.b3-ctl button').forEach(b=>b.addEventListener('click',()=>{ if(C3){ C3.vista(b.dataset.v); body3d.classList.add('tocou'); mostrarTip(null); C3.zerar(); } }));
$('.b3-open').addEventListener('click',()=>abrirRegiao(tipReg));

// esconde o botão flutuante do WhatsApp enquanto o cartão 'Agendar aula experimental' está na tela
if('IntersectionObserver' in window){ const wc=$('#inicio .hero-card'); if(wc) new IntersectionObserver(e=>app.classList.toggle('wavis',e[0].isIntersecting),{threshold:.6}).observe(wc); }

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

const LEG={dores:'resultados','dor-costas':'res-costas','dor-pescoco':'res-pescoco','dor-ombro':'res-ombro','dor-joelho':'res-joelho'};
const h=LEG[location.hash.slice(1)]||location.hash.slice(1);
history.replaceState({s:'inicio'},'','#inicio');
if(isReg(h)){ regioes().then(()=>go(h,true,true)); app.classList.add('home'); }
else if(order.includes(h)&&h!=='inicio'&&h!=='res-regiao') go(h,true,true); else { app.classList.add('home'); setTimeout(()=>corpo3dVisivel(true),250); }
})();
