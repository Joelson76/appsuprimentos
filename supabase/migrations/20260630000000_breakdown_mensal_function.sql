-- Function: Buscar breakdown mensal por filial
-- Retorna dados agregados por MÊS + FILIAL (últimos 6 meses)

CREATE OR REPLACE FUNCTION get_breakdown_mensal_filiais(p_tenant_id uuid)
RETURNS TABLE (
  mes timestamp with time zone,
  filial_id uuid,
  filial_nome text,
  cnpj text,
  is_matriz boolean,
  total_pedidos bigint,
  valor_pedidos numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('month', oc.criado_em) as mes,
    f.id as filial_id,
    f.nome as filial_nome,
    f.cnpj,
    f.is_matriz,
    COUNT(oc.id) as total_pedidos,
    COALESCE(SUM(oc.valor_total), 0) as valor_pedidos
  FROM filiais f
  INNER JOIN ordens_compra oc
    ON oc.filial_id = f.id
    AND oc.tenant_id = f.tenant_id
  WHERE f.tenant_id = p_tenant_id
    AND f.ativa = true
    AND oc.status NOT IN ('CANCELADA', 'RASCUNHO')
    AND oc.criado_em >= NOW() - INTERVAL '6 months'
  GROUP BY DATE_TRUNC('month', oc.criado_em), f.id, f.nome, f.cnpj, f.is_matriz
  ORDER BY mes DESC, f.is_matriz DESC, valor_pedidos DESC;
END;
$$;

COMMENT ON FUNCTION get_breakdown_mensal_filiais IS 'Retorna breakdown de pedidos por mês e filial (últimos 6 meses)';
