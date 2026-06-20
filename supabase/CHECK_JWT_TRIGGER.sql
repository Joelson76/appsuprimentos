-- Verificar se o trigger de JWT existe

-- 1. Ver se a função existe
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%jwt%'
OR routine_name LIKE '%custom%claim%';

-- 2. Ver triggers relacionados a auth
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
OR event_object_schema = 'auth';

-- 3. Ver a função handle_new_user (deve existir)
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'handle_new_user';
