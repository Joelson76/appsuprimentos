-- ==========================================
-- EXTENSÕES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ==========================================
-- ENUMS
-- ==========================================
CREATE TYPE perfil_usuario AS ENUM (
  'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'COMPRADOR',
  'SOLICITANTE', 'ALMOXARIFE', 'FINANCEIRO'
);

CREATE TYPE status_tenant AS ENUM (
  'TRIAL', 'ATIVO', 'BLOQUEADO', 'CANCELADO'
);

CREATE TYPE plano_tipo AS ENUM (
  'BASICO', 'PROFISSIONAL', 'ENTERPRISE'
);

-- ==========================================
-- TABELA: tenants
-- ==========================================
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          TEXT NOT NULL,
  cnpj          TEXT NOT NULL UNIQUE,
  plano         plano_tipo NOT NULL DEFAULT 'BASICO',
  status        status_tenant NOT NULL DEFAULT 'TRIAL',
  trial_fim     TIMESTAMPTZ,
  logo_url      TEXT,
  endereco      JSONB,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- TABELA: profiles
-- (estende auth.users do Supabase Auth)
-- ==========================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  perfil        perfil_usuario NOT NULL DEFAULT 'COMPRADOR',
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  token_convite TEXT UNIQUE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- TABELA: audit_logs
-- ==========================================
CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  usuario_id UUID NOT NULL,
  acao       TEXT NOT NULL,
  detalhes   JSONB,
  ip         TEXT,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- TRIGGER: atualizar updated_at automaticamente
-- ==========================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ==========================================
-- TRIGGER: criar profile automaticamente ao registrar usuário no Supabase Auth
-- ==========================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- O tenant_id e perfil vêm dos raw_user_meta_data passados no signUp
  INSERT INTO profiles (id, tenant_id, nome, perfil)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'tenant_id')::UUID,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'perfil', 'COMPRADOR')::perfil_usuario
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- FUNÇÃO: injetar custom claims no JWT
-- (tenant_id e perfil ficam disponíveis em auth.jwt()->'app_metadata')
-- ==========================================
CREATE OR REPLACE FUNCTION custom_access_token_hook(event JSONB)
RETURNS JSONB AS $$
DECLARE
  claims     JSONB;
  user_profile RECORD;
BEGIN
  SELECT tenant_id, perfil INTO user_profile
  FROM profiles
  WHERE id = (event->>'user_id')::UUID;

  claims := event->'claims';
  claims := jsonb_set(claims, '{app_metadata,tenant_id}', to_jsonb(user_profile.tenant_id::TEXT));
  claims := jsonb_set(claims, '{app_metadata,perfil}', to_jsonb(user_profile.perfil::TEXT));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql STABLE;

-- Registrar o hook no Supabase (executar no dashboard: Auth > Hooks)
-- grant execute on function custom_access_token_hook to supabase_auth_admin;

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Tenants: apenas o próprio tenant pode ver seus dados
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolamento" ON tenants
  FOR ALL USING (
    id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
  );

-- Profiles: isolado por tenant
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_isolamento" ON profiles
  FOR ALL USING (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
  );

-- Audit logs: isolado por tenant (apenas leitura para não-admin)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_leitura" ON audit_logs
  FOR SELECT USING (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
  );

CREATE POLICY "audit_logs_insercao" ON audit_logs
  FOR INSERT WITH CHECK (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
  );

-- ==========================================
-- FUNÇÃO AUXILIAR: verificar permissão mínima
-- ==========================================
CREATE OR REPLACE FUNCTION perfil_tem_permissao(perfil_minimo perfil_usuario)
RETURNS BOOLEAN AS $$
DECLARE
  meu_perfil perfil_usuario;
  ordem_perfis TEXT[] := ARRAY[
    'SOLICITANTE', 'ALMOXARIFE', 'FINANCEIRO',
    'COMPRADOR', 'GESTOR', 'ADMIN', 'SUPER_ADMIN'
  ];
BEGIN
  meu_perfil := (auth.jwt()->'app_metadata'->>'perfil')::perfil_usuario;
  RETURN array_position(ordem_perfis, meu_perfil::TEXT) >=
         array_position(ordem_perfis, perfil_minimo::TEXT);
END;
$$ LANGUAGE plpgsql STABLE;
