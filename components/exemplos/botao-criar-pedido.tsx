'use client'

import { Button } from '@/components/ui/button'
import { useVerificarLimite } from '@/hooks/use-verificar-limite'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * EXEMPLO DE USO do sistema de validação de limites
 *
 * Este componente demonstra como usar o hook useVerificarLimite
 * para verificar limites ANTES de permitir criação de recursos.
 */
export function BotaoCriarPedido() {
  const router = useRouter()
  const { verificando, verificarAntesDeCriar } = useVerificarLimite()

  const handleCriarPedido = async () => {
    // ✅ VERIFICAÇÃO PRÉVIA - Mostra modal se limite atingido
    await verificarAntesDeCriar('pedidos', () => {
      // Este callback só executa se estiver dentro do limite
      router.push('/pedidos/novo')
    })
  }

  return (
    <Button onClick={handleCriarPedido} disabled={verificando}>
      <Plus className="mr-2 h-4 w-4" />
      {verificando ? 'Verificando...' : 'Novo Pedido'}
    </Button>
  )
}

/**
 * COMO FUNCIONA:
 *
 * 1. Usuário clica no botão "Novo Pedido"
 * 2. Hook chama API /api/limites/verificar?tipo=pedidos
 * 3. Se dentro do limite → executa callback (navega para /pedidos/novo)
 * 4. Se limite atingido → dispara evento 'limite-atingido'
 * 5. ProviderLimite captura evento e abre ModalLimiteAtingido
 * 6. Modal mostra uso atual, plano sugerido e botão de upgrade
 *
 * BENEFÍCIOS vs retorno 403:
 * - Validação ANTES de tentar criar (melhor UX)
 * - Modal visual bonito em vez de erro genérico
 * - Mostra exatamente quanto foi usado
 * - Sugere plano adequado com preços
 * - Botão direto para upgrade
 * - Não quebra o fluxo com erro HTTP
 */
