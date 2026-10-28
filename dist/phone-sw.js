const CACHE='shift-icu-phone-0.6.0';
const SHELL=['./','index.html','app.js','pocket-engine.js','pocket-game.js','pocket-touch.js','pocket-world.js','pocket-game.css','app.webmanifest','icon.svg','icons/pocket-192.png','icons/pocket-512.png','style.css','quick-shift.css','quick-shift.js','quick-engine.js','controller-input.js','shift-floor.css','shift-arcade.css','shift-floor.js','shift-engine.js','shift-map.js','shift-data.js','shift-arcade.js','sources.js','cases.js','delta-cases.js','device.js','engine.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL.map(path=>new URL(path,self.registration.scope)))));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('shift-icu-phone-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url),scope=new URL(self.registration.scope);
  if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});}return response;}).catch(async()=>{const cached=await caches.match(event.request,{ignoreSearch:true});if(cached)return cached;if(event.request.mode==='navigate')return caches.match(new URL('index.html',self.registration.scope));return Response.error();}));
});
