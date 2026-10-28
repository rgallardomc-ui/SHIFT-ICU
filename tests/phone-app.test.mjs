import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function worker({fetchResult,offline=false}={}){
  const events={},removed=[],saved=[],lookups=[],shell=[];let claimed=0;
  const caches={keys:async()=>['shift-icu-phone-old','entropy-game-v7','other-cache'],delete:async key=>{removed.push(key);},open:async()=>({addAll:async urls=>shell.push(...urls.map(String)),put:async(req,res)=>saved.push({req,res})}),match:async(request,options)=>{lookups.push({request,options});return 'cached-response';}};
  const self={registration:{scope:'https://example.test/SHIFT-ICU/'},clients:{claim:async()=>{claimed++;}},addEventListener:(name,callback)=>events[name]=callback};
  vm.runInNewContext(fs.readFileSync(new URL('../dist/phone-sw.js',import.meta.url),'utf8'),{self,caches,URL,Response,fetch:async()=>{if(offline)throw Error('offline');return fetchResult||{ok:true,clone:()=>({fresh:true})};}});
  return {events,removed,saved,lookups,shell,get claimed(){return claimed;}};
}
test('phone install manifest and offline shell reference real files within this game',async()=>{const manifest=JSON.parse(fs.readFileSync(new URL('../dist/app.webmanifest',import.meta.url),'utf8'));assert.equal(manifest.display,'standalone');assert.equal(manifest.orientation,'portrait');for(const icon of manifest.icons)assert.ok(fs.existsSync(new URL('../dist/'+icon.src,import.meta.url)));const w=worker();let job;w.events.install({waitUntil:p=>job=p});await job;assert.ok(w.shell.length>20);for(const url of w.shell){assert.ok(url.startsWith('https://example.test/SHIFT-ICU/'));const path=new URL(url).pathname.replace('/SHIFT-ICU/','')||'index.html';assert.ok(fs.existsSync(new URL('../dist/'+path,import.meta.url)),path);}});
test('phone cache cleanup never deletes another project’s cache',async()=>{const w=worker();let job;w.events.activate({waitUntil:p=>job=p});await job;assert.deepEqual(w.removed,['shift-icu-phone-old']);assert.equal(w.claimed,1);});
test('offline fallback is confined to this game scope and preserves search-variant assets',async()=>{const w=worker({offline:true});let response;w.events.fetch({request:{url:'https://example.test/Entropy-Game/index.html',method:'GET'},respondWith:p=>response=p});assert.equal(response,undefined);w.events.fetch({request:{url:'https://example.test/SHIFT-ICU/pocket-game.js?v=0.6.0',method:'GET',mode:'same-origin'},respondWith:p=>response=p});assert.equal(await response,'cached-response');assert.equal(w.lookups[0].options.ignoreSearch,true);});
