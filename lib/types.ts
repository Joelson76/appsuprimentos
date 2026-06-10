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

// Fase 3 - Recebimento, NF-e e Contratos
export type StatusRecebimento = 'PENDENTE' | 'PARCIAL' | 'COMPLETO' | 'DIVERGENTE'

export type StatusNF = 'PENDENTE' | 'CONFERIDA' | 'APROVADA' | 'DIVERGENTE' | 'DEVOLVIDA'

export type StatusContrato = 'ATIVO' | 'VENCENDO' | 'VENCIDO' | 'CANCELADO' | 'EM_RENOVACAO'

export interface Recebimento {
  id: string
  tenant_id: string
  pedido_id: string
  recebido_por_id: string
  status: StatusRecebimento
  observacoes?: string
  criado_em: string
}

export interface ItemRecebimento {
  id: string
  recebimento_id: string
  descricao: string
  quantidade_pedida: number
  quantidade_recebida: number
  divergencia: boolean
  observacao?: string
}

export interface NotaFiscal {
  id: string
  tenant_id: string
  pedido_id: string
  recebimento_id?: string
  numero: string
  serie?: string
  chave_acesso?: string
  emissao: string
  valor_total: number
  status: StatusNF
  xml_path?: string
  pdf_path?: string
  divergencias?: any[]
  criado_em: string
}

export interface Contrato {
  id: string
  tenant_id: string
  fornecedor_id: string
  titulo: string
  numero?: string
  valor_total?: number
  inicio: string
  fim: string
  status: StatusContrato
  renovacao_auto: boolean
  alerta_dias: number
  arquivo_path?: string
  observacoes?: string
  criado_em: string
  atualizado_em: string
}

// Fase 4 - Estoque, Dashboard e Relatórios
export type TipoMovimentacao =
  | 'ENTRADA'
  | 'SAIDA'
  | 'AJUSTE_MAIS'
  | 'AJUSTE_MENOS'
  | 'TRANSFERENCIA'

export interface Produto {
  id: string
  tenant_id: string
  descricao: string
  codigo?: string
  unidade: string
  categoria_id?: string
  estoque_atual: number
  estoque_minimo_alerta?: number
  localizacao?: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface MovimentacaoEstoque {
  id: string
  tenant_id: string
  produto_id: string
  tipo: TipoMovimentacao
  quantidade: number
  saldo_anterior: number
  saldo_posterior: number
  pedido_id?: string
  requisicao_id?: string
  usuario_id: string
  observacao?: string
  criado_em: string
}

export interface KPIDashboard {
  gasto_mes_atual: number
  gasto_mes_anterior: number
  pos_abertas: number
  pos_mes_atual: number
}

export interface GastoCategoria {
  categoria: string
  total: number
}

export interface TopFornecedor {
  razao_social: string
  num_pedidos: number
  total: number
}
