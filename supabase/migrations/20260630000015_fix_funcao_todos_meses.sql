-- Recriar função para retornar TODOS os meses, mesmo zerados
DROP FUNCTION IF EXISTS get_breakdown_mensal_filiais(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_breakdown_mensal_filiais(
  p_tenant_id UUID,
  p_meses INTEGER DEFAULT 6
)
RETURNS TABLE (
  mes TIMESTAMP WITH TIME ZONE,
  filial_id UUID,
  filial_nome TEXT,
  cnpj TEXT,
  is_matriz BOOLEAN,
  total_pedidos BIGINT,
  valor_pedidos NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH meses_serie AS (
    -- Gerar série de meses
    SELECT DATE_TRUNC('month', generate_series(
      CURRENT_DATE - (p_meses || ' months')::INTERVAL,
      CURRENT_DATE,
      '1 month'::INTERVAL
    ))::TIMESTAMP WITH TIME ZONE AS mes
  ),
  filiais_tenant AS (
    -- Filiais do tenant
    SELECT
      f.id,
      f.nome,
      f.cnpj,
      f.is_matriz
    FROM filiais f
    WHERE f.tenant_id = p_tenant_id
      AND f.ativa = true
  ),
  meses_filiais AS (
    -- Produto cartesiano: todos os meses x todas as filiais
    SELECT
      m.mes,
      f.id AS filial_id,
      f.nome AS filial_nome,
      f.cnpj,
      f.is_matriz
    FROM meses_serie m
    CROSS JOIN filiais_tenant f
  )
  SELECT
    mf.mes,
    mf.filial_id,
    mf.filial_nome,
    mf.cnpj,
    mf.is_matriz,
    COALESCE(COUNT(DISTINCT p.id), 0) AS total_pedidos,
    COALESCE(SUM(p.valor_total), 0) AS valor_pedidos
  FROM meses_filiais mf
  LEFT JOIN pedidos p ON
    DATE_TRUNC('month', p.criado_em) = mf.mes
    AND p.filial_id = mf.filial_id
    AND p.tenant_id = p_tenant_id
  GROUP BY mf.mes, mf.filial_id, mf.filial_nome, mf.cnpj, mf.is_matriz
  ORDER BY mf.mes DESC, mf.is_matriz DESC NULLS LAST, mf.filial_nome;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Testar com 6 meses
SELECT * FROM get_breakdown_mensal_filiais('991030c9-6314-487e-9c76-f6c23f20a58d'::uuid, 6);
