-- ===== DIAGNÓSTICO COMPLETO =====
-- Execute este SQL no Supabase para verificar seus dados

-- 1. Ver seus pedidos (procure o de R$ 871)
SELECT
  id,
  numero,
  valor_total,
  criado_em,
  filial_id,
  status
FROM ordens_compra
WHERE status NOT IN ('CANCELADA', 'RASCUNHO')
  AND criado_em >= NOW() - INTERVAL '12 months'
ORDER BY criado_em DESC
LIMIT 10;

-- 2. Ver suas filiais cadastradas
SELECT
  id,
  nome,
  cnpj,
  is_matriz,
  ativa
FROM filiais
ORDER BY is_matriz DESC, nome;

-- 3. Verificar quantos pedidos TEM filial_id
SELECT
  COUNT(*) as total_pedidos,
  COUNT(filial_id) as pedidos_com_filial,
  COUNT(*) - COUNT(filial_id) as pedidos_SEM_filial
FROM ordens_compra
WHERE status NOT IN ('CANCELADA', 'RASCUNHO');

-- 4. Ver pedidos agrupados por filial + mês
SELECT
  DATE_TRUNC('month', oc.criado_em) as mes,
  f.nome as filial_nome,
  f.cnpj,
  COUNT(*) as qtd_pedidos,
  SUM(oc.valor_total) as valor_total
FROM ordens_compra oc
LEFT JOIN filiais f ON f.id = oc.filial_id
WHERE oc.status NOT IN ('CANCELADA', 'RASCUNHO')
  AND oc.criado_em >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', oc.criado_em), f.nome, f.cnpj
ORDER BY mes DESC;
