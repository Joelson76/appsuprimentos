-- ==========================================
-- ATUALIZAR PREÇOS DOS PLANOS - OPÇÃO 3 (HÍBRIDA)
-- ==========================================

-- Atualizar valores dos planos
UPDATE planos
SET
  nome = 'Starter',
  preco_centavos = 14700, -- R$ 147,00
  descricao = 'Ideal para pequenas empresas começando a organizar compras',
  recursos = ARRAY[
    '1-3 usuários',
    '20 pedidos por mês',
    'Requisições, Cotações e Pedidos',
    'Cadastro de fornecedores',
    'Suporte por email (48h)'
  ],
  limites = jsonb_build_object(
    'usuarios', 3,
    'pedidos_mes', 20,
    'fornecedores', 50,
    'produtos', 200
  )
WHERE slug = 'BASICO';

UPDATE planos
SET
  nome = 'Business',
  preco_centavos = 39700, -- R$ 397,00
  descricao = 'Para empresas que precisam de controle total de suprimentos',
  recursos = ARRAY[
    '5-20 usuários',
    '100 pedidos por mês',
    'Gestão de Estoque',
    'Contratos e Notas Fiscais',
    'Workflow de Aprovação',
    'Histórico de Preços',
    'Avaliação de Fornecedores',
    'Dashboard com KPIs',
    'Suporte prioritário (24h)'
  ],
  limites = jsonb_build_object(
    'usuarios', 20,
    'pedidos_mes', 100,
    'fornecedores', 999999,
    'produtos', 999999
  ),
  popular = true
WHERE slug = 'PROFISSIONAL';

UPDATE planos
SET
  nome = 'Enterprise',
  preco_centavos = 99700, -- R$ 997,00 (a partir de)
  descricao = 'Solução completa com suporte dedicado e customizações',
  recursos = ARRAY[
    'Usuários ilimitados',
    'Pedidos ilimitados',
    'Todas funcionalidades do Business',
    'API dedicada',
    'Integrações personalizadas',
    'Customizações exclusivas',
    'Gerente de conta dedicado',
    'Suporte 24/7 com SLA 99.9%',
    'Treinamento presencial',
    'Consultoria em processos'
  ],
  limites = jsonb_build_object(
    'usuarios', 999999,
    'pedidos_mes', 999999,
    'fornecedores', 999999,
    'produtos', 999999
  )
WHERE slug = 'ENTERPRISE';

-- Adicionar campo para preço anual (opcional, com desconto)
ALTER TABLE planos
ADD COLUMN IF NOT EXISTS preco_anual_centavos INT;

-- Configurar preços anuais (15% de desconto)
UPDATE planos SET preco_anual_centavos = 149940 WHERE slug = 'BASICO'; -- R$ 1.499,40 (R$ 124,95/mês)
UPDATE planos SET preco_anual_centavos = 404660 WHERE slug = 'PROFISSIONAL'; -- R$ 4.046,60 (R$ 337,22/mês)
UPDATE planos SET preco_anual_centavos = 1016380 WHERE slug = 'ENTERPRISE'; -- R$ 10.163,80 (R$ 846,98/mês)

-- Adicionar comentário
COMMENT ON COLUMN planos.preco_anual_centavos IS 'Preço anual em centavos (já com desconto de ~15%)';

-- Verificar resultados
SELECT
  slug,
  nome,
  preco_centavos / 100.0 as preco_mensal,
  preco_anual_centavos / 100.0 as preco_anual_total,
  ROUND(preco_anual_centavos / 12.0 / 100.0, 2) as preco_anual_mes,
  ROUND((1 - (preco_anual_centavos::NUMERIC / (preco_centavos * 12))) * 100, 0) as desconto_pct,
  popular,
  array_length(recursos, 1) as qtd_recursos
FROM planos
ORDER BY preco_centavos;
