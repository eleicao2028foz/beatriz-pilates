const V='studio-bia-v27';
const SHELL=['./','index.html','app.css','app.js','manifest.webmanifest','fonts/cormorant.woff2','fonts/cormorant-italic.woff2','fonts/jost.woff2','img/cabecalho-logo.webp','img/res-costas.webp','img/res-pescoco.webp','img/res-ombro.webp','img/res-joelho.webp','img/res-pernas.webp','img/res-bracos.webp','img/fundo-aulas.webp','img/fundo-sobre.webp','img/fundo-dores.webp','img/fundo-local.webp','img/fundo-inicio.webp','img/foto-bia.webp','data/videos.json','data/regioes.json','js/corpo3d.js','modelo/corpo.glb','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; const u=new URL(r.url); if(r.method!=='GET'||u.origin!==location.origin) return;
  // Instagram/YouTube/Vimeo são de outra origem e nem entram aqui (retorno acima). Vídeos e áudios grandes: nunca passam pelo cache (rede direta, com suporte a Range)
  if(r.headers.has('range')||r.destination==='video'||r.destination==='audio'||/\.(mp4|m4v|mov|webm|m3u8|ts|mp3|m4a)$/i.test(u.pathname)||/\/videos\//.test(u.pathname)) return;
  const put=res=>{ if(res&&res.ok&&Number(res.headers.get('content-length')||0)<3e6){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));} return res; };
  // rede primeiro (com cache offline como reserva): página, CSS, JS e dados — assim as atualizações chegam logo
  const isNav=r.mode==='navigate'||r.destination==='document'||/\/$/.test(u.pathname)||/\/index\.html$/.test(u.pathname);
  if(isNav||/\/(app\.css|app\.js)$/.test(u.pathname)||/\/data\/[^/]+\.json$/.test(u.pathname)){
    const net=fetch(r,{cache:'no-cache'}).then(res=>{ if(!res.ok) throw 0; return put(res); });
    const tm=new Promise((_,rej)=>setTimeout(rej,5000));
    e.respondWith(Promise.race([net,tm]).catch(()=>caches.match(r,{ignoreSearch:true}).then(hit=>hit||net.catch(()=>caches.match('index.html')))));
    return;
  }
  // demais (imagens, fontes, ícones): cache primeiro
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>{
    const net=fetch(r).then(put).catch(()=>hit||caches.match('index.html'));
    return hit||net;
  }));
});
