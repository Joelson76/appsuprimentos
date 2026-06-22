-- ==========================================
-- MIGRATION: Vincular Produtos em Requisições, Cotações e Pedidos
-- Data: 2026-06-22
-- Descrição: Adiciona produto_id nas tabelas de itens para usar apenas produtos cadastrados
-- ==========================================

-- ==========================================
-- 1. ITENS DE REQUISIÇÃO
-- ==========================================

-- Adicionar coluna produto_id (somente se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itens_requisicao' AND column_name = 'produto_id'
  ) THEN
    ALTER TABLE itens_requisicao ADD COLUMN produto_id UUID REFERENCES produtos(id);
  END IF;
END $$;

-- Criar índice (somente se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_itens_requisicao_produto'
  ) THEN
    CREATE INDEX idx_itens_requisicao_produto ON itens_requisicao(produto_id);
  END IF;
END $$;

-- Tornar descricao opcional (será preenchida automaticamente pelo produto)
-- Manter compatibilidade com dados antigos
ALTER TABLE itens_requisicao
ALTER COLUMN descricao DROP NOT NULL;

-- Adicionar constraint: deve ter produto_id OU descricao
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_itens_req_produto_ou_descricao'
  ) THEN
    ALTER TABLE itens_requisicao
    ADD CONSTRAINT chk_itens_req_produto_ou_descricao
    CHECK (produto_id IS NOT NULL OR descricao IS NOT NULL);
  END IF;
END $$;

-- ==========================================
-- 2. ITENS DE COTAÇÃO
-- ==========================================

-- Verificar se a tabela existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'itens_cotacao') THEN
    -- Adicionar coluna produto_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'itens_cotacao' AND column_name = 'produto_id'
    ) THEN
      ALTER TABLE itens_cotacao
      ADD COLUMN produto_id UUID REFERENCES produtos(id);

      CREATE INDEX idx_itens_cotacao_produto ON itens_cotacao(produto_id);
    END IF;

    -- Tornar descricao opcional
    ALTER TABLE itens_cotacao
    ALTER COLUMN descricao DROP NOT NULL;

    -- Adicionar constraint
    ALTER TABLE itens_cotacao
    DROP CONSTRAINT IF EXISTS chk_itens_cot_produto_ou_descricao;

    ALTER TABLE itens_cotacao
    ADD CONSTRAINT chk_itens_cot_produto_ou_descricao
    CHECK (produto_id IS NOT NULL OR descricao IS NOT NULL);
  END IF;
END $$;

-- ==========================================
-- 3. ITENS DE PEDIDO (ORDENS DE COMPRA)
-- ==========================================

-- Verificar se a tabela existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'itens_pedido') THEN
    -- Adicionar coluna produto_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'itens_pedido' AND column_name = 'produto_id'
    ) THEN
      ALTER TABLE itens_pedido
      ADD COLUMN produto_id UUID REFERENCES produtos(id);

      CREATE INDEX idx_itens_pedido_produto ON itens_pedido(produto_id);
    END IF;

    -- Tornar descricao opcional
    ALTER TABLE itens_pedido
    ALTER COLUMN descricao DROP NOT NULL;

    -- Adicionar constraint
    ALTER TABLE itens_pedido
    DROP CONSTRAINT IF EXISTS chk_itens_ped_produto_ou_descricao;

    ALTER TABLE itens_pedido
    ADD CONSTRAINT chk_itens_ped_produto_ou_descricao
    CHECK (produto_id IS NOT NULL OR descricao IS NOT NULL);
  END IF;
END $$;

-- ==========================================
-- 4. VIEWS AUXILIARES
-- ==========================================

-- View: Itens de Requisição com dados do produto
CREATE OR REPLACE VIEW vw_itens_requisicao_completo AS
SELECT
  ir.*,
  p.descricao AS produto_descricao,
  p.codigo AS produto_codigo,
  p.unidade AS produto_unidade,
  p.categoria_id AS produto_categoria_id,
  p.classificacao AS produto_classificacao,
  p.custo_medio AS produto_custo_medio,
  p.estoque_atual AS produto_estoque_atual,
  COALESCE(ir.descricao, p.descricao) AS descricao_final,
  COALESCE(ir.unidade, p.unidade) AS unidade_final
FROM itens_requisicao ir
LEFT JOIN produtos p ON ir.produto_id = p.id;

-- RLS para a view
ALTER VIEW vw_itens_requisicao_completo SET (security_invoker = true);

-- View: Análise de produtos mais requisitados
CREATE OR REPLACE VIEW vw_produtos_mais_requisitados AS
SELECT
  p.id AS produto_id,
  p.descricao,
  p.codigo,
  p.classificacao,
  p.tenant_id,
  COUNT(DISTINCT ir.requisicao_id) AS total_requisicoes,
  SUM(ir.quantidade) AS quantidade_total,
  AVG(ir.quantidade) AS quantidade_media,
  MAX(r.criado_em) AS ultima_requisicao
FROM produtos p
INNER JOIN itens_requisicao ir ON ir.produto_id = p.id
INNER JOIN requisicoes r ON r.id = ir.requisicao_id
WHERE p.ativo = true
GROUP BY p.id, p.descricao, p.codigo, p.classificacao, p.tenant_id
ORDER BY total_requisicoes DESC;

-- RLS para a view
ALTER VIEW vw_produtos_mais_requisitados SET (security_invoker = true);

-- ==========================================
-- 5. FUNÇÃO: Validar disponibilidade de estoque
-- ==========================================

CREATE OR REPLACE FUNCTION validar_estoque_requisicao(
  p_produto_id UUID,
  p_quantidade NUMERIC
)
RETURNS JSONB AS $$
DECLARE
  v_estoque_atual NUMERIC;
  v_descricao TEXT;
  v_unidade TEXT;
BEGIN
  -- Buscar dados do produto
  SELECT estoque_atual, descricao, unidade
  INTO v_estoque_atual, v_descricao, v_unidade
  FROM produtos
  WHERE id = p_produto_id;

  -- Se produto não encontrado
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'disponivel', false,
      'motivo', 'Produto não encontrado'
    );
  END IF;

  -- Verificar se há estoque suficiente
  IF v_estoque_atual < p_quantidade THEN
    RETURN jsonb_build_object(
      'disponivel', false,
      'motivo', format('Estoque insuficiente. Disponível: %s %s', v_estoque_atual, v_unidade),
      'estoque_atual', v_estoque_atual,
      'quantidade_solicitada', p_quantidade,
      'deficit', p_quantidade - v_estoque_atual
    );
  END IF;

  -- Estoque OK
  RETURN jsonb_build_object(
    'disponivel', true,
    'estoque_atual', v_estoque_atual,
    'quantidade_solicitada', p_quantidade,
    'saldo_apos', v_estoque_atual - p_quantidade
  );
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- COMENTÁRIOS
-- ==========================================

COMMENT ON COLUMN itens_requisicao.produto_id IS
'Referência ao produto cadastrado. Quando preenchido, descricao e unidade são opcionais (serão copiados do produto)';

COMMENT ON VIEW vw_itens_requisicao_completo IS
'View que combina dados do item com dados do produto cadastrado';

COMMENT ON VIEW vw_produtos_mais_requisitados IS
'Análise de produtos mais solicitados via requisições';

COMMENT ON FUNCTION validar_estoque_requisicao IS
'Valida se há estoque disponível para atender uma requisição';
