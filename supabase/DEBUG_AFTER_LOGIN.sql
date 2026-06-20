-- Diagnóstico após login

-- 1. Ver seu profile (deve ter tenant_id agora)
SELECT id, tenant_id, nome, perfil
FROM profiles
WHERE id = auth.uid();

-- 2. Ver o JWT (deve ter tenant_id em app_metadata)
SELECT
  auth.uid() as meu_user_id,
  (auth.jwt() ->> 'app_metadata')::jsonb as app_metadata,
  (auth.jwt() ->> 'user_metadata')::jsonb as user_metadata;

-- 3. Testar se consegue ver requisições
SELECT COUNT(*) as minhas_requisicoes
FROM requisicoes
WHERE tenant_id = (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
);

-- 4. Testar a view do dashboard
SELECT *
FROM vw_dashboard_kpis
WHERE tenant_id = (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
);
