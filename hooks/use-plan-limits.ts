import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PlanLimits {
  limite_usuarios: number
  limite_pos_mes: number
  limite_storage_mb: number
}

interface Usage {
  usuarios_ativos: number
  pos_mes: number
  storage_mb: number
}

interface LimitStatus {
  canCreateUser: boolean
  canCreatePO: boolean
  canUploadFile: boolean
  userLimitReached: boolean
  poLimitReached: boolean
  storageLimitReached: boolean
  userUsage: { used: number; limit: number }
  poUsage: { used: number; limit: number }
  storageUsage: { used: number; limit: number }
  loading: boolean
}

/**
 * Hook para verificar limites do plano atual
 */
export function usePlanLimits(): LimitStatus {
  const [limits, setLimits] = useState<PlanLimits | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadLimits() {
      try {
        // Buscar usuário atual
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        // Buscar tenant do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single()

        if (!profile) {
          setLoading(false)
          return
        }

        // Buscar limites do plano
        const { data: assinatura } = await supabase
          .from('assinaturas')
          .select('planos(limite_usuarios, limite_pos_mes, limite_storage_mb)')
          .eq('tenant_id', profile.tenant_id)
          .single()

        if (assinatura && assinatura.planos) {
          setLimits(assinatura.planos as any)
        }

        // Buscar uso atual
        const { data: usoData } = await supabase
          .from('uso_tenants')
          .select('usuarios_ativos, pos_mes, storage_mb')
          .eq('tenant_id', profile.tenant_id)
          .single()

        if (usoData) {
          setUsage(usoData)
        }
      } catch (error) {
        console.error('Erro ao carregar limites:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLimits()
  }, [])

  // Se não tiver dados ainda, retornar estado inicial
  if (!limits || !usage) {
    return {
      canCreateUser: true,
      canCreatePO: true,
      canUploadFile: true,
      userLimitReached: false,
      poLimitReached: false,
      storageLimitReached: false,
      userUsage: { used: 0, limit: -1 },
      poUsage: { used: 0, limit: -1 },
      storageUsage: { used: 0, limit: -1 },
      loading,
    }
  }

  // Calcular se pode criar recursos
  const canCreateUser =
    limits.limite_usuarios === -1 || usage.usuarios_ativos < limits.limite_usuarios

  const canCreatePO =
    limits.limite_pos_mes === -1 || usage.pos_mes < limits.limite_pos_mes

  const canUploadFile =
    limits.limite_storage_mb === -1 || usage.storage_mb < limits.limite_storage_mb

  return {
    canCreateUser,
    canCreatePO,
    canUploadFile,
    userLimitReached: !canCreateUser,
    poLimitReached: !canCreatePO,
    storageLimitReached: !canUploadFile,
    userUsage: {
      used: usage.usuarios_ativos,
      limit: limits.limite_usuarios,
    },
    poUsage: {
      used: usage.pos_mes,
      limit: limits.limite_pos_mes,
    },
    storageUsage: {
      used: Number(usage.storage_mb),
      limit: limits.limite_storage_mb,
    },
    loading,
  }
}

/**
 * Hook para validar limite antes de criar recurso
 */
export function useCheckLimit(type: 'usuario' | 'po' | 'storage') {
  const limits = usePlanLimits()

  const checkLimit = (): {
    allowed: boolean
    message?: string
  } => {
    if (limits.loading) {
      return {
        allowed: true, // Permitir enquanto carrega
      }
    }

    switch (type) {
      case 'usuario':
        if (!limits.canCreateUser) {
          return {
            allowed: false,
            message: `Limite de ${limits.userUsage.limit} usuários atingido. Faça upgrade do plano para adicionar mais usuários.`,
          }
        }
        break

      case 'po':
        if (!limits.canCreatePO) {
          return {
            allowed: false,
            message: `Limite de ${limits.poUsage.limit} POs/mês atingido. Faça upgrade do plano ou aguarde o reset mensal.`,
          }
        }
        break

      case 'storage':
        if (!limits.canUploadFile) {
          return {
            allowed: false,
            message: `Limite de ${limits.storageUsage.limit} MB de storage atingido. Faça upgrade do plano para mais espaço.`,
          }
        }
        break
    }

    return { allowed: true }
  }

  return {
    ...limits,
    checkLimit,
  }
}
