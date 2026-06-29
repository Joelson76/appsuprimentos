'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  ShoppingCart,
  FileText,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    requisicoes: 0,
    cotacoes: 0,
    pedidos: 0,
    fornecedores: 0
  })

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Buscar profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome, perfil, tenant_id')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Buscar estatísticas se tiver tenant
      if (profileData?.tenant_id) {
        try {
          // Requisições ativas
          const { count: reqCount } = await supabase
            .from('requisicoes')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', profileData.tenant_id)

          // Cotações
          const { count: cotCount } = await supabase
            .from('cotacoes')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', profileData.tenant_id)

          // Pedidos
          const { count: pedCount } = await supabase
            .from('pedidos')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', profileData.tenant_id)

          // Fornecedores
          const { count: fornCount } = await supabase
            .from('fornecedores')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', profileData.tenant_id)

          setStats({
            requisicoes: reqCount || 0,
            cotacoes: cotCount || 0,
            pedidos: pedCount || 0,
            fornecedores: fornCount || 0
          })
        } catch (error) {
          console.error('Erro ao buscar stats:', error)
        }
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const nomeExibicao = profile?.nome || user?.email?.split('@')[0] || 'Usuário'

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-600 bg-clip-text text-transparent">
            Olá, {nomeExibicao}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo ao seu painel de controle do SupriFlow
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/requisicoes/novo">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <FileText className="h-4 w-4 mr-2" />
              Nova Requisição
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-600 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Requisições
            </CardTitle>
            <FileText className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{stats.requisicoes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.requisicoes === 0 ? 'Nenhuma requisição' : 'Total de requisições'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cotações
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.cotacoes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.cotacoes === 0 ? 'Nenhuma cotação' : 'Total de cotações'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos
            </CardTitle>
            <Package className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{stats.pedidos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pedidos === 0 ? 'Nenhum pedido' : 'Total de pedidos'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fornecedores
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.fornecedores}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.fornecedores === 0 ? 'Nenhum fornecedor' : 'Fornecedores cadastrados'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/requisicoes/novo">
              <Button variant="outline" className="w-full justify-start hover:bg-emerald-50 hover:border-emerald-600 hover:text-emerald-700">
                <FileText className="h-4 w-4 mr-2" />
                Criar Nova Requisição
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/cotacoes">
              <Button variant="outline" className="w-full justify-start hover:bg-emerald-50 hover:border-emerald-600 hover:text-emerald-700">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Ver Cotações
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/fornecedores">
              <Button variant="outline" className="w-full justify-start hover:bg-emerald-50 hover:border-emerald-600 hover:text-emerald-700">
                <Users className="h-4 w-4 mr-2" />
                Gerenciar Fornecedores
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/produtos">
              <Button variant="outline" className="w-full justify-start hover:bg-emerald-50 hover:border-emerald-600 hover:text-emerald-700">
                <Package className="h-4 w-4 mr-2" />
                Cadastrar Produtos
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Sistema Operacional</p>
                <p className="text-xs text-muted-foreground">Todos os serviços funcionando</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Autenticação Ativa</p>
                <p className="text-xs text-muted-foreground">Login: {user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Perfil: {profile?.perfil || 'Carregando...'}</p>
                <p className="text-xs text-muted-foreground">Acesso completo ao sistema</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800 font-medium">
                🎉 Sistema estável e 100% operacional!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informative Card */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
        <CardHeader>
          <CardTitle className="text-emerald-900">
            Bem-vindo ao SupriFlow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-emerald-800">
            Seu sistema de gestão de compras e suprimentos está pronto para uso!
          </p>
          <div className="grid gap-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
              <span><strong>Requisições:</strong> Crie e gerencie solicitações de compra</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
              <span><strong>Cotações:</strong> Compare preços de múltiplos fornecedores</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
              <span><strong>Pedidos:</strong> Emita ordens de compra automaticamente</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
              <span><strong>Fornecedores:</strong> Cadastro completo com avaliações</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
