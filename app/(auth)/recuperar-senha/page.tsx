'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })

      if (error) {
        setError('Erro ao enviar e-mail. Verifique o endereço.')
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('Erro ao processar solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>

        <Card className="w-full">
          <CardHeader className="space-y-3">
            <div className="flex flex-col items-center gap-3">
              <Image
                src="/logo-jls.jpg"
                alt="JLS Tecnologia"
                width={80}
                height={80}
                className="object-contain"
              />
              <div className="text-center">
                <CardTitle className="text-2xl font-bold">
                  Recuperar Senha
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">by JLS Tecnologia</p>
              </div>
            </div>
            <CardDescription className="text-center">
              Digite seu e-mail para receber o link de recuperação
            </CardDescription>
          </CardHeader>

          {success ? (
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                <p className="font-semibold">E-mail enviado!</p>
                <p className="text-sm mt-1">
                  Verifique sua caixa de entrada e spam.
                  Clique no link recebido para redefinir sua senha.
                </p>
              </div>
              <Link href="/login" className="block">
                <Button className="w-full">
                  Voltar ao Login
                </Button>
              </Link>
            </CardContent>
          ) : (
            <form onSubmit={handleRecuperar}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                </Button>
                <div className="text-sm text-center text-muted-foreground">
                  Lembrou sua senha?{' '}
                  <Link href="/login" className="text-primary hover:underline">
                    Fazer login
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
