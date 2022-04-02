var CACHE_NAME = 'lazerpresent-cache-1'

var filesToCache = [
    "video/ants_horizontal_trim.mp4", 
    "video/bird_horizontal.mp4",
    "video/bubble 2_horizontal.mp4",
    "video/dog balloon_horizontal_crop.mp4",
    "video/early morning_horizontal_trim.mp4",
    "video/intercontinental_horizontal.mp4",
    "video/motorbike mirror sun_horizontal_trim.mp4",
    "video/newspaper berlin_horizontal_trim.mp4",
    "video/newspaper handrail_horizontal.mp4",
    "video/receipt_horizontal.mp4",
    "video/sun_horizontal_trim.mp4",
    "video/white waves_horizontal_trim.mp4"
]

self.addEventListener('install', e => {
    e.waitUntil(initCache())
    e.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName != CACHE_NAME
                }).map(function(cacheName) {
                    return caches.delete(cacheName)
                })
            )
        })
    )
})

function initCache() {
    return caches.open(CACHE_NAME).then(cache => {
        cache.addAll(filesToCache)
    })
}

self.addEventListener('activate', e => {
    self.clients.claim()
})

self.addEventListener('fetch', e => {
    var url = new URL(e.request.url)
    var urlDecoded = decodeURI(url.pathname)
    console.log("handling " + url.pathname + "(" + urlDecoded + ") in service worker")

    if (urlDecoded.startsWith("/lazerpresent/video/")) {
        e.respondWith(handleWebResourceRequest(e.request))
    } else {
        e.respondWith(fetch(e.request))
    }
})

async function handleWebResourceRequest(request) {
    // first try to get from cache
    console.log("trying to get " + request.url + " from cache")
    let cacheResponse = await caches.match(request)

    if (cacheResponse) {
        // always update resource in cache asynchronously
        //updateResourceInCache(request)
        console.log("found and returing " + request.url + " from cache")
        return cacheResponse
    } else {
        console.log("getting " + request.url + " from server")
        let serverResponse = await updateResourceInCache(request)
        return serverResponse
    }
}

async function updateResourceInCache(request) {
    // then try to get from server
    let serverResponse
    try {
        serverResponse = await fetch(request)
    } catch (error) {
        console.error(error)
        serverResponse = undefined
    }

    if (serverResponse) {
        let cache = await caches.open(CACHE_NAME)
        cache.put(request, serverResponse.clone())
        return serverResponse
    } else {
        let notFoundResponse = new Response()
        notFoundResponse.status = 404
        return notFoundResponse
    }
}