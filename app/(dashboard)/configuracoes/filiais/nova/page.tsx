'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Building2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NovaFilialPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [cnpjValido, setCnpjValido] = useState(true)

  const [formData, setFormData] = useState({
    cnpj: '',
    nome: '',
    nome_fantasia: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  })

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length <= 14) {
      // Formatar CNPJ
      if (value.length > 12) {
        value = value.replace(
          /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
          '$1.$2.$3/$4-$5'
        )
      } else if (value.length > 8) {
        value = value.replace(/^(\d{2})(\d{3})(\d{3})/, '$1.$2.$3/')
      } else if (value.length > 5) {
        value = value.replace(/^(\d{2})(\d{3})/, '$1.$2.')
      }
      setFormData({ ...formData, cnpj: value })
      setCnpjValido(value.replace(/\D/g, '').length === 14 || value === '')
    }
  }

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length <= 8) {
      // Formatar CEP
      if (value.length > 5) {
        value = value.replace(/^(\d{5})(\d)/, '$1-$2')
      }
      setFormData({ ...formData, cep: value })

      // Buscar endereço se CEP completo
      if (value.replace(/\D/g, '').length === 8) {
        try {
          const response = await fetch(
            `https://viacep.com.br/ws/${value.replace(/\D/g, '')}/json/`
          )
          const data = await response.json()

          if (!data.erro) {
            setFormData((prev) => ({
              ...prev,
              logradouro: data.logradouro || '',
              bairro: data.bairro || '',
              cidade: data.localidade || '',
              estado: data.uf || '',
            }))
          }
        } catch (error) {
          console.error('Erro ao buscar CEP:', error)
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar CNPJ
      const cnpjDigits = formData.cnpj.replace(/\D/g, '')
      if (cnpjDigits.length !== 14) {
        toast.error('CNPJ deve ter 14 dígitos')
        return
      }

      // Obter tenant_id do usuário
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Perfil não encontrado')

      // Inserir filial
      const { error } = await supabase.from('filiais').insert({
        tenant_id: profile.tenant_id,
        cnpj: cnpjDigits,
        nome: formData.nome,
        nome_fantasia: formData.nome_fantasia || null,
        cep: formData.cep.replace(/\D/g, '') || null,
        logradouro: formData.logradouro || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        is_matriz: false,
        ativa: true,
      })

      if (error) throw error

      toast.success('Filial cadastrada com sucesso!')
      router.push('/configuracoes/filiais')
    } catch (error: any) {
      console.error('Erro ao cadastrar filial:', error)
      if (error.message?.includes('duplicate key')) {
        toast.error('CNPJ já cadastrado')
      } else {
        toast.error('Erro ao cadastrar filial: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/configuracoes/filiais">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Filial</h1>
          <p className="text-muted-foreground">
            Cadastre uma nova filial com CNPJ próprio
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados da Filial
            </CardTitle>
            <CardDescription>
              Preencha as informações da filial
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="cnpj">
                CNPJ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={handleCNPJChange}
                placeholder="00.000.000/0000-00"
                required
                className={!cnpjValido ? 'border-red-500' : ''}
              />
              {!cnpjValido && (
                <p className="text-xs text-red-500">CNPJ deve ter 14 dígitos</p>
              )}
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">
                Razão Social <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Nome completo da empresa"
                required
              />
            </div>

            {/* Nome Fantasia */}
            <div className="space-y-2">
              <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
              <Input
                id="nome_fantasia"
                value={formData.nome_fantasia}
                onChange={(e) =>
                  setFormData({ ...formData, nome_fantasia: e.target.value })
                }
                placeholder="Nome comercial (opcional)"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Endereço</h3>

              <div className="grid gap-4">
                {/* CEP */}
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={handleCEPChange}
                    placeholder="00000-000"
                  />
                </div>

                {/* Logradouro e Número */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input
                      id="logradouro"
                      value={formData.logradouro}
                      onChange={(e) =>
                        setFormData({ ...formData, logradouro: e.target.value })
                      }
                      placeholder="Rua, Avenida..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) =>
                        setFormData({ ...formData, numero: e.target.value })
                      }
                      placeholder="123"
                    />
                  </div>
                </div>

                {/* Complemento e Bairro */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.complemento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          complemento: e.target.value,
                        })
                      }
                      placeholder="Sala, Bloco..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) =>
                        setFormData({ ...formData, bairro: e.target.value })
                      }
                      placeholder="Centro, Jardim..."
                    />
                  </div>
                </div>

                {/* Cidade e Estado */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) =>
                        setFormData({ ...formData, cidade: e.target.value })
                      }
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">UF</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) =>
                        setFormData({ ...formData, estado: e.target.value })
                      }
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !cnpjValido}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Cadastrar Filial
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
