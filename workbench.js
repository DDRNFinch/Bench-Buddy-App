
"use strict";
const CACHE_NAME="bench-buddy-v3-0-2";
const APP_FILES=[
  "./",
  "./index.html",
  "./workbench-data.js",
  "./workbench-images.js",
  "./workbench.js",
  "./app.js",
  "./assignment-pdf.js",
  "./register-service-worker.js",
  "./manifest.json",
  "./workbench-images/jack-plane.webp",
  "./workbench-images/mortice-and-tenon.webp",
  "./workbench-images/mortice-chisel.webp",
  "./workbench-images/tenon-saw.webp",
  "./workbench-images/try-square.webp",
  "./icon-192.png",
  "./icon-512.png"
];

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

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  event.respondWith(
    caches.match(event.request)
      .then(cached=>cached||fetch(event.request).then(response=>{
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
        return response;
      }).catch(()=>caches.match("./index.html")))
  );
});
