-- ==========================================
-- NUMERAÇÃO AUTOMÁTICA
-- REQ-2025-0001, COT-2025-0001, PO-2025-0001
-- ==========================================

-- ==========================================
-- 1. TABELA DE SEQUENCES
-- ==========================================
CREATE TABLE IF NOT EXISTS numeracao_sequences (
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL, -- 'REQ', 'COT', 'PO'
  ano           INT NOT NULL,
  ultimo_numero INT NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, tipo, ano)
);

CREATE INDEX IF NOT EXISTS idx_numeracao_sequences_tenant
  ON numeracao_sequences(tenant_id, tipo, ano);

-- RLS
ALTER TABLE numeracao_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "numeracao_sequences_tenant" ON numeracao_sequences;
CREATE POLICY "numeracao_sequences_tenant" ON numeracao_sequences
  FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- ==========================================
-- 2. FUNÇÃO: Gerar Próximo Número
-- ==========================================
CREATE OR REPLACE FUNCTION gerar_proximo_numero(
  p_tenant_id UUID,
  p_tipo TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_ano INT;
  v_numero INT;
  v_codigo TEXT;
BEGIN
  v_ano := EXTRACT(YEAR FROM NOW());

  -- Lock e incrementa (thread-safe)
  INSERT INTO numeracao_sequences (tenant_id, tipo, ano, ultimo_numero)
  VALUES (p_tenant_id, p_tipo, v_ano, 1)
  ON CONFLICT (tenant_id, tipo, ano)
  DO UPDATE SET ultimo_numero = numeracao_sequences.ultimo_numero + 1
  RETURNING ultimo_numero INTO v_numero;

  -- Formato: REQ-2025-0001
  v_codigo := p_tipo || '-' || v_ano || '-' || LPAD(v_numero::TEXT, 4, '0');

  RETURN v_codigo;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. TRIGGERS
-- ==========================================

-- REQUISIÇÕES
CREATE OR REPLACE FUNCTION trigger_gerar_numero_requisicao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := gerar_proximo_numero(NEW.tenant_id, 'REQ');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- COTAÇÕES
CREATE OR REPLACE FUNCTION trigger_gerar_numero_cotacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := gerar_proximo_numero(NEW.tenant_id, 'COT');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PEDIDOS
CREATE OR REPLACE FUNCTION trigger_gerar_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := gerar_proximo_numero(NEW.tenant_id, 'PO');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 4. APLICAR TRIGGERS
-- ==========================================

-- Requisições
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'requisicoes') THEN
    DROP TRIGGER IF EXISTS trigger_numero_requisicao ON requisicoes;
    CREATE TRIGGER trigger_numero_requisicao
      BEFORE INSERT ON requisicoes
      FOR EACH ROW
      EXECUTE FUNCTION trigger_gerar_numero_requisicao();
    RAISE NOTICE '✅ Trigger: requisicoes';
  END IF;
END $$;

-- Cotações
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'cotacoes') THEN
    DROP TRIGGER IF EXISTS trigger_numero_cotacao ON cotacoes;
    CREATE TRIGGER trigger_numero_cotacao
      BEFORE INSERT ON cotacoes
      FOR EACH ROW
      EXECUTE FUNCTION trigger_gerar_numero_cotacao();
    RAISE NOTICE '✅ Trigger: cotacoes';
  END IF;
END $$;

-- Pedidos
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'pedidos') THEN
    DROP TRIGGER IF EXISTS trigger_numero_pedido ON pedidos;
    CREATE TRIGGER trigger_numero_pedido
      BEFORE INSERT ON pedidos
      FOR EACH ROW
      EXECUTE FUNCTION trigger_gerar_numero_pedido();
    RAISE NOTICE '✅ Trigger: pedidos';
  END IF;
END $$;

-- ==========================================
-- 5. TESTE
-- ==========================================
DO $$
DECLARE
  v_tenant_id UUID;
  v_req TEXT;
  v_cot TEXT;
  v_po TEXT;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;

  IF v_tenant_id IS NOT NULL THEN
    v_req := gerar_proximo_numero(v_tenant_id, 'REQ');
    v_cot := gerar_proximo_numero(v_tenant_id, 'COT');
    v_po := gerar_proximo_numero(v_tenant_id, 'PO');

    RAISE NOTICE '================================================';
    RAISE NOTICE 'TESTE DE NUMERAÇÃO';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ Requisição: %', v_req;
    RAISE NOTICE '✅ Cotação: %', v_cot;
    RAISE NOTICE '✅ Pedido: %', v_po;
    RAISE NOTICE '================================================';
  END IF;
END $$;
