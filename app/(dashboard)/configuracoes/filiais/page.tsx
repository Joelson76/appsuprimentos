import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin, Plus, Users } from 'lucide-react'
import Link from 'next/link'

export default async function FiliaisPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user?.id || '')
    .single()

  // Buscar filiais do tenant (com fallback se tabela não existir)
  let filiais = null
  let error = null

  try {
    const result = await supabase
      .from('filiais')
      .select(`
        *,
        _usuarios:profiles(count),
        _requisicoes:requisicoes(count),
        _pedidos:ordens_compra(count)
      `)
      .eq('tenant_id', profile?.tenant_id || '')
      .order('is_matriz', { ascending: false })
      .order('nome')

    filiais = result.data
    error = result.error
  } catch (e) {
    console.error('Erro ao buscar filiais:', e)
  }

  // Se a tabela não existe, mostrar aviso
  if (error?.code === '42P01') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Filiais</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Sistema de Filiais não instalado
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Execute a migration <code>20260619000001_add_filiais.sql</code> no
              Supabase SQL Editor
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Filiais</h1>
          <p className="text-muted-foreground">
            Gerencie as filiais da sua empresa (multi-CNPJ)
          </p>
        </div>
        <Button asChild>
          <Link href="/configuracoes/filiais/nova">
            <Plus className="h-4 w-4 mr-2" />
            Nova Filial
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filiais?.map((filial: any) => (
          <Card key={filial.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{filial.nome}</CardTitle>
                </div>
                {filial.is_matriz && (
                  <Badge variant="default">Matriz</Badge>
                )}
                {!filial.ativa && (
                  <Badge variant="secondary">Inativa</Badge>
                )}
              </div>
              {filial.nome_fantasia && (
                <CardDescription>{filial.nome_fantasia}</CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* CNPJ */}
              <div>
                <p className="text-sm font-medium">CNPJ</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {formatCNPJ(filial.cnpj)}
                </p>
              </div>

              {/* Endereço */}
              {(filial.cidade || filial.estado) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm">
                      {filial.cidade}
                      {filial.estado && ` - ${filial.estado}`}
                    </p>
                    {filial.logradouro && (
                      <p className="text-xs text-muted-foreground">
                        {filial.logradouro}
                        {filial.numero && `, ${filial.numero}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {filial._usuarios?.[0]?.count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Usuários</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {filial._requisicoes?.[0]?.count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Requisições</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {filial._pedidos?.[0]?.count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Pedidos</p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/configuracoes/filiais/${filial.id}`}>
                    Ver Detalhes
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!filiais || filiais.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma filial cadastrada
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione filiais para gerenciar múltiplos CNPJs
            </p>
            <Button asChild>
              <Link href="/configuracoes/filiais/nova">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeira Filial
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
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
