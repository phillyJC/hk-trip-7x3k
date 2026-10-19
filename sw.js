const V = "hk26-v2";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
// 有網路就拿最新的（略過瀏覽器快取），4 秒內沒回應或沒網路才用離線備份
self.addEventListener("fetch", e => {
  const r = e.request; if(r.method !== "GET") return;
  const u = new URL(r.url); if(u.origin !== location.origin) return;   // 天氣、停車等外部請求不經過這裡
  e.respondWith((async () => {
    try{
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 4000);
      const res = await fetch(r, {cache:"no-cache", signal:ctl.signal}); clearTimeout(t);
      if(res && res.ok){ const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
      return res;
    }catch(err){
      const hit = await caches.match(r, {ignoreSearch:true});
      return hit || (await caches.match("index.html")) || new Response("離線中，且沒有備份。", {status:503});
    }
  })());
});
