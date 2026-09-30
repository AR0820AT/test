/**
 * 极简 Service Worker：缓存应用外壳，实现离线打开与「添加到主屏幕」
 * 只做 GET 请求，数据本身存在 localStorage / IndexedDB，不受影响
 */
const CACHE = 'card-chat-v6'
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './fonts/fonts.css',
  './fonts/cormorant-garamond-500.woff2',
  './fonts/pirata-one-400.woff2',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => undefined),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // 字体请求直接放行：iOS Safari 经 Service Worker 拿字体有时拿不到，交给浏览器自己处理
  if (request.destination === 'font') return

  // 页面导航：优先网络，断网时回落到已缓存的外壳
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy))
          return response
        })
        .catch(() => caches.match('./index.html').then((hit) => hit || caches.match('./'))),
    )
    return
  }

  // 静态资源：网络优先（保证改版后立刻生效），断网或失败时回落缓存
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html'))),
  )
})
