'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Registrado com sucesso:', registration.scope)

          // Verificar atualizações a cada hora
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000)

          // Listener para nova versão disponível
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // Nova versão disponível
                  toast('Nova versão disponível!', {
                    description: 'Recarregue a página para atualizar',
                    action: {
                      label: 'Recarregar',
                      onClick: () => window.location.reload(),
                    },
                    duration: Infinity,
                  })
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[SW] Erro ao registrar:', error)
        })

      // Listener para quando o service worker assumir o controle
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Nova versão ativa')
      })
    }
  }, [])

  return null
}
