import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
            <WifiOff className="h-10 w-10 text-slate-600" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Você está offline
          </h1>

          <p className="text-slate-600 mb-8">
            Parece que você perdeu a conexão com a internet. Algumas
            funcionalidades podem estar limitadas.
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
              size="lg"
            >
              Tentar Novamente
            </Button>

            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              💡 <strong>Dica:</strong> Algumas páginas que você visitou
              recentemente ainda podem estar disponíveis offline.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
