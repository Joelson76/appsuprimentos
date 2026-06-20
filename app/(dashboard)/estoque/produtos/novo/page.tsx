import { createClient } from '@/lib/supabase/server'
import { FormularioProduto } from '@/components/estoque/formulario-produto'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function NovoProdutoPage() {
  const supabase = await createClient()

  // Buscar categorias
  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nome')
    .order('nome')

  // Buscar fornecedores
  const { data: fornecedores, error: fornecedoresError } = await supabase
    .from('fornecedores')
    .select('id, razao_social, nome_fantasia')
    .eq('status', 'ATIVO')
    .order('razao_social')

  if (fornecedoresError) {
    console.error('Erro ao buscar fornecedores:', fornecedoresError)
  }

  console.log('Fornecedores encontrados:', fornecedores?.length || 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/estoque">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Novo Produto</h1>
          <p className="text-muted-foreground mt-1">
            Cadastre um novo produto no estoque
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Produto</CardTitle>
          <CardDescription>
            Preencha os dados completos do produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioProduto
            categorias={categorias || []}
            fornecedores={fornecedores || []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
