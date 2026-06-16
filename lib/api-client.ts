/**
 * Cliente HTTP com interceptação de erros de limite
 * Substitui fetch() padrão para automaticamente mostrar modal quando limite é atingido
 */

interface ErrorLimite {
  error: 'LIMITE_ATINGIDO'
  tipo: 'pedidos' | 'usuarios' | 'fornecedores'
  mensagem: string
  descricao: string
  detalhes: {
    usado: number
    limite: number
    percentual: number
  }
  action_required: 'upgrade'
  upgrade_url: string
  sugestao_plano: string
}

export class ApiClient {
  static async post(url: string, data: any) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (response.status === 403) {
      const errorData: ErrorLimite = await response.json()

      if (errorData.error === 'LIMITE_ATINGIDO') {
        // Dispara evento para abrir modal
        window.dispatchEvent(
          new CustomEvent('limite-atingido', {
            detail: {
              tipo: errorData.tipo,
              status: {
                usado: errorData.detalhes.usado,
                limite: errorData.detalhes.limite,
              },
            },
          })
        )

        throw new Error(errorData.mensagem)
      }
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao processar requisição')
    }

    return response.json()
  }

  static async get(url: string) {
    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao processar requisição')
    }

    return response.json()
  }
}

/**
 * EXEMPLO DE USO:
 *
 * // Antes (sem interceptação):
 * const response = await fetch('/api/pedidos/criar', {
 *   method: 'POST',
 *   body: JSON.stringify(pedido)
 * })
 *
 * // Depois (com interceptação automática):
 * try {
 *   const pedido = await ApiClient.post('/api/pedidos/criar', pedidoData)
 *   toast.success('Pedido criado!')
 * } catch (error) {
 *   // Se for erro de limite, modal já foi aberto automaticamente
 *   // Aqui só trata outros erros
 *   toast.error(error.message)
 * }
 */
