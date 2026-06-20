-- Diagnosticar JWT e tenant_id
-- Execute este script enquanto estiver logado no sistema

-- Ver o JWT completo
SELECT auth.jwt();

-- Ver user_metadata
SELECT (auth.jwt() ->> 'user_metadata')::jsonb;

-- Ver app_metadata
SELECT (auth.jwt() ->> 'app_metadata')::jsonb;

-- Tentar extrair tenant_id de diferentes lugares
SELECT
  'user_metadata' as source,
  ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'tenant_id')::text as tenant_id
UNION ALL
SELECT
  'app_metadata' as source,
  ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'tenant_id')::text as tenant_id
UNION ALL
SELECT
  'direct' as source,
  (auth.jwt() ->> 'tenant_id')::text as tenant_id;

-- Ver seu profile
SELECT id, tenant_id, nome, perfil
FROM profiles
WHERE id = auth.uid();
