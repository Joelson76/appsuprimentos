-- ==========================================
-- INSTRUÇÕES: Execute este SQL no SQL Editor do Supabase Dashboard
-- ==========================================
-- Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/sql/new
-- Cole este código e clique em RUN
-- ==========================================

-- Criar bucket público para propostas
INSERT INTO storage.buckets (id, name, public)
VALUES ('propostas', 'propostas', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Upload público (qualquer um pode fazer upload)
-- Necessário para fornecedores não autenticados enviarem propostas via token
CREATE POLICY "Upload público de propostas"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'propostas'
);

-- Policy: Download público (qualquer um pode baixar)
-- URLs públicas geradas pelo getPublicUrl()
CREATE POLICY "Download público de propostas"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'propostas'
);

-- Policy: Apenas usuários autenticados podem deletar
CREATE POLICY "Deletar propostas autenticado"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'propostas' AND
  auth.uid() IS NOT NULL
);

-- Verificar resultado
SELECT
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE id = 'propostas';

-- Verificar policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%propostas%';
