import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, Key, History, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { AlterarSenhaForm } from '@/components/configuracoes/alterar-senha-form'

export default async function SegurancaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id || '')
    .single()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/configuracoes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Segurança</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua senha e configurações de segurança
          </p>
        </div>
      </div>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Atualize sua senha regularmente para manter sua conta segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlterarSenhaForm />
        </CardContent>
      </Card>

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Informações da Conta
          </CardTitle>
          <CardDescription>Detalhes da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">E-mail</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nome</p>
            <p className="font-medium">{profile?.nome}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Perfil</p>
            <p className="font-medium">{profile?.perfil}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Última Atualização</p>
            <p className="font-medium">
              {profile?.atualizado_em
                ? new Date(profile.atualizado_em).toLocaleString('pt-BR')
                : '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sessões Ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Sessões Ativas
          </CardTitle>
          <CardDescription>
            Gerencie os dispositivos conectados à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium">Sessão Atual</p>
                <p className="text-sm text-muted-foreground">
                  Este dispositivo
                </p>
              </div>
              <Button variant="outline" disabled>
                Ativo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              💡 Você está conectado neste dispositivo
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Autenticação em Dois Fatores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticação em Dois Fatores (2FA)
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <p className="text-sm text-blue-900">
              ℹ️ A autenticação em dois fatores adiciona uma camada extra de
              segurança, exigindo um código além da senha.
            </p>
          </div>
          <Button variant="outline" disabled>
            Em Breve
          </Button>
        </CardContent>
      </Card>

      {/* Zona de Perigo */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>Ações irreversíveis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Desativar Conta</p>
              <p className="text-sm text-muted-foreground">
                Sua conta será desativada e você perderá acesso ao sistema
              </p>
            </div>
            <Button variant="destructive" disabled>
              Desativar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
