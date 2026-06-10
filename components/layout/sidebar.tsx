'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Settings,
  ShoppingCart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface SidebarProps {
  tenant: {
    nome: string
    plano: string
    status: string
    trial_fim?: string
  }
}

export function Sidebar({ tenant }: SidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      label: 'Requisições',
      icon: FileText,
      href: '/requisicoes',
    },
    {
      label: 'Pedidos',
      icon: ShoppingCart,
      href: '/pedidos',
    },
    {
      label: 'Fornecedores',
      icon: Package,
      href: '/fornecedores',
    },
    {
      label: 'Usuários',
      icon: Users,
      href: '/usuarios',
    },
    {
      label: 'Configurações',
      icon: Settings,
      href: '/configuracoes',
    },
  ]

  const getPlanoColor = (plano: string) => {
    switch (plano) {
      case 'BASICO':
        return 'bg-blue-100 text-blue-800'
      case 'PROFISSIONAL':
        return 'bg-purple-100 text-purple-800'
      case 'ENTERPRISE':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getTrialDaysLeft = () => {
    if (!tenant.trial_fim) return null
    const now = new Date()
    const trialEnd = new Date(tenant.trial_fim)
    const diffTime = trialEnd.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const trialDays = getTrialDaysLeft()

  return (
    <aside className="w-64 border-r bg-slate-50 flex flex-col h-screen">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary">SupriFlow</h1>
        <p className="text-sm text-muted-foreground mt-1">{tenant.nome}</p>
        <div className="mt-3 flex items-center gap-2">
          <Badge className={cn('text-xs', getPlanoColor(tenant.plano))}>
            {tenant.plano}
          </Badge>
          {tenant.status === 'TRIAL' && trialDays !== null && (
            <Badge variant="outline" className="text-xs">
              {trialDays} dias restantes
            </Badge>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          © 2026 SupriFlow
        </p>
      </div>
    </aside>
  )
}
