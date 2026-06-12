-- ==========================================
-- FIX: Tabela categorias
-- ==========================================

-- 1. Dropar e recriar policy
DROP POLICY IF EXISTS "categorias_tenant" ON categorias;

CREATE POLICY "categorias_tenant" ON categorias
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 2. Garantir permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON categorias TO authenticated;

-- 3. Inserir categorias padrão se não existirem
INSERT INTO categorias (tenant_id, nome, descricao)
SELECT
  t.id,
  categoria,
  'Categoria padrão'
FROM tenants t
CROSS JOIN unnest(ARRAY[
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
]) AS categoria
WHERE NOT EXISTS (
  SELECT 1 FROM categorias
  WHERE tenant_id = t.id
  AND nome = categoria
);

-- 4. Verificar
SELECT COUNT(*) as total_categorias, t.nome as tenant
FROM categorias c
JOIN tenants t ON t.id = c.tenant_id
GROUP BY t.nome
ORDER BY t.nome;
