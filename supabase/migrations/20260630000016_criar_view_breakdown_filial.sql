-- Criar view vw_breakdown_por_filial
CREATE OR REPLACE VIEW vw_breakdown_por_filial AS
SELECT
  f.id AS filial_id,
  f.nome AS filial_nome,
  f.cnpj,
  f.is_matriz,
  f.tenant_id,
  COUNT(DISTINCT p.id) AS total_pedidos,
  COALESCE(SUM(p.valor_total), 0) AS valor_pedidos
FROM filiais f
LEFT JOIN pedidos p ON p.filial_id = f.id
WHERE f.tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
)
GROUP BY f.id, f.nome, f.cnpj, f.is_matriz, f.tenant_id
ORDER BY f.is_matriz DESC, f.nome;

-- Habilitar security invoker
ALTER VIEW vw_breakdown_por_filial SET (security_invoker = true);

-- Dar permissão
GRANT SELECT ON vw_breakdown_por_filial TO authenticated;

-- Testar
SELECT * FROM vw_breakdown_por_filial;
