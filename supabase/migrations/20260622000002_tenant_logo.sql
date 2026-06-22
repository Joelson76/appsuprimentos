-- ==========================================
-- MIGRATION: Logo Personalizada do Tenant
-- Data: 2026-06-22
-- Descrição: Permite que cada tenant tenha sua própria logo
-- ==========================================

-- Adicionar coluna logo_url na tabela tenants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE tenants ADD COLUMN logo_url TEXT;
  END IF;
END $$;

-- Comentário explicativo
COMMENT ON COLUMN tenants.logo_url IS
'URL da logo personalizada do tenant. Se NULL, usa logo padrão (SupriFlow/JLS)';

-- Criar bucket para logos (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-logos', 'tenant-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para o bucket de logos
-- Política: Qualquer usuário autenticado pode ler logos
CREATE POLICY "Logos são públicas"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'tenant-logos');

-- Política: Somente usuários do tenant podem fazer upload/update da própria logo
CREATE POLICY "Tenant pode gerenciar própria logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-logos' AND
  (storage.foldername(name))[1] = (
    SELECT tenant_id::text
    FROM profiles
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Tenant pode atualizar própria logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-logos' AND
  (storage.foldername(name))[1] = (
    SELECT tenant_id::text
    FROM profiles
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Tenant pode deletar própria logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-logos' AND
  (storage.foldername(name))[1] = (
    SELECT tenant_id::text
    FROM profiles
    WHERE id = auth.uid()
  )
);
