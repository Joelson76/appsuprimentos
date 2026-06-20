-- Recriar view de desempenho de fornecedores
-- Versão simplificada que funciona com a tabela 'pedidos'

DROP VIEW IF EXISTS vw_desempenho_fornecedores CASCADE;

CREATE OR REPLACE VIEW vw_desempenho_fornecedores AS
SELECT
  f.id,
  f.tenant_id,
  f.razao_social,
  f.cnpj,
  f.score,
  f.status,

  -- Estatísticas baseadas em pedidos
  COUNT(DISTINCT p.id) as total_pedidos,
  COALESCE(SUM(p.valor_total), 0) as valor_total,
  COALESCE(AVG(p.valor_total), 0) as valor_medio,

  -- Lead time (placeholder - precisa de campo de data de entrega)
  0 as lead_time_medio_dias,
  0 as pedidos_no_prazo,
  0 as taxa_pontualidade

FROM fornecedores f
LEFT JOIN pedidos p ON p.fornecedor_id = f.id
GROUP BY f.id, f.tenant_id, f.razao_social, f.cnpj, f.score, f.status;

-- Permissões
GRANT SELECT ON vw_desempenho_fornecedores TO authenticated;
GRANT SELECT ON vw_desempenho_fornecedores TO anon;

-- Testar
SELECT * FROM vw_desempenho_fornecedores
WHERE tenant_id = 'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid;
