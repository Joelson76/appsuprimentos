-- Função para calcular pedidos do mês atual
CREATE OR REPLACE FUNCTION get_pedidos_mes_atual(p_tenant_id UUID)
RETURNS TABLE (total NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(p.valor_total), 0) AS total
  FROM pedidos p
  WHERE p.tenant_id = p_tenant_id
    AND DATE_TRUNC('month', p.criado_em) = DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Testar
SELECT * FROM get_pedidos_mes_atual('991030c9-6314-487e-9c76-f6c23f20a58d');
