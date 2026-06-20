-- Diagnóstico do Dashboard
-- Execute este script para verificar por que os KPIs estão zerados

-- 1. Verificar se a view existe
SELECT EXISTS (
  SELECT 1
  FROM information_schema.views
  WHERE table_schema = 'public'
  AND table_name = 'vw_dashboard_kpis'
) as view_existe;

-- 2. Ver estrutura da view
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vw_dashboard_kpis'
ORDER BY ordinal_position;

-- 3. Buscar dados da view para seu tenant
SELECT *
FROM vw_dashboard_kpis
WHERE tenant_id = (
  SELECT tenant_id
  FROM profiles
  WHERE id = auth.uid()
);

-- 4. Contar requisições diretamente
SELECT
  'requisicoes' as tabela,
  COUNT(*) as total
FROM requisicoes
WHERE tenant_id = (
  SELECT tenant_id
  FROM profiles
  WHERE id = auth.uid()
);

-- 5. Contar pedidos diretamente
SELECT
  'ordens_compra' as tabela,
  COUNT(*) as total,
  SUM(valor_total) as valor_total
FROM ordens_compra
WHERE tenant_id = (
  SELECT tenant_id
  FROM profiles
  WHERE id = auth.uid()
);

-- 6. Contar fornecedores diretamente
SELECT
  'fornecedores' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'ATIVO' THEN 1 END) as ativos
FROM fornecedores
WHERE tenant_id = (
  SELECT tenant_id
  FROM profiles
  WHERE id = auth.uid()
);

-- 7. Verificar se há dados sem tenant_id (erro de migração)
SELECT
  'requisicoes_sem_tenant' as problema,
  COUNT(*) as quantidade
FROM requisicoes
WHERE tenant_id IS NULL;

SELECT
  'ordens_compra_sem_tenant' as problema,
  COUNT(*) as quantidade
FROM ordens_compra
WHERE tenant_id IS NULL;
