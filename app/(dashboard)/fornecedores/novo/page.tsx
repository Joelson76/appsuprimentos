'use client'

import { useState } from 'react'
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
import { ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { cnpj as cnpjValidator } from 'cpf-cnpj-validator'

export default function NovoFornecedorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingCNPJ, setLoadingCNPJ] = useState(false)
  const [error, setError] = useState('')

  const [cnpj, setCnpj] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [categorias, setCategorias] = useState('')
  const [status, setStatus] = useState<string>('EM_HOMOLOGACAO')

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  const buscarCNPJ = async () => {
    if (!cnpj) {
      setError('Digite um CNPJ')
      return
    }

    const cnpjLimpo = cnpj.replace(/\D/g, '')

    if (!cnpjValidator.isValid(cnpjLimpo)) {
      setError('CNPJ inválido')
      return
    }

    setLoadingCNPJ(true)
    setError('')

    try {
      const response = await fetch(
        `https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`
      )

      if (!response.ok) {
        throw new Error('Erro ao buscar CNPJ')
      }

      const data = await response.json()

      if (data.status === 'ERROR') {
        setError(data.message || 'CNPJ não encontrado')
        return
      }

      setRazaoSocial(data.nome || '')
      setNomeFantasia(data.fantasia || '')
      setEmail(data.email || '')
      setTelefone(data.telefone || '')
    } catch (err) {
      setError('Erro ao consultar CNPJ na Receita Federal')
    } finally {
      setLoadingCNPJ(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Usuário não autenticado')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        setError('Profile não encontrado')
        return
      }

      const cnpjLimpo = cnpj.replace(/\D/g, '')

      if (!cnpjValidator.isValid(cnpjLimpo)) {
        setError('CNPJ inválido')
        return
      }

      // Verificar se CNPJ já existe
      const { data: existente } = await supabase
        .from('fornecedores')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('cnpj', cnpjLimpo)
        .single()

      if (existente) {
        setError('CNPJ já cadastrado')
        return
      }

      const categoriasArray = categorias
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c)

      const { error: insertError } = await supabase.from('fornecedores').insert({
        tenant_id: profile.tenant_id,
        cnpj: cnpjLimpo,
        razao_social: razaoSocial.trim(),
        nome_fantasia: nomeFantasia.trim() || null,
        email: email.trim() || null,
        telefone: telefone.trim() || null,
        categorias: categoriasArray.length > 0 ? categoriasArray : null,
        status,
      })

      if (insertError) {
        throw insertError
      }

      router.push('/fornecedores')
      router.refresh()
    } catch (err: any) {
      console.error('Erro ao criar fornecedor:', err)
      setError(err.message || 'Erro ao criar fornecedor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/fornecedores">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Novo Fornecedor</h1>
          <p className="text-muted-foreground mt-1">
            Cadastre um novo fornecedor
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
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>
                Busque automaticamente pela Receita Federal ou preencha
                manualmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                    maxLength={18}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={buscarCNPJ}
                    disabled={loadingCNPJ}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {loadingCNPJ ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="razaoSocial">Razão Social *</Label>
                <Input
                  id="razaoSocial"
                  placeholder="Ex: EMPRESA LTDA"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                <Input
                  id="nomeFantasia"
                  placeholder="Ex: Minha Empresa"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 0000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categorias">
                  Categorias (separadas por vírgula)
                </Label>
                <Input
                  id="categorias"
                  placeholder="Ex: Materiais Elétricos, Ferramentas"
                  value={categorias}
                  onChange={(e) => setCategorias(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Digite as categorias de produtos que este fornecedor oferece
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status Inicial</Label>
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
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/fornecedores">
              <Button type="button" variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar Fornecedor'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
