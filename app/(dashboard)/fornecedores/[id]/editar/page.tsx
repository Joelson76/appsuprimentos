'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface PageProps {
  params: {
    id: string
  }
}

export default function EditarFornecedorPage({ params }: PageProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')

  const [cnpj, setCnpj] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [categorias, setCategorias] = useState('')
  const [status, setStatus] = useState<string>('ATIVO')

  useEffect(() => {
    loadFornecedor()
  }, [params.id])

  async function loadFornecedor() {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      if (data) {
        setCnpj(formatCNPJ(data.cnpj))
        setRazaoSocial(data.razao_social || '')
        setNomeFantasia(data.nome_fantasia || '')
        setEmail(data.email || '')
        setTelefone(data.telefone || '')
        setCategorias(data.categorias?.join(', ') || '')
        setStatus(data.status || 'ATIVO')
      }
    } catch (err: any) {
      console.error('Erro ao carregar fornecedor:', err)
      toast.error('Erro ao carregar fornecedor')
    } finally {
      setLoadingData(false)
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const categoriasArray = categorias
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c)

      const { error: updateError } = await supabase
        .from('fornecedores')
        .update({
          razao_social: razaoSocial.trim(),
          nome_fantasia: nomeFantasia.trim() || null,
          email: email.trim() || null,
          telefone: telefone.trim() || null,
          categorias: categoriasArray.length > 0 ? categoriasArray : null,
          status,
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      toast.success('Fornecedor atualizado com sucesso!')
      router.push(`/fornecedores/${params.id}`)
      router.refresh()
    } catch (err: any) {
      console.error('Erro ao atualizar fornecedor:', err)
      setError(err.message || 'Erro ao atualizar fornecedor')
      toast.error('Erro ao atualizar fornecedor')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href={`/fornecedores/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Fornecedor</h1>
          <p className="text-muted-foreground mt-1">
            Atualize os dados do fornecedor
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Dados da Empresa */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>
                Informações básicas do fornecedor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* CNPJ (somente leitura) */}
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={cnpj}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-muted-foreground">
                  O CNPJ não pode ser alterado
                </p>
              </div>

              {/* Razão Social */}
              <div className="space-y-2">
                <Label htmlFor="razao_social">
                  Razão Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="razao_social"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Nome completo da empresa"
                  required
                />
              </div>

              {/* Nome Fantasia */}
              <div className="space-y-2">
                <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                <Input
                  id="nome_fantasia"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Nome comercial (opcional)"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EM_HOMOLOGACAO">
                      Em Homologação
                    </SelectItem>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                    <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com.br"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 98765-4321"
                />
              </div>
            </CardContent>
          </Card>

          {/* Categorias */}
          <Card>
            <CardHeader>
              <CardTitle>Categorias</CardTitle>
              <CardDescription>
                Produtos ou serviços fornecidos (separados por vírgula)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="categorias">Categorias</Label>
                <Input
                  id="categorias"
                  value={categorias}
                  onChange={(e) => setCategorias(e.target.value)}
                  placeholder="Ex: Material de Escritório, Limpeza, TI"
                />
                <p className="text-xs text-muted-foreground">
                  Separe as categorias por vírgula
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
