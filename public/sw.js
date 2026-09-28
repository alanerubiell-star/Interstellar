/* Service worker mínimo: cachea el App Shell para que Noa abra sin conexión. */
const CACHE = 'noa-notes-v1'
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return

  // Navegaciones: red primero, caché como respaldo sin conexión.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html').then((r) => r ?? Response.error())))
    return
  }

  // Estáticos: caché primero, y se refresca en segundo plano.
  e.respondWith(
    caches.match(req).then((hit) => {
      const red = fetch(req)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()))
          return res
        })
        .catch(() => hit ?? Response.error())
      return hit ?? red
    }),
  )
})
