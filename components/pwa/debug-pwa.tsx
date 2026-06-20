'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export function DebugPWA() {
  const resetBanner = () => {
    localStorage.removeItem('pwa-banner-dismissed')
    localStorage.removeItem('pwa-install-dismissed')
    toast.success('Banner resetado! Recarregue a página.')
    console.log('[PWA Debug] LocalStorage limpo')
  }

  const checkServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      console.log('[PWA Debug] Service Worker:', registration)
      toast.info(registration ? 'Service Worker ativo' : 'Service Worker não registrado')
    } else {
      toast.error('Service Worker não suportado neste navegador')
    }
  }

  const checkManifest = async () => {
    try {
      const response = await fetch('/manifest.json')
      const manifest = await response.json()
      console.log('[PWA Debug] Manifest:', manifest)
      toast.success('Manifest carregado! Veja o console.')
    } catch (error) {
      console.error('[PWA Debug] Erro ao carregar manifest:', error)
      toast.error('Erro ao carregar manifest')
    }
  }

  // Apenas mostrar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-[101] bg-black text-white p-3 rounded-lg shadow-xl text-xs space-y-2">
      <p className="font-bold">🛠️ PWA Debug</p>

      <Button
        size="sm"
        variant="secondary"
        className="w-full text-xs"
        onClick={resetBanner}
      >
        <RefreshCw className="mr-1 h-3 w-3" />
        Resetar Banner
      </Button>

      <Button
        size="sm"
        variant="secondary"
        className="w-full text-xs"
        onClick={checkServiceWorker}
      >
        Check SW
      </Button>

      <Button
        size="sm"
        variant="secondary"
        className="w-full text-xs"
        onClick={checkManifest}
      >
        Check Manifest
      </Button>
    </div>
  )
}
