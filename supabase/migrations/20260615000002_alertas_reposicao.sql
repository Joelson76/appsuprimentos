-- ==========================================
-- FEATURE 2: Alertas de Reposição Automática
-- ==========================================

-- Tabela de alertas de estoque
CREATE TABLE alertas_estoque (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  produto_id       UUID NOT NULL REFERENCES produtos(id),
  tipo             TEXT NOT NULL CHECK (tipo IN ('ESTOQUE_MINIMO', 'RUPTURA', 'EXCESSO')),
  estoque_atual    NUMERIC(15,3) NOT NULL,
  estoque_minimo   NUMERIC(15,3),
  estoque_maximo   NUMERIC(15,3),
  prioridade       TEXT NOT NULL DEFAULT 'MEDIA' CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA')),
  status           TEXT NOT NULL DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'EM_REPOSICAO', 'RESOLVIDO', 'IGNORADO')),
  requisicao_id    UUID REFERENCES requisicoes(id),
  resolvido_em     TIMESTAMPTZ,
  resolvido_por    UUID REFERENCES profiles(id),
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alertas_estoque_produto ON alertas_estoque(produto_id);
CREATE INDEX idx_alertas_estoque_status ON alertas_estoque(tenant_id, status, prioridade);
CREATE INDEX idx_alertas_estoque_criado ON alertas_estoque(tenant_id, criado_em DESC);

ALTER TABLE alertas_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alertas_estoque_tenant" ON alertas_estoque
  FOR ALL
  USING (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID)
  WITH CHECK (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID);

-- Função para gerar alertas automaticamente
CREATE OR REPLACE FUNCTION verificar_alertas_estoque()
RETURNS TRIGGER AS $$
DECLARE
  v_alerta_existente UUID;
  v_prioridade TEXT;
BEGIN
  -- Só processa se tem estoque_minimo_alerta configurado
  IF NEW.estoque_minimo_alerta IS NOT NULL THEN

    -- Determina prioridade
    IF NEW.estoque_atual = 0 THEN
      v_prioridade := 'CRITICA'; -- Ruptura total
    ELSIF NEW.estoque_atual < (NEW.estoque_minimo_alerta * 0.5) THEN
      v_prioridade := 'ALTA'; -- Menos de 50% do mínimo
    ELSIF NEW.estoque_atual < NEW.estoque_minimo_alerta THEN
      v_prioridade := 'MEDIA'; -- Abaixo do mínimo
    ELSE
      v_prioridade := NULL; -- Tudo OK
    END IF;

    -- Se está abaixo do mínimo
    IF v_prioridade IS NOT NULL THEN
      -- Verifica se já existe alerta ABERTO para este produto
      SELECT id INTO v_alerta_existente
      FROM alertas_estoque
      WHERE produto_id = NEW.id
        AND status = 'ABERTO'
      LIMIT 1;

      -- Se não existe, cria novo alerta
      IF v_alerta_existente IS NULL THEN
        INSERT INTO alertas_estoque (
          tenant_id, produto_id, tipo, estoque_atual,
          estoque_minimo, prioridade
        ) VALUES (
          NEW.tenant_id,
          NEW.id,
          CASE WHEN NEW.estoque_atual = 0 THEN 'RUPTURA' ELSE 'ESTOQUE_MINIMO' END,
          NEW.estoque_atual,
          NEW.estoque_minimo_alerta,
          v_prioridade
        );
      ELSE
        -- Atualiza alerta existente com novo estoque
        UPDATE alertas_estoque
        SET estoque_atual = NEW.estoque_atual,
            prioridade = v_prioridade,
            atualizado_em = NOW()
        WHERE id = v_alerta_existente;
      END IF;

    ELSE
      -- Estoque normalizado - resolver alertas abertos
      UPDATE alertas_estoque
      SET status = 'RESOLVIDO',
          resolvido_em = NOW()
      WHERE produto_id = NEW.id
        AND status = 'ABERTO';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_alertas_estoque
  AFTER UPDATE OF estoque_atual ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION verificar_alertas_estoque();

-- View consolidada de produtos críticos
CREATE OR REPLACE VIEW vw_produtos_criticos AS
SELECT
  p.id as produto_id,
  p.tenant_id,
  p.descricao,
  p.codigo,
  p.estoque_atual,
  p.estoque_minimo_alerta,
  p.unidade,
  c.nome as categoria,
  a.id as alerta_id,
  a.prioridade,
  a.tipo as tipo_alerta,
  a.criado_em as alerta_desde,
  CASE
    WHEN p.estoque_atual = 0 THEN 'RUPTURA'
    WHEN p.estoque_atual < p.estoque_minimo_alerta * 0.5 THEN 'CRÍTICO'
    WHEN p.estoque_atual < p.estoque_minimo_alerta THEN 'BAIXO'
    ELSE 'NORMAL'
  END as nivel_estoque
FROM produtos p
LEFT JOIN categorias c ON c.id = p.categoria_id
LEFT JOIN alertas_estoque a ON a.produto_id = p.id AND a.status = 'ABERTO'
WHERE p.ativo = true
  AND p.estoque_minimo_alerta IS NOT NULL
  AND p.estoque_atual <= p.estoque_minimo_alerta
ORDER BY
  CASE a.prioridade
    WHEN 'CRITICA' THEN 1
    WHEN 'ALTA' THEN 2
    WHEN 'MEDIA' THEN 3
    ELSE 4
  END,
  p.estoque_atual ASC;
