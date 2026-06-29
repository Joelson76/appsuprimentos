-- Verificar de qual CNPJ/Filial é o pedido de R$ 871

-- 1. Buscar pedido com valor próximo a 871
SELECT
  oc.id,
  oc.numero,
  oc.valor_total,
  oc.criado_em,
  oc.filial_id,
  f.nome as filial_nome,
  f.cnpj,
  f.is_matriz,
  t.razao_social as tenant_nome
FROM ordens_compra oc
LEFT JOIN filiais f ON f.id = oc.filial_id
LEFT JOIN tenants t ON t.id = oc.tenant_id
WHERE oc.valor_total BETWEEN 870 AND 872
  AND oc.status NOT IN ('CANCELADA', 'RASCUNHO')
ORDER BY oc.criado_em DESC;

-- 2. Ver evolução mensal com filial
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
ORDER BY mes DESC, f.nome;

-- 3. Verificar se pedido tem filial_id preenchido
SELECT
  COUNT(*) as total_pedidos,
  COUNT(filial_id) as pedidos_com_filial,
  COUNT(*) - COUNT(filial_id) as pedidos_sem_filial
FROM ordens_compra
WHERE status NOT IN ('CANCELADA', 'RASCUNHO');

-- 4. Ver todas filiais cadastradas
SELECT
  id,
  nome,
  cnpj,
  is_matriz,
  ativa
FROM filiais
ORDER BY is_matriz DESC, nome;
