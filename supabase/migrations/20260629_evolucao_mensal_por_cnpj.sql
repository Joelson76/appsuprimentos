-- Migration: Evolução Mensal por CNPJ/Filial
-- Date: 2026-06-29
-- Purpose: View para gráfico mensal com breakdown por filial

-- View de evolução mensal com breakdown por filial/CNPJ
CREATE OR REPLACE VIEW vw_evolucao_mensal_por_filial AS
SELECT
  oc.tenant_id,
  DATE_TRUNC('month', oc.criado_em) as mes,
  f.id as filial_id,
  f.razao_social as filial_nome,
  f.cnpj,
  f.is_matriz,
  COUNT(*) as qtd_pedidos,
  SUM(oc.valor_total) as valor_total,
  AVG(oc.valor_total) as ticket_medio
FROM ordens_compra oc
LEFT JOIN filiais f ON f.id = oc.filial_id AND f.tenant_id = oc.tenant_id
WHERE oc.status NOT IN ('CANCELADA', 'RASCUNHO')
  AND oc.criado_em >= NOW() - INTERVAL '12 months'
GROUP BY oc.tenant_id, DATE_TRUNC('month', oc.criado_em), f.id, f.razao_social, f.cnpj, f.is_matriz
ORDER BY mes DESC, f.is_matriz DESC, f.razao_social;

-- Comentário
COMMENT ON VIEW vw_evolucao_mensal_por_filial IS 'Evolução mensal de pedidos com breakdown por filial/CNPJ para gráfico de barras empilhadas';
