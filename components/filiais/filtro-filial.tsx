'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2 } from 'lucide-react'

interface Filial {
  id: string
  nome: string
  cnpj: string
  is_matriz: boolean
}

export function FiltroFilial() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [filiais, setFiliais] = useState<Filial[]>([])
  const [loading, setLoading] = useState(true)
  const filialAtual = searchParams.get('filial') || 'todas'

  useEffect(() => {
    loadFiliais()
  }, [])

  async function loadFiliais() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile) return

      const { data } = await supabase
        .from('filiais')
        .select('id, nome, cnpj, is_matriz')
        .eq('tenant_id', profile.tenant_id)
        .eq('ativa', true)
        .order('is_matriz', { ascending: false })
        .order('nome')

      setFiliais(data || [])
    } catch (error) {
      console.error('Erro ao carregar filiais:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())

    if (value === 'todas') {
      params.delete('filial')
    } else {
      params.set('filial', value)
    }

    router.push(`?${params.toString()}`)
  }

  if (loading || filiais.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={filialAtual} onValueChange={handleChange}>
        <SelectTrigger className="w-[250px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as Filiais</SelectItem>
          {filiais.map((filial) => (
            <SelectItem key={filial.id} value={filial.id}>
              {filial.nome} {filial.is_matriz && '(Matriz)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
