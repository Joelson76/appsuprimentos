'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cnpj as cnpjValidator } from 'cpf-cnpj-validator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatCNPJ } from '@/lib/utils'
import type { RegisterRequest, PlanoTipo } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

export default function CadastroPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<RegisterRequest>({
    empresa: {
      nome: '',
      cnpj: '',
    },
    admin: {
      nome: '',
      email: '',
      senha: '',
    },
    plano: 'BASICO',
  })

  const [senhaConfirm, setSenhaConfirm] = useState('')

  const handleCNPJBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const cnpj = e.target.value.replace(/\D/g, '')
    if (cnpj && cnpjValidator.isValid(cnpj)) {
      setFormData({
        ...formData,
        empresa: { ...formData.empresa, cnpj },
      })
      setError('')
    } else if (cnpj) {
      setError('CNPJ inválido')
    }
  }

  const handleStep1 = () => {
    if (!formData.empresa.nome) {
      setError('Informe a razão social')
      return
    }
    if (!cnpjValidator.isValid(formData.empresa.cnpj)) {
      setError('CNPJ inválido')
      return
    }
    setError('')
    setStep(2)
  }

  const handleStep2 = () => {
    if (!formData.admin.nome) {
      setError('Informe o nome do administrador')
      return
    }
    if (!formData.admin.email) {
      setError('Informe o e-mail')
      return
    }
    if (formData.admin.senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }
    if (formData.admin.senha !== senhaConfirm) {
      setError('As senhas não coincidem')
      return
    }
    setError('')
    setStep(3)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao criar conta')
        return
      }

      router.push('/login?registered=true')
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const planos = [
    {
      tipo: 'BASICO' as PlanoTipo,
      nome: 'Starter',
      preco: 'R$ 147',
      precoAnual: 'R$ 125/mês',
      recursos: [
        '1-3 usuários',
        '20 pedidos por mês',
        'Requisições e Cotações',
        'Cadastro de fornecedores',
        'Suporte email (48h)',
      ],
    },
    {
      tipo: 'PROFISSIONAL' as PlanoTipo,
      nome: 'Business',
      preco: 'R$ 397',
      precoAnual: 'R$ 337/mês',
      recursos: [
        '5-20 usuários',
        '100 pedidos por mês',
        'Estoque + Contratos + NF-e',
        'Workflow de aprovação',
        'Histórico de preços',
        'Dashboard com KPIs',
        'Suporte prioritário (24h)',
      ],
      popular: true,
    },
    {
      tipo: 'ENTERPRISE' as PlanoTipo,
      nome: 'Enterprise',
      preco: 'A partir de R$ 997',
      precoAnual: 'Sob consulta',
      recursos: [
        'Usuários ilimitados',
        'Pedidos ilimitados',
        'API dedicada',
        'Customizações',
        'Gerente de conta',
        'Suporte 24/7',
      ],
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-2xl space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao site
        </Link>

        <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Criar Conta - SupriFlow
          </CardTitle>
          <CardDescription className="text-center">
            14 dias de teste grátis • Sem cartão de crédito
          </CardDescription>
          <div className="flex justify-center mt-4">
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 w-12 rounded-full ${
                    s <= step ? 'bg-primary' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Dados da Empresa */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Dados da Empresa</h3>
              <div className="space-y-2">
                <Label htmlFor="razao">Razão Social</Label>
                <Input
                  id="razao"
                  value={formData.empresa.nome}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      empresa: { ...formData.empresa, nome: e.target.value },
                    })
                  }
                  placeholder="Empresa LTDA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  defaultValue={formatCNPJ(formData.empresa.cnpj)}
                  onBlur={handleCNPJBlur}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>
              <div className="flex justify-between pt-4">
                <Link href="/login">
                  <Button variant="outline">Voltar</Button>
                </Link>
                <Button onClick={handleStep1}>Próximo</Button>
              </div>
            </div>
          )}

          {/* Step 2: Dados do Administrador */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Administrador</h3>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.admin.nome}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      admin: { ...formData.admin, nome: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.admin.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      admin: { ...formData.admin, email: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.admin.senha}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      admin: { ...formData.admin, senha: e.target.value },
                    })
                  }
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha-confirm">Confirmar Senha</Label>
                <Input
                  id="senha-confirm"
                  type="password"
                  value={senhaConfirm}
                  onChange={(e) => setSenhaConfirm(e.target.value)}
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button onClick={handleStep2}>Próximo</Button>
              </div>
            </div>
          )}

          {/* Step 3: Seleção de Plano */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Escolha seu Plano</h3>
              <div className="grid gap-4">
                {planos.map((plano) => (
                  <div
                    key={plano.tipo}
                    className={`border rounded-lg p-4 cursor-pointer transition ${
                      formData.plano === plano.tipo
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-slate-300'
                    } ${plano.popular ? 'ring-2 ring-primary' : ''}`}
                    onClick={() =>
                      setFormData({ ...formData, plano: plano.tipo })
                    }
                  >
                    {plano.popular && (
                      <div className="text-xs font-semibold text-primary mb-2">
                        MAIS POPULAR
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{plano.nome}</h4>
                        <p className="text-2xl font-bold text-primary">
                          {plano.preco}
                          {plano.tipo !== 'ENTERPRISE' && (
                            <span className="text-sm font-normal text-slate-500">
                              /mês
                            </span>
                          )}
                        </p>
                      </div>
                      <input
                        type="radio"
                        checked={formData.plano === plano.tipo}
                        onChange={() =>
                          setFormData({ ...formData, plano: plano.tipo })
                        }
                        className="mt-1"
                      />
                    </div>
                    <ul className="space-y-1 text-sm">
                      {plano.recursos.map((recurso, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {recurso}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Voltar
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
