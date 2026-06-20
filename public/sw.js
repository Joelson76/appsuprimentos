// Service Worker - SupriFlow PWA
const CACHE_NAME = 'supriflow-v1'
const RUNTIME_CACHE = 'supriflow-runtime'

// Arquivos essenciais para cache
const STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/offline',
  '/manifest.json',
]

// Instalação - cachear arquivos estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...')

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto, adicionando arquivos estáticos')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Ativação - limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...')

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[SW] Removendo cache antigo:', name)
              return caches.delete(name)
            })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch - estratégia Network First com fallback para Cache
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requisições não-HTTP
  if (!url.protocol.startsWith('http')) return

  // Ignorar requisições do Supabase (sempre buscar da rede)
  if (url.hostname.includes('supabase')) {
    return
  }

  // Estratégia: Network First, fallback Cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Se sucesso, cachear e retornar
        if (response && response.status === 200) {
          const responseClone = response.clone()

          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
        }

        return response
      })
      .catch(() => {
        // Se falhar (offline), buscar do cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }

            // Se não tiver no cache e for navegação, mostrar página offline
            if (request.mode === 'navigate') {
              return caches.match('/offline')
            }

            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            })
          })
      })
  )
})

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Background Sync - sincronizar dados quando voltar online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  console.log('[SW] Sincronizando dados em background...')
  // Aqui você pode implementar lógica de sincronização
}

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}

  const options = {
    body: data.body || 'Nova notificação do SupriFlow',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'SupriFlow', options)
  )
})

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data || '/'

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Se já tiver uma janela aberta, focar nela
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus()
            }
          }

          // Se não, abrir nova janela
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen)
          }
        })
    )
  }
})

console.log('[SW] Service Worker carregado')
