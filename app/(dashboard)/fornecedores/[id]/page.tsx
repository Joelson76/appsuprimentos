import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Phone, Star, Building2 } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: {
    id: string
  }
}

export default async function FornecedorDetalhesPage({ params }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: fornecedor, error } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) {
    console.error('Erro ao buscar fornecedor:', error)
  }

  if (!fornecedor) {
    notFound()
  }

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    )
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      ATIVO: (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          ATIVO
        </Badge>
      ),
      INATIVO: (
        <Badge className="bg-slate-100 text-slate-800 border-slate-200">
          INATIVO
        </Badge>
      ),
      BLOQUEADO: (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          BLOQUEADO
        </Badge>
      ),
      EM_HOMOLOGACAO: (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          EM HOMOLOGAÇÃO
        </Badge>
      ),
    }
    return (
      badges[status] || (
        <Badge className="bg-slate-100 text-slate-800 border-slate-200">
          {status.replace(/_/g, ' ')}
        </Badge>
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/fornecedores">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{fornecedor.razao_social}</h1>
            <p className="text-muted-foreground mt-1">
              {fornecedor.nome_fantasia || 'Detalhes do fornecedor'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(fornecedor.status)}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Razão Social:
              </span>
              <span className="text-sm font-medium">
                {fornecedor.razao_social}
              </span>
            </div>
            {fornecedor.nome_fantasia && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Nome Fantasia:
                </span>
                <span className="text-sm font-medium">
                  {fornecedor.nome_fantasia}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">CNPJ:</span>
              <span className="text-sm font-medium font-mono">
                {formatCNPJ(fornecedor.cnpj)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              {getStatusBadge(fornecedor.status)}
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fornecedor.email ? (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${fornecedor.email}`}
                  className="text-sm text-primary hover:underline"
                >
                  {fornecedor.email}
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  E-mail não cadastrado
                </span>
              </div>
            )}

            {fornecedor.telefone ? (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${fornecedor.telefone}`}
                  className="text-sm text-primary hover:underline"
                >
                  {fornecedor.telefone}
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Telefone não cadastrado
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Categorias e Score */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Categorias de Produtos</CardTitle>
            <CardDescription>
              Produtos e serviços oferecidos por este fornecedor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fornecedor.categorias && fornecedor.categorias.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {fornecedor.categorias.map((cat: string) => (
                  <Badge key={cat} variant="outline">
                    {cat}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma categoria cadastrada
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avaliação</CardTitle>
            <CardDescription>
              Score e desempenho do fornecedor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                <span className="text-3xl font-bold">
                  {fornecedor.score || 0}
                </span>
                <span className="text-muted-foreground">/10</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {fornecedor.prazo_medio_pagamento
                ? `Prazo médio de pagamento: ${fornecedor.prazo_medio_pagamento} dias`
                : 'Prazo médio de pagamento não informado'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Cotações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>
            Cotações e pedidos realizados com este fornecedor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Nenhuma cotação realizada ainda
            </p>
            <Link href="/cotacoes/nova">
              <Button className="mt-4" variant="outline" size="sm">
                Criar Cotação
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
