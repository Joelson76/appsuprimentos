-- ==========================================
-- FEATURE 4: Import NF-e XML
-- ==========================================

-- Tabela para armazenar XMLs importados
CREATE TABLE nfe_importadas (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id),
  nota_fiscal_id     UUID REFERENCES notas_fiscais(id),

  -- Dados do XML
  chave_acesso       TEXT NOT NULL UNIQUE,
  numero_nfe         TEXT NOT NULL,
  serie              TEXT,
  data_emissao       DATE NOT NULL,
  data_entrada       DATE,

  -- Fornecedor
  fornecedor_id      UUID REFERENCES fornecedores(id),
  fornecedor_cnpj    TEXT NOT NULL,
  fornecedor_nome    TEXT NOT NULL,

  -- Valores
  valor_produtos     NUMERIC(15,2) NOT NULL,
  valor_total        NUMERIC(15,2) NOT NULL,
  valor_icms         NUMERIC(15,2),
  valor_ipi          NUMERIC(15,2),

  -- XML completo
  xml_content        TEXT NOT NULL,
  xml_hash           TEXT NOT NULL, -- SHA256 do XML

  -- Itens parseados (JSONB)
  itens              JSONB NOT NULL,

  -- Status
  status             TEXT NOT NULL DEFAULT 'IMPORTADO' CHECK (status IN ('IMPORTADO', 'PROCESSADO', 'ERRO', 'DUPLICADO')),
  erro_msg           TEXT,

  importado_por      UUID NOT NULL REFERENCES profiles(id),
  importado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processado_em      TIMESTAMPTZ
);

CREATE INDEX idx_nfe_importadas_chave ON nfe_importadas(chave_acesso);
CREATE INDEX idx_nfe_importadas_fornecedor ON nfe_importadas(tenant_id, fornecedor_id);
CREATE INDEX idx_nfe_importadas_status ON nfe_importadas(tenant_id, status);

ALTER TABLE nfe_importadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nfe_importadas_tenant" ON nfe_importadas
  FOR ALL
  USING (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID)
  WITH CHECK (tenant_id = ((auth.jwt()->>'user_metadata')::jsonb->>'tenant_id')::UUID);

-- Função para processar XML importado
CREATE OR REPLACE FUNCTION processar_nfe_importada(
  p_nfe_importada_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_nfe RECORD;
  v_fornecedor_id UUID;
  v_nota_fiscal_id UUID;
  v_pedido_vinculado UUID;
  v_produto_id UUID;
  v_item JSONB;
BEGIN
  -- Busca NF-e importada
  SELECT * INTO v_nfe FROM nfe_importadas WHERE id = p_nfe_importada_id;

  IF v_nfe IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NF-e não encontrada');
  END IF;

  -- Busca ou cria fornecedor
  SELECT id INTO v_fornecedor_id
  FROM fornecedores
  WHERE tenant_id = v_nfe.tenant_id
    AND cnpj = v_nfe.fornecedor_cnpj;

  IF v_fornecedor_id IS NULL THEN
    -- Cria fornecedor novo
    INSERT INTO fornecedores (
      tenant_id, razao_social, cnpj, status
    ) VALUES (
      v_nfe.tenant_id, v_nfe.fornecedor_nome, v_nfe.fornecedor_cnpj, 'EM_HOMOLOGACAO'
    )
    RETURNING id INTO v_fornecedor_id;
  END IF;

  -- Atualiza fornecedor_id na importação
  UPDATE nfe_importadas
  SET fornecedor_id = v_fornecedor_id
  WHERE id = p_nfe_importada_id;

  -- Cria nota fiscal
  INSERT INTO notas_fiscais (
    tenant_id, fornecedor_id, numero, serie,
    chave_acesso, data_emissao, data_entrada,
    valor_total, tipo, status, arquivo_url
  ) VALUES (
    v_nfe.tenant_id, v_fornecedor_id, v_nfe.numero_nfe, v_nfe.serie,
    v_nfe.chave_acesso, v_nfe.data_emissao, COALESCE(v_nfe.data_entrada, CURRENT_DATE),
    v_nfe.valor_total, 'ENTRADA', 'PROCESSADA', NULL
  )
  RETURNING id INTO v_nota_fiscal_id;

  -- Vincula nota à importação
  UPDATE nfe_importadas
  SET nota_fiscal_id = v_nota_fiscal_id,
      status = 'PROCESSADO',
      processado_em = NOW()
  WHERE id = p_nfe_importada_id;

  -- Processa itens (tenta vincular a produtos existentes)
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_nfe.itens)
  LOOP
    -- Tenta encontrar produto por código
    SELECT id INTO v_produto_id
    FROM produtos
    WHERE tenant_id = v_nfe.tenant_id
      AND (
        codigo = v_item->>'codigo'
        OR descricao ILIKE '%' || (v_item->>'descricao') || '%'
      )
    LIMIT 1;

    -- Aqui você pode criar itens da NF se necessário
    -- (depende se sua tabela notas_fiscais tem tabela de itens)
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'nota_fiscal_id', v_nota_fiscal_id,
    'fornecedor_id', v_fornecedor_id
  );

EXCEPTION
  WHEN OTHERS THEN
    UPDATE nfe_importadas
    SET status = 'ERRO',
        erro_msg = SQLERRM
    WHERE id = p_nfe_importada_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- View de resumo de importações
CREATE OR REPLACE VIEW vw_nfe_resumo AS
SELECT
  n.id,
  n.tenant_id,
  n.chave_acesso,
  n.numero_nfe,
  n.serie,
  n.data_emissao,
  n.fornecedor_nome,
  n.fornecedor_cnpj,
  f.razao_social as fornecedor_cadastrado,
  n.valor_total,
  n.status,
  n.importado_em,
  p.nome as importado_por_nome,
  jsonb_array_length(n.itens) as qtd_itens
FROM nfe_importadas n
LEFT JOIN fornecedores f ON f.id = n.fornecedor_id
LEFT JOIN profiles p ON p.id = n.importado_por
ORDER BY n.importado_em DESC;
