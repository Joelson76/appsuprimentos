// ==========================================
// PREÇOS DOS PLANOS - OPÇÃO 3 (HÍBRIDA)
// ==========================================

export const PRICING = {
  BASICO: {
    slug: 'BASICO',
    nome: 'Starter',
    preco_mensal: 14700, // centavos
    preco_anual: 149940, // centavos (15% desconto)
    descricao: 'Ideal para pequenas empresas começando a organizar compras',
    recursos: [
      '1-3 usuários',
      '20 pedidos por mês',
      'Requisições, Cotações e Pedidos',
      'Cadastro de fornecedores',
      'Suporte por email (48h)',
    ],
    limites: {
      usuarios: 3,
      pedidos_mes: 20,
      fornecedores: 50,
      produtos: 200,
    },
  },
  PROFISSIONAL: {
    slug: 'PROFISSIONAL',
    nome: 'Business',
    preco_mensal: 39700, // centavos
    preco_anual: 404660, // centavos (15% desconto)
    descricao: 'Para empresas que precisam de controle total de suprimentos',
    recursos: [
      '5-20 usuários',
      '100 pedidos por mês',
      'Gestão de Estoque',
      'Contratos e Notas Fiscais',
      'Workflow de Aprovação',
      'Histórico de Preços',
      'Avaliação de Fornecedores',
      'Dashboard com KPIs',
      'Suporte prioritário (24h)',
    ],
    limites: {
      usuarios: 20,
      pedidos_mes: 100,
      fornecedores: 999999,
      produtos: 999999,
    },
    popular: true,
  },
  ENTERPRISE: {
    slug: 'ENTERPRISE',
    nome: 'Enterprise',
    preco_mensal: 99700, // centavos (a partir de)
    preco_anual: 1016380, // centavos (15% desconto)
    descricao: 'Solução completa com suporte dedicado e customizações',
    recursos: [
      'Usuários ilimitados',
      'Pedidos ilimitados',
      'Todas funcionalidades do Business',
      'API dedicada',
      'Integrações personalizadas',
      'Customizações exclusivas',
      'Gerente de conta dedicado',
      'Suporte 24/7 com SLA 99.9%',
      'Treinamento presencial',
      'Consultoria em processos',
    ],
    limites: {
      usuarios: 999999,
      pedidos_mes: 999999,
      fornecedores: 999999,
      produtos: 999999,
    },
  },
} as const

// Helper para formatar preço
export function formatPrice(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100)
}

// Helper para calcular desconto anual
export function getAnnualDiscount(mensal: number, anual: number): number {
  return Math.round((1 - anual / (mensal * 12)) * 100)
}

// Preços formatados para exibição
export const PRICING_DISPLAY = {
  BASICO: {
    ...PRICING.BASICO,
    preco_mensal_formatado: formatPrice(PRICING.BASICO.preco_mensal),
    preco_anual_formatado: formatPrice(PRICING.BASICO.preco_anual / 12),
    preco_anual_total: formatPrice(PRICING.BASICO.preco_anual),
    desconto_anual: getAnnualDiscount(PRICING.BASICO.preco_mensal, PRICING.BASICO.preco_anual),
  },
  PROFISSIONAL: {
    ...PRICING.PROFISSIONAL,
    preco_mensal_formatado: formatPrice(PRICING.PROFISSIONAL.preco_mensal),
    preco_anual_formatado: formatPrice(PRICING.PROFISSIONAL.preco_anual / 12),
    preco_anual_total: formatPrice(PRICING.PROFISSIONAL.preco_anual),
    desconto_anual: getAnnualDiscount(PRICING.PROFISSIONAL.preco_mensal, PRICING.PROFISSIONAL.preco_anual),
  },
  ENTERPRISE: {
    ...PRICING.ENTERPRISE,
    preco_mensal_formatado: `A partir de ${formatPrice(PRICING.ENTERPRISE.preco_mensal)}`,
    preco_anual_formatado: 'Sob consulta',
    preco_anual_total: formatPrice(PRICING.ENTERPRISE.preco_anual),
    desconto_anual: getAnnualDiscount(PRICING.ENTERPRISE.preco_mensal, PRICING.ENTERPRISE.preco_anual),
  },
}
