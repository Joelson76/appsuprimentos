'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function AlterarSenhaForm() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.senhaAtual || !formData.novaSenha || !formData.confirmarSenha) {
      toast.error('Preencha todos os campos')
      return
    }

    if (formData.novaSenha.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres')
      return
    }

    if (formData.novaSenha !== formData.confirmarSenha) {
      toast.error('As senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Atualizar senha
      const { error } = await supabase.auth.updateUser({
        password: formData.novaSenha,
      })

      if (error) throw error

      toast.success('Senha alterada com sucesso!')
      setFormData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })
    } catch (error: any) {
      console.error('Erro:', error)
      toast.error(error.message || 'Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="senhaAtual">Senha Atual *</Label>
        <div className="relative">
          <Input
            id="senhaAtual"
            type={showPassword ? 'text' : 'password'}
            value={formData.senhaAtual}
            onChange={(e) =>
              setFormData({ ...formData, senhaAtual: e.target.value })
            }
            disabled={loading}
            placeholder="••••••••"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="novaSenha">Nova Senha *</Label>
        <Input
          id="novaSenha"
          type={showPassword ? 'text' : 'password'}
          value={formData.novaSenha}
          onChange={(e) =>
            setFormData({ ...formData, novaSenha: e.target.value })
          }
          disabled={loading}
          placeholder="••••••••"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Mínimo de 6 caracteres
        </p>
      </div>

      <div>
        <Label htmlFor="confirmarSenha">Confirmar Nova Senha *</Label>
        <Input
          id="confirmarSenha"
          type={showPassword ? 'text' : 'password'}
          value={formData.confirmarSenha}
          onChange={(e) =>
            setFormData({ ...formData, confirmarSenha: e.target.value })
          }
          disabled={loading}
          placeholder="••••••••"
        />
      </div>

      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-900">
          ⚠️ Após alterar a senha, você permanecerá conectado neste
          dispositivo.
        </p>
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Save className="mr-2 h-4 w-4" />
        Alterar Senha
      </Button>
    </form>
  )
}
