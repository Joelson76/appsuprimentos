-- Diagnosticar problema com tenant_id

-- 1. Ver seu tenant_id no profile
SELECT
  id as user_id,
  tenant_id,
  nome,
  perfil
FROM profiles
WHERE id = auth.uid();

-- 2. Ver tenant_id no JWT
SELECT
  'user_metadata' as source,
  ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'tenant_id')::text as tenant_id
UNION ALL
SELECT
  'app_metadata' as source,
  ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'tenant_id')::text as tenant_id
UNION ALL
SELECT
  'raw claim' as source,
  (auth.jwt() ->> 'tenant_id')::text as tenant_id;

-- 3. Contar TODAS as requisições (sem filtro de tenant)
SELECT
  'Total no sistema' as tipo,
  COUNT(*) as quantidade
FROM requisicoes;

-- 4. Ver requisições agrupadas por tenant_id
SELECT
  tenant_id,
  COUNT(*) as quantidade_requisicoes
FROM requisicoes
GROUP BY tenant_id;

-- 5. Ver fornecedores agrupados por tenant_id
SELECT
  tenant_id,
  COUNT(*) as quantidade_fornecedores
FROM fornecedores
GROUP BY tenant_id;

-- 6. Ver pedidos agrupados por tenant_id
SELECT
  tenant_id,
  COUNT(*) as quantidade_pedidos
FROM ordens_compra
GROUP BY tenant_id;

-- 7. Comparar: tenant_id do profile vs tenant_id dos dados
SELECT
  'MEU TENANT' as info,
  (SELECT tenant_id FROM profiles WHERE id = auth.uid()) as meu_tenant_id,
  (SELECT tenant_id FROM requisicoes LIMIT 1) as tenant_id_nas_requisicoes,
  CASE
    WHEN (SELECT tenant_id FROM profiles WHERE id = auth.uid()) = (SELECT tenant_id FROM requisicoes LIMIT 1)
    THEN '✅ IGUAL'
    ELSE '❌ DIFERENTE - ESTE É O PROBLEMA!'
  END as comparacao;
