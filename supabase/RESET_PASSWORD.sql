-- Resetar senha do usuário

-- Resetar para senha temporária "Temp@123"
UPDATE auth.users
SET encrypted_password = crypt('Temp@123', gen_salt('bf'))
WHERE email = 'joelson76@gmail.com';

-- Verificar
SELECT
  email,
  'Senha resetada para: Temp@123' as mensagem
FROM auth.users
WHERE email = 'joelson76@gmail.com';
