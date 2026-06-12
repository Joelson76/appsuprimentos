import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  FileSpreadsheet,
  FileText,
  ShoppingCart,
  Package,
  Users,
  Building2,
  TrendingUp,
  Download,
} from 'lucide-react'
import { ExportarRequisicoes } from '@/components/relatorios/exportar-requisicoes'
import { ExportarPedidos } from '@/components/relatorios/exportar-pedidos'
import { ExportarFornecedores } from '@/components/relatorios/exportar-fornecedores'
import { ExportarEstoque } from '@/components/relatorios/exportar-estoque'

export default async function RelatoriosPage() {
  const supabase = await createClient()

  // Buscar estatísticas
  const { count: totalRequisicoes } = await supabase
    .from('requisicoes')
    .select('*', { count: 'exact', head: true })

  const { count: totalPedidos } = await supabase
    .from('pedidos')
    .select('*', { count: 'exact', head: true })

  const { count: totalFornecedores } = await supabase
    .from('fornecedores')
    .select('*', { count: 'exact', head: true })

  const { count: totalProdutos } = await supabase
    .from('produtos')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios e Exportações</h1>
        <p className="text-muted-foreground mt-1">
          Exporte dados para Excel ou PDF
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Requisições
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequisicoes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPedidos || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFornecedores || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProdutos || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Exportação */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Requisições */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatório de Requisições
            </CardTitle>
            <CardDescription>
              Exporte requisições por período e status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportarRequisicoes />
          </CardContent>
        </Card>

        {/* Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Relatório de Pedidos
            </CardTitle>
            <CardDescription>
              Exporte pedidos com valores e fornecedores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportarPedidos />
          </CardContent>
        </Card>

        {/* Fornecedores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Relatório de Fornecedores
            </CardTitle>
            <CardDescription>
              Lista completa de fornecedores cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportarFornecedores />
          </CardContent>
        </Card>

        {/* Estoque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Relatório de Estoque
            </CardTitle>
            <CardDescription>
              Posição atual do estoque de produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportarEstoque />
          </CardContent>
        </Card>
      </div>

      {/* Informações */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Download className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">
                Como usar os relatórios
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Selecione o período desejado nos filtros</li>
                <li>• Clique em "Exportar Excel" para baixar a planilha</li>
                <li>• Os arquivos são gerados instantaneamente</li>
                <li>• Formato: .xlsx compatível com Excel, Google Sheets, etc</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
