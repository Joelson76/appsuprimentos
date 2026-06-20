-- View para breakdown de pedidos por filial

CREATE OR REPLACE VIEW vw_breakdown_por_filial AS
SELECT
  f.id as filial_id,
  f.tenant_id,
  f.nome as filial_nome,
  f.cnpj,
  f.is_matriz,

  -- Requisições
  (SELECT COUNT(*) FROM requisicoes r WHERE r.filial_id = f.id) as total_requisicoes,
  (SELECT COUNT(*) FROM requisicoes r WHERE r.filial_id = f.id AND r.status = 'AGUARDANDO_APROVACAO') as requisicoes_pendentes,

  -- Cotações
  (SELECT COUNT(*) FROM cotacoes c WHERE c.filial_id = f.id) as total_cotacoes,

  -- Pedidos (via requisicoes -> cotacoes -> pedidos)
  (SELECT COUNT(DISTINCT p.id)
   FROM pedidos p
   JOIN cotacoes c ON p.cotacao_id = c.id
   WHERE c.filial_id = f.id
  ) as total_pedidos,

  (SELECT COALESCE(SUM(p.valor_total), 0)
   FROM pedidos p
   JOIN cotacoes c ON p.cotacao_id = c.id
   WHERE c.filial_id = f.id
  ) as valor_pedidos

FROM filiais f
WHERE f.ativa = true
ORDER BY f.is_matriz DESC, f.nome;

-- Dar permissões
GRANT SELECT ON vw_breakdown_por_filial TO authenticated;
GRANT SELECT ON vw_breakdown_por_filial TO anon;

-- Testar
SELECT * FROM vw_breakdown_por_filial
WHERE tenant_id = 'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid;
