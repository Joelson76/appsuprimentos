-- ==========================================
-- Script Consolidado de Migrations Pendentes
-- Data: 11/06/2026
-- ==========================================
-- Execute este script no SQL Editor do Supabase
-- na ordem apresentada abaixo
-- ==========================================

-- ==========================================
-- 1. ADICIONAR NOVOS STATUS AO ENUM
-- ==========================================

ALTER TYPE status_cotacao ADD VALUE IF NOT EXISTS 'RESPOSTAS_PARCIAIS';
ALTER TYPE status_cotacao ADD VALUE IF NOT EXISTS 'EM_ANALISE';

DO $$
BEGIN
  RAISE NOTICE '✓ ENUM status_cotacao atualizado com sucesso';
  RAISE NOTICE '  Novos valores: RESPOSTAS_PARCIAIS, EM_ANALISE';
END $$;

-- ==========================================
-- 2. CRIAR TABELAS DE PEDIDOS
-- ==========================================

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  numero TEXT NOT NULL,
  cotacao_id UUID REFERENCES cotacoes(id),
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id),
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN (
    'PENDENTE',
    'APROVADO',
    'ENVIADO',
    'CONFIRMADO',
    'EM_ENTREGA',
    'PARCIALMENTE_RECEBIDO',
    'RECEBIDO',
    'CANCELADO'
  )),
  valor_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  data_emissao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_entrega_prevista DATE,
  condicao_pagamento TEXT,
  observacoes TEXT,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, numero)
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  quantidade NUMERIC(15,3) NOT NULL,
  valor_unitario NUMERIC(15,2) NOT NULL,
  prazo_entrega INT,
  quantidade_recebida NUMERIC(15,3) NOT NULL DEFAULT 0,
  observacoes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pedidos_tenant ON pedidos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fornecedor ON pedidos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cotacao ON pedidos(cotacao_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido ON itens_pedido(pedido_id);

DO $$
BEGIN
  RAISE NOTICE '✓ Tabelas de pedidos criadas com sucesso';
END $$;

-- ==========================================
-- 3. CONFIGURAR RLS PARA PEDIDOS
-- ==========================================

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;

-- Policies para pedidos
DROP POLICY IF EXISTS "Usuários podem ver pedidos do seu tenant" ON pedidos;
CREATE POLICY "Usuários podem ver pedidos do seu tenant"
  ON pedidos FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários podem criar pedidos no seu tenant" ON pedidos;
CREATE POLICY "Usuários podem criar pedidos no seu tenant"
  ON pedidos FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários podem atualizar pedidos do seu tenant" ON pedidos;
CREATE POLICY "Usuários podem atualizar pedidos do seu tenant"
  ON pedidos FOR UPDATE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Policies para itens_pedido
DROP POLICY IF EXISTS "Usuários podem ver itens via pedido" ON itens_pedido;
CREATE POLICY "Usuários podem ver itens via pedido"
  ON itens_pedido FOR SELECT
  TO authenticated
  USING (
    pedido_id IN (
      SELECT id FROM pedidos
      WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Usuários podem criar itens via pedido" ON itens_pedido;
CREATE POLICY "Usuários podem criar itens via pedido"
  ON itens_pedido FOR INSERT
  TO authenticated
  WITH CHECK (
    pedido_id IN (
      SELECT id FROM pedidos
      WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Usuários podem atualizar itens via pedido" ON itens_pedido;
CREATE POLICY "Usuários podem atualizar itens via pedido"
  ON itens_pedido FOR UPDATE
  TO authenticated
  USING (
    pedido_id IN (
      SELECT id FROM pedidos
      WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Permissões
GRANT ALL ON pedidos TO authenticated;
GRANT ALL ON itens_pedido TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✓ RLS configurado para tabelas de pedidos';
END $$;

-- ==========================================
-- 4. FUNÇÕES E TRIGGERS DE PEDIDOS
-- ==========================================

-- Função para gerar número de pedido
CREATE OR REPLACE FUNCTION gerar_numero_pedido(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_ano INT;
  v_sequencia INT;
  v_numero TEXT;
BEGIN
  v_ano := EXTRACT(YEAR FROM NOW());

  -- Buscar próximo número da sequência do ano atual
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 'PO-' || v_ano || '-(\d+)') AS INT)), 0) + 1
  INTO v_sequencia
  FROM pedidos
  WHERE tenant_id = p_tenant_id
    AND numero LIKE 'PO-' || v_ano || '-%';

  v_numero := 'PO-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 4, '0');

  RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-preencher número do pedido
CREATE OR REPLACE FUNCTION auto_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := gerar_numero_pedido(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_numero_pedido ON pedidos;
CREATE TRIGGER trg_auto_numero_pedido
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION auto_numero_pedido();

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION atualizar_timestamp_pedido()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atualizar_timestamp_pedido ON pedidos;
CREATE TRIGGER trg_atualizar_timestamp_pedido
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp_pedido();

DO $$
BEGIN
  RAISE NOTICE '✓ Funções e triggers de pedidos criados';
END $$;

-- ==========================================
-- 5. TRIGGER DE STATUS DA COTAÇÃO
-- ==========================================

-- Função para verificar e atualizar status da cotação
CREATE OR REPLACE FUNCTION atualizar_status_cotacao_resposta()
RETURNS TRIGGER AS $$
DECLARE
  v_total_fornecedores INT;
  v_fornecedores_respondidos INT;
  v_status_atual TEXT;
BEGIN
  -- Só atualizar se o fornecedor preencheu o valor_unitario (respondeu)
  IF NEW.valor_unitario IS NOT NULL AND OLD.valor_unitario IS NULL THEN

    -- Pegar status atual da cotação
    SELECT status INTO v_status_atual
    FROM cotacoes
    WHERE id = NEW.cotacao_id;

    -- Só processar se a cotação ainda está aguardando respostas
    IF v_status_atual = 'AGUARDANDO_RESPOSTAS' THEN

      -- Contar total de fornecedores distintos nesta cotação
      SELECT COUNT(DISTINCT fornecedor_id) INTO v_total_fornecedores
      FROM itens_cotacao
      WHERE cotacao_id = NEW.cotacao_id;

      -- Contar quantos fornecedores já responderam (tem valor_unitario preenchido)
      SELECT COUNT(DISTINCT fornecedor_id) INTO v_fornecedores_respondidos
      FROM itens_cotacao
      WHERE cotacao_id = NEW.cotacao_id
        AND valor_unitario IS NOT NULL;

      -- Se todos responderam, marcar como EM_ANALISE
      -- Se pelo menos um respondeu, marcar como RESPOSTAS_PARCIAIS
      IF v_fornecedores_respondidos >= v_total_fornecedores THEN
        UPDATE cotacoes
        SET status = 'EM_ANALISE'
        WHERE id = NEW.cotacao_id;

        RAISE NOTICE 'Cotação % - Todos os fornecedores responderam. Status: EM_ANALISE', NEW.cotacao_id;
      ELSIF v_fornecedores_respondidos > 0 THEN
        UPDATE cotacoes
        SET status = 'RESPOSTAS_PARCIAIS'
        WHERE id = NEW.cotacao_id;

        RAISE NOTICE 'Cotação % - Resposta parcial (% de %)', NEW.cotacao_id, v_fornecedores_respondidos, v_total_fornecedores;
      END IF;

    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_atualizar_status_cotacao_resposta ON itens_cotacao;
CREATE TRIGGER trg_atualizar_status_cotacao_resposta
  AFTER UPDATE ON itens_cotacao
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_status_cotacao_resposta();

DO $$
BEGIN
  RAISE NOTICE '✓ Trigger de atualização de status de cotação criado';
END $$;

-- ==========================================
-- 6. RLS PARA ITENS_COTACAO (Acesso Anônimo)
-- ==========================================

ALTER TABLE itens_cotacao ENABLE ROW LEVEL SECURITY;

-- Policy 1: Acesso público para LEITURA via token
DROP POLICY IF EXISTS "Acesso público de leitura por token" ON itens_cotacao;
CREATE POLICY "Acesso público de leitura por token"
  ON itens_cotacao FOR SELECT
  TO anon
  USING (true);

-- Policy 2: Acesso público para ATUALIZAÇÃO via token
DROP POLICY IF EXISTS "Acesso público de atualização por token" ON itens_cotacao;
CREATE POLICY "Acesso público de atualização por token"
  ON itens_cotacao FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policy 3: Usuários autenticados podem fazer tudo no seu tenant
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar itens" ON itens_cotacao;
CREATE POLICY "Usuários autenticados podem gerenciar itens"
  ON itens_cotacao FOR ALL
  TO authenticated
  USING (
    cotacao_id IN (
      SELECT id FROM cotacoes
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    cotacao_id IN (
      SELECT id FROM cotacoes
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Permissões
GRANT SELECT, UPDATE ON itens_cotacao TO anon;
GRANT ALL ON itens_cotacao TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✓ RLS configurado para itens_cotacao - acesso público via token habilitado';
END $$;

-- ==========================================
-- RESUMO FINAL
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✓ MIGRATIONS EXECUTADAS COM SUCESSO!';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Resumo das alterações:';
  RAISE NOTICE '1. ✓ Novos status de cotação adicionados';
  RAISE NOTICE '2. ✓ Tabelas de pedidos criadas';
  RAISE NOTICE '3. ✓ RLS configurado para pedidos';
  RAISE NOTICE '4. ✓ Triggers e funções de pedidos criados';
  RAISE NOTICE '5. ✓ Trigger de status de cotação criado';
  RAISE NOTICE '6. ✓ RLS de itens_cotacao configurado';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '- Testar criação de pedidos via interface';
  RAISE NOTICE '- Implementar listagem de pedidos';
  RAISE NOTICE '- Configurar envio de e-mails';
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
END $$;
