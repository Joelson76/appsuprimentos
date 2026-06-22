-- =====================================================
-- Sistema de Links Curtos para Cotações
-- =====================================================
-- Problema: WhatsApp trunca tokens longos (64 chars)
-- Solução: Criar short codes de 8 caracteres
-- =====================================================

-- Criar tabela de short links
CREATE TABLE IF NOT EXISTS cotacao_short_links (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  short_code      TEXT NOT NULL UNIQUE,
  token_original  TEXT NOT NULL,
  cotacao_id      UUID NOT NULL REFERENCES cotacoes(id) ON DELETE CASCADE,
  fornecedor_id   UUID NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
  acessos         INT NOT NULL DEFAULT 0,
  ultimo_acesso   TIMESTAMPTZ,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_em       TIMESTAMPTZ
);

-- Index para busca rápida por short_code
CREATE INDEX idx_short_links_code ON cotacao_short_links(short_code);
CREATE INDEX idx_short_links_token ON cotacao_short_links(token_original);

-- Sem RLS (acesso público via short_code)
-- Comentário: Similar a itens_cotacao, acesso controlado pelo código

-- Função para gerar short code único (8 caracteres)
CREATE OR REPLACE FUNCTION gerar_short_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijkmnopqrstuvwxyz23456789'; -- sem 0,o,1,l para evitar confusão
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para criar short link para um token existente
CREATE OR REPLACE FUNCTION criar_short_link_para_token(p_token_original TEXT)
RETURNS TEXT AS $$
DECLARE
  v_short_code TEXT;
  v_cotacao_id UUID;
  v_fornecedor_id UUID;
  v_max_tentativas INT := 10;
  v_tentativa INT := 0;
BEGIN
  -- Buscar cotacao_id e fornecedor_id do token
  SELECT cotacao_id, fornecedor_id
  INTO v_cotacao_id, v_fornecedor_id
  FROM itens_cotacao
  WHERE token_resposta = p_token_original
  LIMIT 1;

  IF v_cotacao_id IS NULL THEN
    RAISE EXCEPTION 'Token não encontrado: %', p_token_original;
  END IF;

  -- Verificar se já existe short link para este token
  SELECT short_code INTO v_short_code
  FROM cotacao_short_links
  WHERE token_original = p_token_original;

  IF v_short_code IS NOT NULL THEN
    RETURN v_short_code;
  END IF;

  -- Gerar novo short code único
  LOOP
    v_short_code := gerar_short_code();
    v_tentativa := v_tentativa + 1;

    -- Tentar inserir (vai falhar se já existir)
    BEGIN
      INSERT INTO cotacao_short_links (
        short_code,
        token_original,
        cotacao_id,
        fornecedor_id,
        expira_em
      )
      SELECT
        v_short_code,
        p_token_original,
        v_cotacao_id,
        v_fornecedor_id,
        c.data_limite + INTERVAL '30 days' -- expira 30 dias após prazo da cotação
      FROM cotacoes c
      WHERE c.id = v_cotacao_id;

      EXIT; -- Sucesso, sair do loop
    EXCEPTION
      WHEN unique_violation THEN
        -- Short code já existe, tentar novamente
        IF v_tentativa >= v_max_tentativas THEN
          RAISE EXCEPTION 'Não foi possível gerar short code único após % tentativas', v_max_tentativas;
        END IF;
    END;
  END LOOP;

  RETURN v_short_code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CRIAR SHORT LINKS PARA TOKENS EXISTENTES
-- =====================================================

-- Gerar short links para todos os tokens existentes
INSERT INTO cotacao_short_links (short_code, token_original, cotacao_id, fornecedor_id, expira_em)
SELECT
  gerar_short_code(),
  ic.token_resposta,
  ic.cotacao_id,
  ic.fornecedor_id,
  c.data_limite + INTERVAL '30 days'
FROM itens_cotacao ic
JOIN cotacoes c ON c.id = ic.cotacao_id
WHERE ic.token_resposta IS NOT NULL
ON CONFLICT (short_code) DO NOTHING;

-- Verificar quantos foram criados
SELECT COUNT(*) as total_short_links FROM cotacao_short_links;

-- =====================================================
-- TRIGGER: Criar short link automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION criar_short_link_automatico()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar short link quando um novo item de cotação for criado
  PERFORM criar_short_link_para_token(NEW.token_resposta);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_criar_short_link
  AFTER INSERT ON itens_cotacao
  FOR EACH ROW
  EXECUTE FUNCTION criar_short_link_automatico();

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para listar short links com informações
CREATE OR REPLACE VIEW vw_short_links AS
SELECT
  sl.short_code,
  sl.token_original,
  sl.acessos,
  sl.ultimo_acesso,
  sl.criado_em,
  sl.expira_em,
  c.numero as cotacao_numero,
  c.data_limite as cotacao_prazo,
  f.razao_social as fornecedor_nome
FROM cotacao_short_links sl
JOIN cotacoes c ON c.id = sl.cotacao_id
JOIN fornecedores f ON f.id = sl.fornecedor_id;

-- =====================================================
-- NOTAS
-- =====================================================
-- Short codes: 8 caracteres (ex: 'a3m5n9k2')
-- Link curto: https://app.com/c/a3m5n9k2
-- Link longo: https://app.com/fornecedor/293026991d...63f7
--
-- Vantagens:
-- - Links muito mais curtos (8 vs 64 chars)
-- - WhatsApp não trunca
-- - Tracking de acessos
-- - Expiração automática
-- =====================================================
