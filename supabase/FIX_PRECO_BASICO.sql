-- Corrigir preços dos planos
-- Básico: R$ 149, Profissional: R$ 297, Enterprise: R$ 997
-- Data: 2026-06-19

UPDATE planos SET preco_centavos = 14900 WHERE slug = 'BASICO';
UPDATE planos SET preco_centavos = 29700 WHERE slug = 'PROFISSIONAL';
UPDATE planos SET preco_centavos = 99700 WHERE slug = 'ENTERPRISE';

-- Verificar
SELECT nome, slug, preco_centavos, preco_centavos / 100.0 as preco_reais
FROM planos
ORDER BY ordem;
