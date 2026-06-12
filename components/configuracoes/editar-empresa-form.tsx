'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  tenant: {
    id: string
    nome: string
    cnpj: string | null
    email: string | null
    telefone: string | null
    endereco: string | null
    cidade: string | null
    estado: string | null
    cep: string | null
  }
}

export function EditarEmpresaForm({ tenant }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    nome: tenant.nome || '',
    cnpj: tenant.cnpj || '',
    email: tenant.email || '',
    telefone: tenant.telefone || '',
    endereco: tenant.endereco || '',
    cidade: tenant.cidade || '',
    estado: tenant.estado || '',
    cep: tenant.cep || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome) {
      toast.error('Nome da empresa é obrigatório')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('tenants')
        .update({
          nome: formData.nome,
          email: formData.email || null,
          telefone: formData.telefone || null,
          endereco: formData.endereco || null,
          cidade: formData.cidade || null,
          estado: formData.estado || null,
          cep: formData.cep || null,
        })
        .eq('id', tenant.id)

      if (error) throw error

      toast.success('Dados da empresa atualizados!')
      router.refresh()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao atualizar dados da empresa')
    } finally {
      setLoading(false)
    }
  }

  const handleCepBlur = async () => {
    if (!formData.cep || formData.cep.replace(/\D/g, '').length !== 8) return

    try {
      const cep = formData.cep.replace(/\D/g, '')
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast.error('CEP não encontrado')
        return
      }

      setFormData({
        ...formData,
        endereco: data.logradouro || formData.endereco,
        cidade: data.localidade || formData.cidade,
        estado: data.uf || formData.estado,
      })

      toast.success('Endereço preenchido automaticamente!')
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 14) {
      return cleaned
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 8) {
      return cleaned.replace(/(\d{5})(\d)/, '$1-$2')
    }
    return value
  }

  const formatTelefone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
    }
    return value
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="nome">Nome da Empresa *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            disabled={loading}
            placeholder="Minha Empresa Ltda"
          />
        </div>

        <div>
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={(e) =>
              setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })
            }
            disabled
            placeholder="00.000.000/0000-00"
            className="bg-slate-50"
          />
          <p className="text-xs text-muted-foreground mt-1">
            O CNPJ não pode ser alterado
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            disabled={loading}
            placeholder="contato@empresa.com"
          />
        </div>

        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            value={formData.telefone}
            onChange={(e) =>
              setFormData({
                ...formData,
                telefone: formatTelefone(e.target.value),
              })
            }
            disabled={loading}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            value={formData.cep}
            onChange={(e) =>
              setFormData({ ...formData, cep: formatCEP(e.target.value) })
            }
            onBlur={handleCepBlur}
            disabled={loading}
            placeholder="00000-000"
          />
        </div>

        <div>
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            value={formData.cidade}
            onChange={(e) =>
              setFormData({ ...formData, cidade: e.target.value })
            }
            disabled={loading}
            placeholder="São Paulo"
          />
        </div>

        <div>
          <Label htmlFor="estado">Estado</Label>
          <Input
            id="estado"
            value={formData.estado}
            onChange={(e) =>
              setFormData({ ...formData, estado: e.target.value })
            }
            disabled={loading}
            placeholder="SP"
            maxLength={2}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="endereco">Endereço Completo</Label>
        <Textarea
          id="endereco"
          value={formData.endereco}
          onChange={(e) =>
            setFormData({ ...formData, endereco: e.target.value })
          }
          disabled={loading}
          placeholder="Rua, número, complemento, bairro"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>
    </form>
  )
}
