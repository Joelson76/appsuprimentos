'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface LimiteStatus {
  dentro_limite: boolean
  usado: number
  limite: number
  percentual: number
  mensagem?: string
}

interface UseVerificarLimiteReturn {
  verificando: boolean
  verificarLimite: (tipo: 'pedidos' | 'usuarios' | 'fornecedores') => Promise<LimiteStatus>
  verificarAntesDeCriar: (
    tipo: 'pedidos' | 'usuarios' | 'fornecedores',
    callback: () => void
  ) => Promise<void>
}

export function useVerificarLimite(): UseVerificarLimiteReturn {
  const [verificando, setVerificando] = useState(false)

  const verificarLimite = async (
    tipo: 'pedidos' | 'usuarios' | 'fornecedores'
  ): Promise<LimiteStatus> => {
    const response = await fetch(`/api/limites/verificar?tipo=${tipo}`)
    const data = await response.json()
    return data
  }

  const verificarAntesDeCriar = async (
    tipo: 'pedidos' | 'usuarios' | 'fornecedores',
    callback: () => void
  ) => {
    setVerificando(true)
    try {
      const status = await verificarLimite(tipo)

      if (!status.dentro_limite) {
        // Dispara evento customizado para abrir modal
        window.dispatchEvent(
          new CustomEvent('limite-atingido', {
            detail: { tipo, status },
          })
        )
        return
      }

      // Se está dentro do limite, executa o callback
      callback()
    } catch (error) {
      toast.error('Erro ao verificar limite')
      console.error(error)
    } finally {
      setVerificando(false)
    }
  }

  return {
    verificando,
    verificarLimite,
    verificarAntesDeCriar,
  }
}
