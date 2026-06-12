'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function ConvidarUsuarioDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    perfil: 'SOLICITANTE',
  })

  const perfis = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'GESTOR', label: 'Gestor' },
    { value: 'COMPRADOR', label: 'Comprador' },
    { value: 'SOLICITANTE', label: 'Solicitante' },
    { value: 'ALMOXARIFE', label: 'Almoxarife' },
    { value: 'FINANCEIRO', label: 'Financeiro' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome || !formData.email) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Buscar tenant_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.tenant_id) throw new Error('Tenant não encontrado')

      // Criar usuário via função RPC (você precisará criar esta função no Supabase)
      // Por enquanto, vou simular criando apenas o profile
      // Em produção, você deve criar o usuário via Supabase Auth

      const senhaTemporaria = Math.random().toString(36).slice(-8)

      // Criar auth user (isso precisa ser feito via função edge ou admin)
      const response = await fetch('/api/usuarios/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          senha: senhaTemporaria,
          nome: formData.nome,
          perfil: formData.perfil,
          tenant_id: profile.tenant_id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar usuário')
      }

      toast.success('Usuário convidado! Um e-mail foi enviado com a senha.')
      setFormData({ nome: '', email: '', perfil: 'SOLICITANTE' })
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Erro:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erro ao convidar usuário'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Novo Usuário</DialogTitle>
          <DialogDescription>
            Adicione um novo membro à sua equipe
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              placeholder="João Silva"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="joao@empresa.com"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="perfil">Perfil *</Label>
            <Select
              value={formData.perfil}
              onValueChange={(value) =>
                setFormData({ ...formData, perfil: value })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {perfis.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Define as permissões de acesso do usuário
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              ℹ️ Uma senha temporária será gerada e enviada por e-mail
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Convidar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
