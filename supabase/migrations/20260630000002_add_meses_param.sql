-- Migration: Adicionar parâmetro de meses na função de breakdown
-- Data: 2026-06-30

-- Dropar função antiga
DROP FUNCTION IF EXISTS get_breakdown_mensal_filiais(uuid);

-- Recriar com parâmetro de meses
CREATE OR REPLACE FUNCTION get_breakdown_mensal_filiais(
  p_tenant_id uuid,
  p_meses integer DEFAULT 6
)
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
  WITH meses AS (
    SELECT DATE_TRUNC('month', CURRENT_DATE - (n || ' months')::interval) as mes
    FROM generate_series(0, p_meses - 1) n
  ),
  filiais_ativas AS (
    SELECT f.id as f_id, f.nome as f_nome, f.cnpj as f_cnpj, f.is_matriz as f_is_matriz
    FROM filiais f
    WHERE f.tenant_id = p_tenant_id AND f.ativa = true
  )
  SELECT
    m.mes::timestamp with time zone,
    fa.f_id::uuid,
    fa.f_nome::text,
    fa.f_cnpj::text,
    fa.f_is_matriz::boolean,
    COUNT(p.id)::bigint as total_pedidos,
    COALESCE(SUM(p.valor_total), 0)::numeric as valor_pedidos
  FROM filiais_ativas fa
  CROSS JOIN meses m
  LEFT JOIN pedidos p
    ON p.filial_id = fa.f_id
    AND p.tenant_id = p_tenant_id
    AND p.status NOT IN ('CANCELADO', 'RASCUNHO')
    AND DATE_TRUNC('month', p.criado_em) = m.mes
  GROUP BY m.mes, fa.f_id, fa.f_nome, fa.f_cnpj, fa.f_is_matriz
  ORDER BY m.mes DESC, fa.f_is_matriz DESC, valor_pedidos DESC;
END;
$$;

COMMENT ON FUNCTION get_breakdown_mensal_filiais IS 'Retorna breakdown de pedidos por mês e filial (parâmetro de meses configurável)';

-- Garantir permissões
GRANT EXECUTE ON FUNCTION get_breakdown_mensal_filiais(uuid, integer) TO authenticated;
