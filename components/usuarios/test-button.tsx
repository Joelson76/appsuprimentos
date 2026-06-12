'use client'

import { Button } from '@/components/ui/button'

export function TestButton({ texto, onClick }: { texto: string; onClick: () => void }) {
  return (
    <Button onClick={onClick}>
      {texto}
    </Button>
  )
}
