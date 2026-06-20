import { createClient } from '@/lib/supabase/server'
import { FormularioProduto } from '@/components/estoque/formulario-produto'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'

export default async function EditarProdutoPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Buscar produto
  const { data: produto, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !produto) {
    notFound()
  }

  // Buscar categorias
  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nome')
    .order('nome')

  // Buscar fornecedores
  const { data: fornecedores } = await supabase
    .from('fornecedores')
    .select('id, razao_social, nome_fantasia')
    .eq('status', 'ATIVO')
    .order('razao_social')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/estoque">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Produto</h1>
          <p className="text-muted-foreground mt-1">{produto.descricao}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Produto</CardTitle>
          <CardDescription>
            Atualize os dados do produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioProduto
            produto={produto}
            categorias={categorias || []}
            fornecedores={fornecedores || []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
