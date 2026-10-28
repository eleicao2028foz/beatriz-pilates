const V='studio-bia-v11';
const SHELL=['./','index.html','app.css','app.js','manifest.webmanifest','fonts/cormorant.woff2','fonts/cormorant-italic.woff2','fonts/jost.woff2','img/cabecalho-logo.webp','img/dor-costas.webp','img/dor-pescoco.webp','img/dor-ombro.webp','img/dor-joelho.webp','data/videos.json','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; const u=new URL(r.url); if(r.method!=='GET'||u.origin!==location.origin) return;
  // Instagram/YouTube/Vimeo são de outra origem e nem entram aqui (retorno acima). Vídeos e áudios grandes: nunca passam pelo cache (rede direta, com suporte a Range)
  if(r.headers.has('range')||r.destination==='video'||r.destination==='audio'||/\.(mp4|m4v|mov|webm|m3u8|ts|mp3|m4a)$/i.test(u.pathname)||/\/videos\//.test(u.pathname)) return;
  const put=res=>{ if(res&&res.ok&&Number(res.headers.get('content-length')||0)<3e6){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));} return res; };
  // lista de vídeos: rede primeiro (para refletir links novos), cache se estiver offline
  if(/\/data\/videos\.json$/.test(u.pathname)){
    e.respondWith(fetch(r).then(put).catch(()=>caches.match(r,{ignoreSearch:true})));
    return;
  }
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>{
    const net=fetch(r).then(put).catch(()=>hit||caches.match('index.html'));
    return hit||net;
  }));
});
