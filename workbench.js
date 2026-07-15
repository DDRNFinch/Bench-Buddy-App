
"use strict";
const CACHE_NAME="bench-buddy-v3-0-2-force";
const APP_FILES=[
  "./",
  "./index.html",
  "./app.js?v=302",
  "./assignment-pdf.js?v=302",
  "./workbench-data.js?v=302",
  "./workbench.js?v=302",
  "./register-service-worker.js?v=302",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./workbench-images/tenon-saw.png"
];

self.addEventListener("message",event=>{
  if(event.data?.type==="SKIP_WAITING")self.skipWaiting();
});

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(APP_FILES))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

async function networkFirst(request){
  try{
    const response=await fetch(request,{cache:"no-store"});
    const cache=await caches.open(CACHE_NAME);
    cache.put(request,response.clone());
    return response;
  }catch(error){
    return (await caches.match(request)) || (await caches.match("./index.html"));
  }
}

async function cacheFirst(request){
  const cached=await caches.match(request);
  if(cached)return cached;
  const response=await fetch(request);
  const cache=await caches.open(CACHE_NAME);
  cache.put(request,response.clone());
  return response;
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  const isNavigation=event.request.mode==="navigate";
  const isAppCode=url.origin===self.location.origin && /\.(?:html|js|json)$/.test(url.pathname);
  const isImage=/\.(?:png|jpg|jpeg|webp|gif|svg)$/.test(url.pathname);
  if(isNavigation||isAppCode)event.respondWith(networkFirst(event.request));
  else if(isImage)event.respondWith(cacheFirst(event.request));
});
