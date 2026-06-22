-- ==========================================
-- MIGRATION: Classificação de Produtos (SAFE VERSION)
-- Data: 2026-06-22
-- Descrição: Adiciona campo de classificação para produtos
--            Versão segura que verifica existência antes de criar
-- ==========================================

-- Criar ENUM para classificação de produtos (somente se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'classificacao_produto') THEN
    CREATE TYPE classificacao_produto AS ENUM (
      'COMPRAS_DIRETAS',      -- Produtos que entram diretamente na produção/revenda
      'COMPRAS_INDIRETAS',    -- Insumos operacionais (manutenção, limpeza, TI, etc)
      'ATIVOS_IMOBILIZADOS',  -- Bens de capital (máquinas, equipamentos, veículos)
      'USO_IMEDIATO'          -- Consumo direto sem estocagem (serviços, pequenos valores)
    );
  END IF;
END $$;

-- Adicionar coluna classificacao na tabela produtos (somente se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produtos' AND column_name = 'classificacao'
  ) THEN
    ALTER TABLE produtos ADD COLUMN classificacao classificacao_produto;
  END IF;
END $$;

-- Criar índice para facilitar consultas por classificação (somente se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_produtos_classificacao'
  ) THEN
    CREATE INDEX idx_produtos_classificacao ON produtos(classificacao) WHERE classificacao IS NOT NULL;
  END IF;
END $$;

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
