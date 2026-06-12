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
import { Loader2, Edit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  usuario: {
    id: string
    nome: string
    email: string
    perfil: string
  }
}

export function EditarUsuarioDialog({ usuario }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  console.log('EditarUsuarioDialog renderizado:', usuario)

  const [formData, setFormData] = useState({
    nome: usuario.nome,
    perfil: usuario.perfil,
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

    if (!formData.nome) {
      toast.error('Informe o nome')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome,
          perfil: formData.perfil,
        })
        .eq('id', usuario.id)

      if (error) throw error

      toast.success('Usuário atualizado!')
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao atualizar usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      console.log('Dialog onOpenChange:', isOpen)
      setOpen(isOpen)
    }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          type="button"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Altere as informações do usuário
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
              disabled={loading}
            />
          </div>

          <div>
            <Label>E-mail</Label>
            <Input value={usuario.email} disabled />
            <p className="text-xs text-muted-foreground mt-1">
              O e-mail não pode ser alterado
            </p>
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
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
