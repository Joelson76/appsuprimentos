-- Dar permissões em todas as views do dashboard

-- View principal do dashboard
GRANT SELECT ON vw_dashboard_kpis TO authenticated;
GRANT SELECT ON vw_dashboard_kpis TO anon;

-- Outras views (se existirem)
GRANT SELECT ON vw_evolucao_compras_mensal TO authenticated;
GRANT SELECT ON vw_evolucao_compras_mensal TO anon;

GRANT SELECT ON vw_top_fornecedores TO authenticated;
GRANT SELECT ON vw_top_fornecedores TO anon;

-- Views que estão dando erro
DO $$
BEGIN
  -- Tentar dar permissão em vw_produtos_criticos se existir
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'vw_produtos_criticos') THEN
    GRANT SELECT ON vw_produtos_criticos TO authenticated;
    GRANT SELECT ON vw_produtos_criticos TO anon;
  END IF;
END $$;

-- Verificar permissões
SELECT
  schemaname,
  viewname,
  viewowner
FROM pg_views
WHERE schemaname = 'public'
AND viewname LIKE 'vw_%'
ORDER BY viewname;
