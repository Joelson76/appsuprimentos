-- ==========================================
-- TRIGGER: Criar filial matriz automaticamente ao criar tenant
-- ==========================================

-- Função que cria a filial matriz
CREATE OR REPLACE FUNCTION create_filial_matriz_for_tenant()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar filial matriz automaticamente
  INSERT INTO filiais (
    tenant_id,
    nome,
    cnpj,
    is_matriz,
    ativa,
    cep,
    logradouro,
    numero,
    bairro,
    cidade,
    estado
  )
  VALUES (
    NEW.id,
    NEW.nome || ' - Matriz',
    NEW.cnpj,
    true, -- is_matriz
    true, -- ativa
    COALESCE(NEW.cep, '00000-000'),
    COALESCE(NEW.endereco->>'logradouro', 'Endereço não informado'),
    COALESCE(NEW.endereco->>'numero', 'S/N'),
    COALESCE(NEW.endereco->>'bairro', 'Centro'),
    COALESCE(NEW.cidade, 'Não informado'),
    COALESCE(NEW.estado, 'SP')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa após INSERT em tenants
CREATE TRIGGER trigger_create_filial_matriz
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION create_filial_matriz_for_tenant();

-- Comentários
COMMENT ON FUNCTION create_filial_matriz_for_tenant() IS
  'Cria automaticamente uma filial matriz quando um novo tenant é criado';

COMMENT ON TRIGGER trigger_create_filial_matriz ON tenants IS
  'Trigger que cria filial matriz automaticamente para novos tenants';
