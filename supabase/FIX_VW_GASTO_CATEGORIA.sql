-- Recriar view de gasto por categoria
-- Com campos mais completos

DROP VIEW IF EXISTS vw_gasto_por_categoria CASCADE;

CREATE OR REPLACE VIEW vw_gasto_por_categoria AS
SELECT
  r.tenant_id,
  COALESCE(c.nome, 'Sem Categoria') AS categoria,
  COUNT(DISTINCT ir.id) AS quantidade_total,
  COUNT(DISTINCT r.id) AS total_pedidos,
  SUM(ir.valor_estimado) AS valor_total,
  AVG(ir.valor_estimado) AS valor_medio,

  -- Percentual do total (calculado por tenant)
  ROUND(
    (SUM(ir.valor_estimado) * 100.0) / NULLIF(
      (SELECT SUM(ir2.valor_estimado)
       FROM itens_requisicao ir2
       JOIN requisicoes r2 ON r2.id = ir2.requisicao_id
       WHERE r2.tenant_id = r.tenant_id
      ), 0
    ), 2
  ) AS percentual_total

FROM itens_requisicao ir
LEFT JOIN categorias c ON c.id = ir.categoria_id
JOIN requisicoes r ON r.id = ir.requisicao_id
GROUP BY r.tenant_id, c.nome;

-- Permissões
GRANT SELECT ON vw_gasto_por_categoria TO authenticated;
GRANT SELECT ON vw_gasto_por_categoria TO anon;

-- Testar
SELECT * FROM vw_gasto_por_categoria
WHERE tenant_id = 'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid
ORDER BY valor_total DESC;
