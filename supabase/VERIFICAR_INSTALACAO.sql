-- ==========================================
-- VERIFICAÇÃO DETALHADA DA INSTALAÇÃO
-- ==========================================

-- 1. TABELAS INSTALADAS (organizadas por fase)
SELECT
  'Fase 1 (3 tabelas)' as fase,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tabelas
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND table_name IN ('tenants', 'profiles', 'audit_logs')

UNION ALL

SELECT
  'Fase 2 (11 tabelas)' as fase,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tabelas
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND table_name IN (
  'fornecedores', 'categorias', 'centros_custo',
  'requisicoes', 'itens_requisicao',
  'regras_aprovacao', 'aprovacoes',
  'cotacoes', 'itens_cotacao',
  'ordens_compra', 'itens_po', 'avaliacoes_fornecedor',
  'sequencias_numeracao'
)

UNION ALL

SELECT
  'Fase 3 (4 tabelas)' as fase,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tabelas
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND table_name IN (
  'recebimentos', 'itens_recebimento',
  'notas_fiscais', 'contratos'
)

UNION ALL

SELECT
  'Fase 4 (3 tabelas)' as fase,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tabelas
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND table_name IN (
  'produtos', 'movimentacoes_estoque',
  'notificacoes_pendentes'
)

UNION ALL

SELECT
  'Fase 5 (4 tabelas)' as fase,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tabelas
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND table_name IN (
  'planos', 'assinaturas',
  'pagamentos', 'uso_tenants'
);

-- 2. TABELAS EXTRAS (não previstas)
SELECT
  '⚠️ EXTRAS' as tipo,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND table_name NOT IN (
  -- Fase 1
  'tenants', 'profiles', 'audit_logs',
  -- Fase 2
  'fornecedores', 'categorias', 'centros_custo',
  'requisicoes', 'itens_requisicao',
  'regras_aprovacao', 'aprovacoes',
  'cotacoes', 'itens_cotacao',
  'ordens_compra', 'itens_po', 'avaliacoes_fornecedor',
  'sequencias_numeracao',
  -- Fase 3
  'recebimentos', 'itens_recebimento',
  'notas_fiscais', 'contratos',
  -- Fase 4
  'produtos', 'movimentacoes_estoque',
  'notificacoes_pendentes',
  -- Fase 5
  'planos', 'assinaturas',
  'pagamentos', 'uso_tenants'
)
ORDER BY table_name;

-- 3. ENUMS INSTALADOS
SELECT
  'ENUMS Instalados' as tipo,
  typname as nome_enum
FROM pg_type
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND typtype = 'e'
ORDER BY typname;

-- 4. PLANOS (deve ter 3)
SELECT
  nome,
  preco_centavos / 100.0 as preco_reais,
  limite_usuarios,
  limite_pos_mes
FROM planos
ORDER BY ordem;

-- 5. JOBS pg_cron (deve ter 4 nossos)
SELECT
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname LIKE '%-%'
ORDER BY jobname;

-- 6. VIEWS (deve ter 3)
SELECT
  table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ==========================================
-- RESUMO FINAL
-- ==========================================
SELECT
  'RESUMO' as categoria,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tabelas,
  (SELECT COUNT(*) FROM pg_type
   WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
   AND typtype = 'e') as total_enums,
  (SELECT COUNT(*) FROM information_schema.views
   WHERE table_schema = 'public') as total_views,
  (SELECT COUNT(*) FROM cron.job WHERE jobname LIKE '%-%') as total_jobs,
  (SELECT COUNT(*) FROM planos) as total_planos;
