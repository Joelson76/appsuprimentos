-- ==========================================
-- CRIAR TABELA: categorias
-- ==========================================

CREATE TABLE IF NOT EXISTS categorias (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  nome          TEXT NOT NULL,
  descricao     TEXT,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at
CREATE TRIGGER categorias_updated_at
  BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- RLS
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias_tenant" ON categorias
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON categorias TO authenticated;

-- Inserir categorias padrão (exemplos)
INSERT INTO categorias (tenant_id, nome, descricao)
SELECT
  t.id,
  unnest(ARRAY[
    'Matéria Prima',
    'Insumos',
    'Embalagens',
    'Material de Escritório',
    'EPI - Equipamentos de Proteção',
    'Ferramentas',
    'Produtos Acabados',
    'Componentes',
    'Material de Limpeza',
    'Outros'
  ]),
  'Categoria padrão'
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM categorias WHERE tenant_id = t.id
);

-- Verificar
SELECT c.nome, t.nome as tenant
FROM categorias c
JOIN tenants t ON t.id = c.tenant_id
ORDER BY t.nome, c.nome;
