export type Perfil =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'GESTOR'
  | 'COMPRADOR'
  | 'SOLICITANTE'
  | 'ALMOXARIFE'
  | 'FINANCEIRO'

export type PlanoTipo = 'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE'

export type StatusTenant = 'TRIAL' | 'ATIVO' | 'BLOQUEADO' | 'CANCELADO'

export interface Tenant {
  id: string
  nome: string
  cnpj: string
  plano: PlanoTipo
  status: StatusTenant
  trial_fim?: string
  logo_url?: string
  endereco?: Record<string, any>
  criado_em: string
  atualizado_em: string
}

export interface Profile {
  id: string
  tenant_id: string
  nome: string
  perfil: Perfil
  ativo: boolean
  token_convite?: string
  criado_em: string
  atualizado_em: string
}

export interface User {
  id: string
  email: string
  profile?: Profile
  tenant?: Tenant
}

export interface RegisterRequest {
  empresa: {
    nome: string
    cnpj: string
    endereco?: {
      cep?: string
      logradouro?: string
      numero?: string
      complemento?: string
      bairro?: string
      cidade?: string
      uf?: string
    }
  }
  admin: {
    nome: string
    email: string
    senha: string
  }
  plano: PlanoTipo
}
