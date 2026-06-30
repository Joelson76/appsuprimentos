-- Recriar função get_breakdown_mensal_filiais usando tabela PEDIDOS
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
  SELECT
    DATE_TRUNC('month', p.criado_em) AS mes,
    COALESCE(f.id, '00000000-0000-0000-0000-000000000000'::UUID) AS filial_id,
    COALESCE(f.nome, 'Sem Filial') AS filial_nome,
    COALESCE(f.cnpj, '00000000000000') AS cnpj,
    COALESCE(f.is_matriz, false) AS is_matriz,
    COUNT(DISTINCT p.id) AS total_pedidos,
    COALESCE(SUM(p.valor_total), 0) AS valor_pedidos
  FROM pedidos p
  LEFT JOIN filiais f ON f.id = p.filial_id
  WHERE p.tenant_id = p_tenant_id
    AND p.criado_em >= (CURRENT_DATE - (p_meses || ' months')::INTERVAL)
  GROUP BY DATE_TRUNC('month', p.criado_em), f.id, f.nome, f.cnpj, f.is_matriz
  ORDER BY mes DESC, f.is_matriz DESC NULLS LAST, f.nome;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Testar
SELECT * FROM get_breakdown_mensal_filiais('991030c9-6314-487e-9c76-f6c23f20a58d'::uuid, 6);
