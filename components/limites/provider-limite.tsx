'use client'

import { useEffect, useState } from 'react'
import { ModalLimiteAtingido } from './modal-limite-atingido'

interface LimiteEvent {
  tipo: 'pedidos' | 'usuarios' | 'fornecedores'
  status: {
    usado: number
    limite: number
  }
}

export function ProviderLimite({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [limiteInfo, setLimiteInfo] = useState<LimiteEvent | null>(null)

  useEffect(() => {
    const handleLimiteAtingido = (event: CustomEvent<LimiteEvent>) => {
      setLimiteInfo(event.detail)
      setModalOpen(true)
    }

    window.addEventListener('limite-atingido', handleLimiteAtingido as EventListener)

    return () => {
      window.removeEventListener('limite-atingido', handleLimiteAtingido as EventListener)
    }
  }, [])

  return (
    <>
      {children}
      {limiteInfo && (
        <ModalLimiteAtingido
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          tipo={limiteInfo.tipo}
          usado={limiteInfo.status.usado}
          limite={limiteInfo.status.limite}
        />
      )}
    </>
  )
}
