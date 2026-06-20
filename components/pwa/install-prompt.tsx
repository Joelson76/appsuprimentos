'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Smartphone } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detectar iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream

    setIsIOS(isIOSDevice)

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Verificar se já foi dispensado
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        return
      }
    }

    // Listener para evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Se for iOS, mostrar instruções após alguns segundos
    if (isIOSDevice) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
      return () => clearTimeout(timer)
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
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 md:left-auto md:right-4 md:bottom-4 z-40 max-w-sm animate-in slide-in-from-bottom-4">
      <Card className="border-2 border-primary shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Instalar SupriFlow</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-2"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Instale o app no seu dispositivo para acesso rápido
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {isIOS ? (
            // Instruções para iOS
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Para instalar no iPhone/iPad:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Toque no ícone de compartilhar (↑)</li>
                <li>Role para baixo</li>
                <li>Selecione "Adicionar à Tela de Início"</li>
                <li>Toque em "Adicionar"</li>
              </ol>
            </div>
          ) : (
            // Botão de instalação para Android/Desktop
            <Button
              onClick={handleInstallClick}
              className="w-full"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Instalar Agora
            </Button>
          )}

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              ✓ Acesso offline
            </span>
            <span className="flex items-center gap-1">
              ✓ Notificações
            </span>
            <span className="flex items-center gap-1">
              ✓ Mais rápido
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
