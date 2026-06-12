'use client'

import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'

export function SimpleEditButton({ nome }: { nome: string }) {
  const handleClick = () => {
    console.log('CLICOU! Nome:', nome)
    alert(`Editar: ${nome}`)
  }

  console.log('SimpleEditButton renderizado para:', nome)

  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={handleClick}
    >
      <Edit className="h-4 w-4 mr-1" />
      Editar
    </Button>
  )
}
