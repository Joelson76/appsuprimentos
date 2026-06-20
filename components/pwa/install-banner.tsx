'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detectar iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream

    setIsIOS(isIOSDevice)

    console.log('[PWA Banner] Inicializando...', { isIOSDevice })

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('[PWA Banner] App já instalado, não mostrar banner')
      return
    }

    // Verificar se já foi dispensado
    const dismissed = localStorage.getItem('pwa-banner-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      console.log('[PWA Banner] Banner foi dispensado', { daysSinceDismissed })
      if (daysSinceDismissed < 30) {
        console.log('[PWA Banner] Ainda dentro do período de 30 dias, não mostrar')
        return
      }
    }

    console.log('[PWA Banner] Condições OK, aguardando evento...')

    // Listener para evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA Banner] Evento beforeinstallprompt recebido!')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Se for iOS, mostrar banner após alguns segundos
    if (isIOSDevice) {
      console.log('[PWA Banner] iOS detectado, mostrar banner em 5s')
      const timer = setTimeout(() => {
        console.log('[PWA Banner] Mostrando banner para iOS')
        setShowBanner(true)
      }, 5000)
      return () => clearTimeout(timer)
    }

    // Para desktop/Android em dev, forçar mostrar depois de 3 segundos
    // (o evento beforeinstallprompt só dispara em produção com HTTPS)
    if (process.env.NODE_ENV === 'development') {
      console.log('[PWA Banner] Modo DEV - forçar mostrar em 3s para teste')
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 3000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()

    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA instalado com sucesso')
    }

    setDeferredPrompt(null)
    setShowBanner(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString())
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <>
      {/* Backdrop - escurece o fundo levemente */}
      <div className="fixed inset-0 bg-black/5 z-[99] pointer-events-none" />

      {/* Banner */}
      <div className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top-4">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-2xl border-b-2 border-purple-400">
          <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Smartphone className="h-6 w-6 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">
                  Instale o SupriFlow no seu dispositivo
                </p>
                <p className="text-xs text-white/90 hidden sm:block">
                  {isIOS
                    ? 'Toque em ↑ e depois "Adicionar à Tela de Início"'
                    : 'Acesso rápido, notificações e modo offline'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {!isIOS && deferredPrompt && (
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  variant="secondary"
                  className="font-semibold"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Instalar
                </Button>
              )}

              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}
