-- ==========================================
-- MIGRATION: Classificação de Produtos
-- Data: 2026-06-22
-- Descrição: Adiciona campo de classificação para produtos
--            (Compras Diretas, Compras Indiretas, Ativos Imobilizados, Uso Imediato)
-- ==========================================

-- Criar ENUM para classificação de produtos
CREATE TYPE classificacao_produto AS ENUM (
  'COMPRAS_DIRETAS',      -- Produtos que entram diretamente na produção/revenda
  'COMPRAS_INDIRETAS',    -- Insumos operacionais (manutenção, limpeza, TI, etc)
  'ATIVOS_IMOBILIZADOS',  -- Bens de capital (máquinas, equipamentos, veículos)
  'USO_IMEDIATO'          -- Consumo direto sem estocagem (serviços, pequenos valores)
);

-- Adicionar coluna classificacao na tabela produtos
ALTER TABLE produtos
ADD COLUMN classificacao classificacao_produto;

-- Criar índice para facilitar consultas por classificação
CREATE INDEX idx_produtos_classificacao ON produtos(classificacao) WHERE classificacao IS NOT NULL;

-- Criar view para análise por classificação
CREATE OR REPLACE VIEW vw_produtos_por_classificacao AS
SELECT
  p.tenant_id,
  p.classificacao,
  COUNT(p.id) AS total_produtos,
  COUNT(CASE WHEN p.ativo = true THEN 1 END) AS produtos_ativos,
  COUNT(CASE WHEN p.estoque_atual > 0 THEN 1 END) AS produtos_com_estoque,
  SUM(CASE WHEN p.estoque_atual > 0 THEN p.estoque_atual ELSE 0 END) AS total_estoque,
  SUM(CASE WHEN p.custo_medio IS NOT NULL AND p.estoque_atual > 0
      THEN p.custo_medio * p.estoque_atual ELSE 0 END) AS valor_total_estoque,
  AVG(CASE WHEN p.estoque_atual > 0 THEN p.custo_medio END) AS custo_medio_geral,
  c.nome AS categoria_principal
FROM produtos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.classificacao IS NOT NULL
GROUP BY p.tenant_id, p.classificacao, c.nome;

-- RLS para a view
ALTER VIEW vw_produtos_por_classificacao SET (security_invoker = true);

-- Comentários explicativos
COMMENT ON COLUMN produtos.classificacao IS
'Classificação do produto para gestão de compras:
- COMPRAS_DIRETAS: Produtos que entram diretamente na produção ou revenda
- COMPRAS_INDIRETAS: Insumos operacionais (MRO - Manutenção, Reparo, Operação)
- ATIVOS_IMOBILIZADOS: Bens de capital para investimento (máquinas, equipamentos)
- USO_IMEDIATO: Consumo direto sem estocagem prolongada';

COMMENT ON VIEW vw_produtos_por_classificacao IS
'Resumo de produtos agrupados por classificação com métricas de estoque e valores';
