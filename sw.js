/* FACT TOK: purani cache saaf karne wala service worker.
   Isay GitHub par purani sw.js ki jagah upload karo. Ye khud cache mita kar band ho jata hai,
   is ke baad hamesha taaza (naya) version hi khulega. */
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){
  e.waitUntil((async function(){
    try{var k=await caches.keys();await Promise.all(k.map(function(x){return caches.delete(x)}))}catch(_){}
    try{await self.registration.unregister()}catch(_){}
    try{var c=await self.clients.matchAll({type:'window'});c.forEach(function(w){try{w.navigate(w.url)}catch(_){}})}catch(_){}
  })());
});
self.addEventListener('fetch',function(){/* kuch cache nahi karta, seedha network */});
