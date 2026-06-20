-- Diagnóstico Consolidado do Tenant ID

WITH
  meu_profile AS (
    SELECT tenant_id, nome, perfil
    FROM profiles
    WHERE id = auth.uid()
  ),
  contagens AS (
    SELECT
      (SELECT COUNT(*) FROM requisicoes) as total_requisicoes,
      (SELECT COUNT(*) FROM ordens_compra) as total_pedidos,
      (SELECT COUNT(*) FROM fornecedores) as total_fornecedores,
      (SELECT COUNT(*) FROM cotacoes) as total_cotacoes,
      (SELECT COUNT(DISTINCT tenant_id) FROM requisicoes) as tenants_com_requisicoes,
      (SELECT tenant_id FROM requisicoes LIMIT 1) as tenant_id_primeira_requisicao
  )
SELECT
  '🔑 MEU TENANT_ID' as diagnostico,
  (SELECT tenant_id::text FROM meu_profile) as valor
UNION ALL
SELECT
  '👤 MEU PERFIL',
  (SELECT perfil::text FROM meu_profile)
UNION ALL
SELECT
  '📊 TOTAL REQUISIÇÕES NO SISTEMA',
  (SELECT total_requisicoes::text FROM contagens)
UNION ALL
SELECT
  '📦 TOTAL PEDIDOS NO SISTEMA',
  (SELECT total_pedidos::text FROM contagens)
UNION ALL
SELECT
  '🏢 TOTAL FORNECEDORES NO SISTEMA',
  (SELECT total_fornecedores::text FROM contagens)
UNION ALL
SELECT
  '💰 TOTAL COTAÇÕES NO SISTEMA',
  (SELECT total_cotacoes::text FROM contagens)
UNION ALL
SELECT
  '🔢 DIFERENTES TENANTS NOS DADOS',
  (SELECT tenants_com_requisicoes::text FROM contagens)
UNION ALL
SELECT
  '🎯 TENANT_ID DOS DADOS',
  (SELECT tenant_id_primeira_requisicao::text FROM contagens)
UNION ALL
SELECT
  '⚠️ PROBLEMA IDENTIFICADO',
  CASE
    WHEN (SELECT tenant_id FROM meu_profile) IS NULL THEN '❌ SEU TENANT_ID ESTÁ NULL'
    WHEN (SELECT tenant_id FROM meu_profile) != (SELECT tenant_id_primeira_requisicao FROM contagens)
    THEN '❌ SEU TENANT_ID É DIFERENTE DOS DADOS!'
    ELSE '✅ TENANT_ID CORRETO'
  END
UNION ALL
SELECT
  '📝 REQUISIÇÕES COM MEU TENANT',
  (SELECT COUNT(*)::text FROM requisicoes WHERE tenant_id = (SELECT tenant_id FROM meu_profile))
UNION ALL
SELECT
  '📦 PEDIDOS COM MEU TENANT',
  (SELECT COUNT(*)::text FROM ordens_compra WHERE tenant_id = (SELECT tenant_id FROM meu_profile))
UNION ALL
SELECT
  '🏢 FORNECEDORES COM MEU TENANT',
  (SELECT COUNT(*)::text FROM fornecedores WHERE tenant_id = (SELECT tenant_id FROM meu_profile));
