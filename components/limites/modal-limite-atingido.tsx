'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, TrendingUp, X } from 'lucide-react'
import Link from 'next/link'

interface ModalLimiteAtingidoProps {
  open: boolean
  onClose: () => void
  tipo: 'pedidos' | 'usuarios' | 'fornecedores'
  usado: number
  limite: number
  planoAtual?: string
}

const TEXTOS = {
  pedidos: {
    titulo: 'Limite de pedidos atingido',
    descricao: 'Você atingiu o limite de pedidos do seu plano',
    acao: 'criar novos pedidos',
    beneficio: 'Aumente seu limite e continue criando pedidos sem restrições',
  },
  usuarios: {
    titulo: 'Limite de usuários atingido',
    descricao: 'Você atingiu o limite de usuários do seu plano',
    acao: 'adicionar mais usuários',
    beneficio: 'Adicione mais membros à sua equipe com um plano superior',
  },
  fornecedores: {
    titulo: 'Limite de fornecedores atingido',
    descricao: 'Você atingiu o limite de fornecedores do seu plano',
    acao: 'cadastrar mais fornecedores',
    beneficio: 'Gerencie mais fornecedores fazendo upgrade do seu plano',
  },
}

const PLANOS_SUGERIDOS = {
  BASICO: {
    upgrade: 'Profissional',
    preco: 'R$ 799/mês',
    limite_pedidos: '100 pedidos/mês',
    limite_usuarios: '10 usuários',
  },
  PROFISSIONAL: {
    upgrade: 'Enterprise',
    preco: 'Sob consulta',
    limite_pedidos: 'Pedidos ilimitados',
    limite_usuarios: 'Usuários ilimitados',
  },
}

export function ModalLimiteAtingido({
  open,
  onClose,
  tipo,
  usado,
  limite,
  planoAtual = 'BASICO',
}: ModalLimiteAtingidoProps) {
  const texto = TEXTOS[tipo]
  const planoSugerido = PLANOS_SUGERIDOS[planoAtual as keyof typeof PLANOS_SUGERIDOS]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle className="text-xl">{texto.titulo}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-2">{texto.descricao}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Uso atual</span>
              <span className="text-muted-foreground">
                {usado} / {limite}
              </span>
            </div>
            <Progress value={100} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              Você atingiu 100% do limite. Para {texto.acao}, faça upgrade do seu plano.
            </p>
          </div>

          {planoSugerido && (
            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h4 className="font-semibold">Plano {planoSugerido.upgrade}</h4>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">{texto.beneficio}</p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {planoSugerido.limite_pedidos}
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {planoSugerido.limite_usuarios}
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Todas as funcionalidades avançadas
                </li>
              </ul>
              <p className="mt-3 font-semibold text-primary">{planoSugerido.preco}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Link href="/configuracoes/planos">
            <Button className="w-full sm:w-auto">
              <TrendingUp className="mr-2 h-4 w-4" />
              Ver Planos e Fazer Upgrade
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
