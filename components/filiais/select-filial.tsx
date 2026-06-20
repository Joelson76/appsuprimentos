'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Building2 } from 'lucide-react'

interface Filial {
  id: string
  nome: string
  cnpj: string
  is_matriz: boolean
  ativa: boolean
}

interface SelectFilialProps {
  value?: string
  onChange: (filialId: string) => void
  required?: boolean
  label?: string
  incluirInativos?: boolean
}

export function SelectFilial({
  value,
  onChange,
  required = false,
  label = 'Filial',
  incluirInativos = false,
}: SelectFilialProps) {
  const supabase = createClient()
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFiliais() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id, filial_id')
          .eq('id', user.id)
          .single()

        if (!profile) return

        let query = supabase
          .from('filiais')
          .select('id, nome, cnpj, is_matriz, ativa')
          .eq('tenant_id', profile.tenant_id)
          .order('is_matriz', { ascending: false })
          .order('nome')

        if (!incluirInativos) {
          query = query.eq('ativa', true)
        }

        const { data } = await query

        setFiliais(data || [])

        // Auto-selecionar filial do usuário se não houver valor
        if (!value && profile.filial_id) {
          onChange(profile.filial_id)
        }
      } catch (error) {
        console.error('Erro ao carregar filiais:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFiliais()
  }, [supabase, incluirInativos])

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange} required={required}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a filial">
            {value && filiais.find((f) => f.id === value) && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>
                  {filiais.find((f) => f.id === value)?.nome}
                  {filiais.find((f) => f.id === value)?.is_matriz && ' (Matriz)'}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="loading" disabled>
              Carregando...
            </SelectItem>
          ) : filiais.length === 0 ? (
            <SelectItem value="empty" disabled>
              Nenhuma filial cadastrada
            </SelectItem>
          ) : (
            filiais.map((filial) => (
              <SelectItem key={filial.id} value={filial.id}>
                <div className="flex items-center justify-between w-full">
                  <span>
                    {filial.nome}
                    {filial.is_matriz && ' (Matriz)'}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono ml-2">
                    {formatCNPJ(filial.cnpj)}
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

function formatCNPJ(cnpj: string): string {
  if (!cnpj) return ''
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return cnpj
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  )
}
