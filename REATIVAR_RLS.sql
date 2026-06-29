-- ✅ REATIVAR RLS - As policies já existem!

-- 1. Reativar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Verificar que foi reativado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
-- Deve retornar: profiles | true

-- 3. Testar que policies funcionam
-- Execute este SELECT como usuário normal (não postgres):
-- SELECT * FROM profiles WHERE id = auth.uid();
-- Deve retornar apenas SEU profile

-- ✅ Se funcionou, sistema está 100% seguro e operacional!
