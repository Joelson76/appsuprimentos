-- ==========================================
-- STORAGE: Bucket para documentos (NF-e, contratos, etc)
-- ==========================================

-- Criar bucket público
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Upload (autenticado)
CREATE POLICY "Upload de documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos' AND
  auth.uid() IS NOT NULL
);

-- Policy: Download (autenticado do mesmo tenant)
CREATE POLICY "Download de documentos do tenant"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos' AND
  auth.uid() IS NOT NULL
);

-- Policy: Delete (autenticado do mesmo tenant)
CREATE POLICY "Deletar documentos do tenant"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos' AND
  auth.uid() IS NOT NULL
);

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'Bucket de storage "documentos" configurado com sucesso';
END $$;
