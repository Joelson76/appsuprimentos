-- ==========================================
-- FEATURE: Suporte a Filiais (Multi-CNPJ)
-- Permite que um tenant tenha matriz + filiais
-- Data: 2026-06-19
-- ==========================================

-- 1. Criar tabela de filiais
CREATE TABLE IF NOT EXISTS filiais (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Dados da filial
  cnpj          TEXT NOT NULL UNIQUE,
  nome          TEXT NOT NULL,
  nome_fantasia TEXT,

  -- Endereço
  cep           TEXT,
  logradouro    TEXT,
  numero        TEXT,
  complemento   TEXT,
  bairro        TEXT,
  cidade        TEXT,
  estado        TEXT,

  -- Controle
  ativa         BOOLEAN NOT NULL DEFAULT TRUE,
  is_matriz     BOOLEAN NOT NULL DEFAULT FALSE, -- identifica a matriz

  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Garantir apenas uma matriz por tenant
  CONSTRAINT uq_tenant_matriz UNIQUE NULLS NOT DISTINCT (tenant_id, is_matriz)
    DEFERRABLE INITIALLY DEFERRED
);

-- Índices
CREATE INDEX idx_filiais_tenant ON filiais(tenant_id);
CREATE INDEX idx_filiais_cnpj ON filiais(cnpj);
CREATE INDEX idx_filiais_ativa ON filiais(ativa) WHERE ativa = true;

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.filiais TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- RLS
ALTER TABLE filiais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "filiais_tenant_policy" ON filiais
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID))
  WITH CHECK (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- 2. Adicionar filial_id nas tabelas principais
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS filial_id UUID REFERENCES filiais(id);
ALTER TABLE requisicoes ADD COLUMN IF NOT EXISTS filial_id UUID REFERENCES filiais(id);
ALTER TABLE cotacoes ADD COLUMN IF NOT EXISTS filial_id UUID REFERENCES filiais(id);
ALTER TABLE ordens_compra ADD COLUMN IF NOT EXISTS filial_id UUID REFERENCES filiais(id);
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS filial_id UUID REFERENCES filiais(id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_filial ON profiles(filial_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_filial ON requisicoes(filial_id);
CREATE INDEX IF NOT EXISTS idx_cotacoes_filial ON cotacoes(filial_id);
CREATE INDEX IF NOT EXISTS idx_ordens_compra_filial ON ordens_compra(filial_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_filial ON fornecedores(filial_id);

-- 3. Migrar dados existentes (criar filial matriz para cada tenant)
DO $$
DECLARE
  rec RECORD;
  v_filial_id UUID;
BEGIN
  FOR rec IN
    SELECT id, nome, cnpj
    FROM tenants
    WHERE NOT EXISTS (
      SELECT 1 FROM filiais WHERE tenant_id = tenants.id AND is_matriz = true
    )
  LOOP
    -- Criar filial matriz
    INSERT INTO filiais (tenant_id, cnpj, nome, is_matriz, ativa)
    VALUES (rec.id, rec.cnpj, rec.nome || ' - Matriz', true, true)
    RETURNING id INTO v_filial_id;

    -- Vincular todos os profiles, requisições, etc dessa tenant à matriz
    UPDATE profiles SET filial_id = v_filial_id WHERE tenant_id = rec.id AND filial_id IS NULL;
    UPDATE requisicoes SET filial_id = v_filial_id WHERE tenant_id = rec.id AND filial_id IS NULL;
    UPDATE cotacoes SET filial_id = v_filial_id WHERE tenant_id = rec.id AND filial_id IS NULL;
    UPDATE ordens_compra SET filial_id = v_filial_id WHERE tenant_id = rec.id AND filial_id IS NULL;
    UPDATE fornecedores SET filial_id = v_filial_id WHERE tenant_id = rec.id AND filial_id IS NULL;

    RAISE NOTICE 'Filial matriz criada para tenant: % (CNPJ: %)', rec.nome, rec.cnpj;
  END LOOP;
END $$;

-- 4. Função para validar CNPJ (simplificada)
CREATE OR REPLACE FUNCTION validar_cnpj(cnpj TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Remove caracteres não numéricos
  cnpj := regexp_replace(cnpj, '[^0-9]', '', 'g');

  -- Valida tamanho
  IF length(cnpj) != 14 THEN
    RETURN FALSE;
  END IF;

  -- Aqui você pode adicionar validação completa do dígito verificador
  -- Por ora, aceita qualquer CNPJ de 14 dígitos
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Trigger para validar CNPJ antes de inserir
CREATE OR REPLACE FUNCTION trg_validar_cnpj_filial()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT validar_cnpj(NEW.cnpj) THEN
    RAISE EXCEPTION 'CNPJ inválido: %', NEW.cnpj;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_cnpj_before_insert
  BEFORE INSERT OR UPDATE ON filiais
  FOR EACH ROW
  EXECUTE FUNCTION trg_validar_cnpj_filial();

-- 6. View para facilitar consultas
CREATE OR REPLACE VIEW vw_filiais_completo AS
SELECT
  f.id,
  f.tenant_id,
  f.cnpj,
  f.nome,
  f.nome_fantasia,
  f.is_matriz,
  f.ativa,
  f.cidade,
  f.estado,
  t.nome as tenant_nome,
  -- Contar recursos por filial
  (SELECT COUNT(*) FROM profiles WHERE filial_id = f.id) as total_usuarios,
  (SELECT COUNT(*) FROM requisicoes WHERE filial_id = f.id) as total_requisicoes,
  (SELECT COUNT(*) FROM ordens_compra WHERE filial_id = f.id) as total_pedidos
FROM filiais f
INNER JOIN tenants t ON f.tenant_id = t.id;

GRANT SELECT ON vw_filiais_completo TO authenticated;

-- ==========================================
-- VERIFICAÇÃO
-- ==========================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM filiais;

  RAISE NOTICE '================================================';
  RAISE NOTICE 'SISTEMA DE FILIAIS CONFIGURADO';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Tabela filiais criada';
  RAISE NOTICE '✅ Colunas filial_id adicionadas';
  RAISE NOTICE '✅ % filiais criadas (matrizes migradas)', v_count;
  RAISE NOTICE '✅ RLS e políticas configuradas';
  RAISE NOTICE '✅ Validação de CNPJ ativa';
  RAISE NOTICE '================================================';
END $$;
