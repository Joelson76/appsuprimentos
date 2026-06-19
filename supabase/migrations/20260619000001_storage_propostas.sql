-- ==========================================
-- STORAGE: Bucket para propostas de fornecedores
-- Data: 2026-06-19
-- Objetivo: Permitir upload público de propostas por fornecedores (sem autenticação)
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

-- Comentário
COMMENT ON TABLE storage.objects IS 'Bucket "propostas" configurado para upload público de fornecedores via token';

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'Bucket de storage "propostas" configurado com sucesso (público)';
END $$;
