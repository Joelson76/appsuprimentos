'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Settings,
  ShoppingCart,
  Receipt,
  FileCheck,
  Warehouse,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'

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
      label: 'Cotações',
      icon: Receipt,
      href: '/cotacoes',
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
      label: 'Estoque',
      icon: Warehouse,
      href: '/estoque',
    },
    {
      label: 'Notas Fiscais',
      icon: FileSpreadsheet,
      href: '/notas-fiscais',
    },
    {
      label: 'Contratos',
      icon: FileCheck,
      href: '/contratos',
    },
    {
      label: 'Usuários',
      icon: Users,
      href: '/usuarios',
    },
    {
      label: 'Relatórios',
      icon: BarChart3,
      href: '/relatorios',
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
    <aside className="w-64 border-r bg-background flex flex-col h-screen">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3 mb-1">
          <Image
            src="/logo-jls.jpg"
            alt="JLS Tecnologia"
            width={40}
            height={40}
            className="object-contain"
            priority
          />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-primary">SupriFlow</h1>
            <p className="text-[10px] text-muted-foreground -mt-1">by JLS Tecnologia</p>
          </div>
        </div>
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
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t space-y-3">
        <div className="flex items-center justify-center">
          <ThemeToggle />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          © 2026 JLS Tecnologia
        </p>
        <p className="text-[10px] text-muted-foreground text-center">
          SupriFlow v1.0
        </p>
      </div>
    </aside>
  )
}
