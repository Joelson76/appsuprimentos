-- Verificar se existe TRIGGER que cria profile automaticamente

-- 1. Ver todos os triggers em auth.users
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 2. Ver funções que podem criar profiles
SELECT
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname ILIKE '%profile%'
   OR proname ILIKE '%user%'
   OR prosrc ILIKE '%INSERT INTO profiles%'
   OR prosrc ILIKE '%INSERT INTO public.profiles%';
