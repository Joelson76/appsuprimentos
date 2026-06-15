'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Bell, Mail, Smartphone, Clock, CheckCircle2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Preferencias {
  // Requisições
  req_criada_email: boolean
  req_aprovada_email: boolean
  req_rejeitada_email: boolean
  req_criada_push: boolean
  req_aprovada_push: boolean
  req_rejeitada_push: boolean

  // Cotações
  cot_nova_email: boolean
  cot_resposta_email: boolean
  cot_vencendo_email: boolean
  cot_nova_push: boolean
  cot_resposta_push: boolean
  cot_vencendo_push: boolean

  // Pedidos
  po_criado_email: boolean
  po_aprovado_email: boolean
  po_enviado_email: boolean
  po_recebido_email: boolean
  po_criado_push: boolean
  po_aprovado_push: boolean
  po_enviado_push: boolean
  po_recebido_push: boolean

  // Contratos
  contrato_vencendo_email: boolean
  contrato_vencido_email: boolean
  contrato_vencendo_push: boolean
  contrato_vencido_push: boolean

  // Sistema
  assinatura_vencendo_email: boolean
  assinatura_suspensa_email: boolean
  limite_atingido_email: boolean
  assinatura_vencendo_push: boolean
  assinatura_suspensa_push: boolean
  limite_atingido_push: boolean

  // Resumos
  resumo_diario_email: boolean
  resumo_semanal_email: boolean
  resumo_mensal_email: boolean
  horario_resumo: string
}

export default function NotificacoesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [preferencias, setPreferencias] = useState<Preferencias>({
    req_criada_email: true,
    req_aprovada_email: true,
    req_rejeitada_email: true,
    req_criada_push: true,
    req_aprovada_push: true,
    req_rejeitada_push: false,
    cot_nova_email: true,
    cot_resposta_email: true,
    cot_vencendo_email: true,
    cot_nova_push: true,
    cot_resposta_push: true,
    cot_vencendo_push: false,
    po_criado_email: true,
    po_aprovado_email: true,
    po_enviado_email: true,
    po_recebido_email: true,
    po_criado_push: true,
    po_aprovado_push: false,
    po_enviado_push: false,
    po_recebido_push: true,
    contrato_vencendo_email: true,
    contrato_vencido_email: true,
    contrato_vencendo_push: true,
    contrato_vencido_push: true,
    assinatura_vencendo_email: true,
    assinatura_suspensa_email: true,
    limite_atingido_email: true,
    assinatura_vencendo_push: true,
    assinatura_suspensa_push: true,
    limite_atingido_push: false,
    resumo_diario_email: false,
    resumo_semanal_email: true,
    resumo_mensal_email: true,
    horario_resumo: '08:00:00',
  })

  useEffect(() => {
    loadPreferencias()
  }, [])

  const loadPreferencias = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Verificar se a tabela existe tentando carregar
      const { data, error } = await supabase
        .from('preferencias_notificacao')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      // Se não encontrou ou erro de não encontrado, usa padrões
      if (!data || error?.code === 'PGRST116' || error?.code === '42P01') {
        // Usa valores padrão (já definidos no useState inicial)
        setLoading(false)
        return
      }

      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        console.warn('Aviso ao carregar preferências:', error.message)
        // Continua com valores padrão mesmo com erro
        setLoading(false)
        return
      }

      if (data) {
        setPreferencias(data)
      }

      setLoading(false)
    } catch (err: any) {
      console.warn('Erro ao carregar preferências:', err)
      // Não mostra erro, apenas usa valores padrão
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.tenant_id) {
        throw new Error('Tenant não encontrado')
      }

      // Debug: log dos dados
      console.log('🔍 Tentando salvar:', {
        user_id: user.id,
        tenant_id: profile.tenant_id,
        email: user.email,
      })

      // Tentar salvar
      const { data: upsertData, error: upsertError } = await supabase
        .from('preferencias_notificacao')
        .upsert({
          user_id: user.id,
          tenant_id: profile.tenant_id,
          ...preferencias,
        })
        .select()

      console.log('📊 Resultado:', { data: upsertData, error: upsertError })

      // Se tabela não existe, avisar usuário
      if (upsertError?.code === '42P01') {
        setError('A tabela de preferências ainda não foi criada. Aplique a migration 20260615000005_preferencias_notificacao.sql no Supabase.')
        setSaving(false)
        return
      }

      if (upsertError) {
        console.error('❌ Erro detalhado:', upsertError)
        setError(`Erro: ${upsertError.message} (código: ${upsertError.code})`)
        throw upsertError
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Erro ao salvar:', err)
      setError(err.message || 'Erro ao salvar preferências')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof Preferencias, value: boolean | string) => {
    setPreferencias((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando preferências...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Preferências de Notificações</h1>
        <p className="text-muted-foreground mt-2">
          Controle quais notificações você deseja receber por e-mail ou push
        </p>
      </div>

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">Preferências salvas com sucesso!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Requisições */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Requisições de Compra
          </CardTitle>
          <CardDescription>
            Notificações sobre requisições criadas, aprovadas ou rejeitadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" />
                E-mail
              </div>
              <NotificationRow
                label="Requisição criada"
                checked={preferencias.req_criada_email}
                onChange={(v) => updateField('req_criada_email', v)}
              />
              <NotificationRow
                label="Requisição aprovada"
                checked={preferencias.req_aprovada_email}
                onChange={(v) => updateField('req_aprovada_email', v)}
              />
              <NotificationRow
                label="Requisição rejeitada"
                checked={preferencias.req_rejeitada_email}
                onChange={(v) => updateField('req_rejeitada_email', v)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                Push
              </div>
              <NotificationRow
                label="Requisição criada"
                checked={preferencias.req_criada_push}
                onChange={(v) => updateField('req_criada_push', v)}
              />
              <NotificationRow
                label="Requisição aprovada"
                checked={preferencias.req_aprovada_push}
                onChange={(v) => updateField('req_aprovada_push', v)}
              />
              <NotificationRow
                label="Requisição rejeitada"
                checked={preferencias.req_rejeitada_push}
                onChange={(v) => updateField('req_rejeitada_push', v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cotações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Cotações
          </CardTitle>
          <CardDescription>
            Notificações sobre cotações e respostas de fornecedores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" />
                E-mail
              </div>
              <NotificationRow
                label="Nova cotação"
                checked={preferencias.cot_nova_email}
                onChange={(v) => updateField('cot_nova_email', v)}
              />
              <NotificationRow
                label="Resposta de fornecedor"
                checked={preferencias.cot_resposta_email}
                onChange={(v) => updateField('cot_resposta_email', v)}
              />
              <NotificationRow
                label="Cotação vencendo"
                checked={preferencias.cot_vencendo_email}
                onChange={(v) => updateField('cot_vencendo_email', v)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                Push
              </div>
              <NotificationRow
                label="Nova cotação"
                checked={preferencias.cot_nova_push}
                onChange={(v) => updateField('cot_nova_push', v)}
              />
              <NotificationRow
                label="Resposta de fornecedor"
                checked={preferencias.cot_resposta_push}
                onChange={(v) => updateField('cot_resposta_push', v)}
              />
              <NotificationRow
                label="Cotação vencendo"
                checked={preferencias.cot_vencendo_push}
                onChange={(v) => updateField('cot_vencendo_push', v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Pedidos de Compra
          </CardTitle>
          <CardDescription>
            Notificações sobre pedidos e recebimentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" />
                E-mail
              </div>
              <NotificationRow
                label="Pedido criado"
                checked={preferencias.po_criado_email}
                onChange={(v) => updateField('po_criado_email', v)}
              />
              <NotificationRow
                label="Pedido aprovado"
                checked={preferencias.po_aprovado_email}
                onChange={(v) => updateField('po_aprovado_email', v)}
              />
              <NotificationRow
                label="Pedido enviado"
                checked={preferencias.po_enviado_email}
                onChange={(v) => updateField('po_enviado_email', v)}
              />
              <NotificationRow
                label="Pedido recebido"
                checked={preferencias.po_recebido_email}
                onChange={(v) => updateField('po_recebido_email', v)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                Push
              </div>
              <NotificationRow
                label="Pedido criado"
                checked={preferencias.po_criado_push}
                onChange={(v) => updateField('po_criado_push', v)}
              />
              <NotificationRow
                label="Pedido aprovado"
                checked={preferencias.po_aprovado_push}
                onChange={(v) => updateField('po_aprovado_push', v)}
              />
              <NotificationRow
                label="Pedido enviado"
                checked={preferencias.po_enviado_push}
                onChange={(v) => updateField('po_enviado_push', v)}
              />
              <NotificationRow
                label="Pedido recebido"
                checked={preferencias.po_recebido_push}
                onChange={(v) => updateField('po_recebido_push', v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contratos e Sistema */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Contratos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NotificationRow
              label="Contrato vencendo (e-mail)"
              checked={preferencias.contrato_vencendo_email}
              onChange={(v) => updateField('contrato_vencendo_email', v)}
            />
            <NotificationRow
              label="Contrato vencido (e-mail)"
              checked={preferencias.contrato_vencido_email}
              onChange={(v) => updateField('contrato_vencido_email', v)}
            />
            <NotificationRow
              label="Contrato vencendo (push)"
              checked={preferencias.contrato_vencendo_push}
              onChange={(v) => updateField('contrato_vencendo_push', v)}
            />
            <NotificationRow
              label="Contrato vencido (push)"
              checked={preferencias.contrato_vencido_push}
              onChange={(v) => updateField('contrato_vencido_push', v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NotificationRow
              label="Assinatura vencendo (e-mail)"
              checked={preferencias.assinatura_vencendo_email}
              onChange={(v) => updateField('assinatura_vencendo_email', v)}
            />
            <NotificationRow
              label="Assinatura suspensa (e-mail)"
              checked={preferencias.assinatura_suspensa_email}
              onChange={(v) => updateField('assinatura_suspensa_email', v)}
            />
            <NotificationRow
              label="Limite atingido (e-mail)"
              checked={preferencias.limite_atingido_email}
              onChange={(v) => updateField('limite_atingido_email', v)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Resumos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Resumos Periódicos
          </CardTitle>
          <CardDescription>
            Receba um resumo das atividades por e-mail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotificationRow
            label="Resumo diário"
            checked={preferencias.resumo_diario_email}
            onChange={(v) => updateField('resumo_diario_email', v)}
          />
          <NotificationRow
            label="Resumo semanal"
            checked={preferencias.resumo_semanal_email}
            onChange={(v) => updateField('resumo_semanal_email', v)}
          />
          <NotificationRow
            label="Resumo mensal"
            checked={preferencias.resumo_mensal_email}
            onChange={(v) => updateField('resumo_mensal_email', v)}
          />

          <Separator />

          <div className="space-y-2">
            <Label>Horário para envio dos resumos</Label>
            <Select
              value={preferencias.horario_resumo}
              onValueChange={(v) => updateField('horario_resumo', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="06:00:00">06:00</SelectItem>
                <SelectItem value="07:00:00">07:00</SelectItem>
                <SelectItem value="08:00:00">08:00</SelectItem>
                <SelectItem value="09:00:00">09:00</SelectItem>
                <SelectItem value="10:00:00">10:00</SelectItem>
                <SelectItem value="12:00:00">12:00</SelectItem>
                <SelectItem value="18:00:00">18:00</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </Button>
      </div>
    </div>
  )
}

function NotificationRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={label} className="cursor-pointer">
        {label}
      </Label>
      <Switch id={label} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
