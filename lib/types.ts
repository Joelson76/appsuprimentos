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

// Fase 2 - Compras
export type StatusFornecedor =
  | 'ATIVO'
  | 'INATIVO'
  | 'BLOQUEADO'
  | 'EM_HOMOLOGACAO'

export type UrgenciaTipo = 'BAIXA' | 'NORMAL' | 'ALTA' | 'CRITICA'

export type StatusRequisicao =
  | 'RASCUNHO'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADA'
  | 'REPROVADA'
  | 'EM_COTACAO'
  | 'PEDIDO_GERADO'
  | 'CANCELADA'

export type StatusPO =
  | 'RASCUNHO'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADA'
  | 'ENVIADA_FORNECEDOR'
  | 'CONFIRMADA'
  | 'EM_TRANSITO'
  | 'PARCIALMENTE_RECEBIDA'
  | 'RECEBIDA'
  | 'FATURADA'
  | 'CANCELADA'

export type StatusCotacao = 'ABERTA' | 'AGUARDANDO_RESPOSTAS' | 'ENCERRADA' | 'CANCELADA'

export type TipoAprovacao = 'REQUISICAO' | 'PO' | 'CONTRATO'

export type StatusAprovacao = 'PENDENTE' | 'APROVADO' | 'REPROVADO' | 'DELEGADO'

export interface Fornecedor {
  id: string
  tenant_id: string
  razao_social: string
  nome_fantasia?: string
  cnpj: string
  email?: string
  telefone?: string
  endereco?: Record<string, any>
  categorias?: string[]
  status: StatusFornecedor
  prazo_medio_pagamento?: number
  score: number
  criado_em: string
  atualizado_em: string
}

export interface Categoria {
  id: string
  tenant_id: string
  nome: string
  codigo?: string
  pai_id?: string
}

export interface CentroCusto {
  id: string
  tenant_id: string
  nome: string
  codigo: string
  orcamento?: number
}

export interface Requisicao {
  id: string
  tenant_id: string
  numero: string
  solicitante_id: string
  centro_custo_id?: string
  status: StatusRequisicao
  urgencia: UrgenciaTipo
  descricao?: string
  data_necessidade?: string
  criado_em: string
  atualizado_em: string
}

export interface ItemRequisicao {
  id: string
  requisicao_id: string
  descricao: string
  quantidade: number
  unidade: string
  valor_estimado?: number
  categoria_id?: string
}

export interface Aprovacao {
  id: string
  tenant_id: string
  tipo: TipoAprovacao
  referencia_id: string
  aprovador_id: string
  status: StatusAprovacao
  nivel: number
  comentario?: string
  criado_em: string
  respondido_em?: string
}

export interface OrdemCompra {
  id: string
  tenant_id: string
  numero: string
  requisicao_id?: string
  fornecedor_id: string
  status: StatusPO
  valor_total: number
  prazo_entrega?: string
  condicao_pagamento?: string
  observacoes?: string
  criado_em: string
  atualizado_em: string
}

export interface ItemPO {
  id: string
  pedido_id: string
  descricao: string
  quantidade: number
  unidade: string
  valor_unitario: number
  valor_total: number
}
