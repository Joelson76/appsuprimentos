# 🚨 FIX CRÍTICO - Travamento no Login

## ⚠️ Problema

**Sintoma:** Navegador trava ao fazer login

**Causa:** Loop infinito no middleware quando RLS bloqueia query de profile

---

## 🔍 Diagnóstico

### O Que Acontecia:

```
1. Usuário faz login ✅
2. Middleware roda
3. Middleware tenta buscar profile
4. RLS bloqueia (policy não aplicada) ❌
5. Middleware redireciona para /login
6. Middleware roda novamente (usuário ainda logado)
7. LOOP INFINITO = navegador trava 🚨
```

### Como Identificar:

**Chrome DevTools (F12):**
```
Network:
  GET /dashboard → 307 /login
  GET /login → 307 /dashboard
  GET /dashboard → 307 /login
  ... (infinito)

Console:
  🔍 Middleware: Buscando profile...
  ❌ Erro ao buscar profile: permission denied
  🔍 Middleware: Buscando profile...
  (repetindo infinitamente)
```

---

## ✅ Correção Aplicada

### Commit: `9ef507f`

**Mudança no middleware.ts:**

```typescript
// ❌ ANTES (causava loop)
if (profileError) {
  console.error('❌ Erro ao buscar profile:', profileError)
  // Não fazia nada → continuava com profile null
}

if (!profile) {
  // Redirecionava MAS usuário continuava logado
  return NextResponse.redirect('/login')
  // Loop: middleware roda de novo!
}
```

```typescript
// ✅ DEPOIS (evita loop)
if (profileError) {
  console.error('❌ Erro ao buscar profile:', profileError)

  // Detectar erro de RLS
  if (profileError.code === 'PGRST116' || 
      profileError.message?.includes('permission denied')) {
    
    // FAZER LOGOUT antes de redirecionar
    await supabase.auth.signOut()
    
    // Agora redireciona
    return NextResponse.redirect('/login?error=rls_error')
    // Não há loop: usuário não está mais logado
  }
}

if (!profile) {
  // Também faz logout agora
  await supabase.auth.signOut()
  return NextResponse.redirect('/login?error=invalid_profile')
}
```

---

## 🎯 Solução Definitiva

A correção acima **previne o loop**, mas a **causa raiz** é:

### ⚠️ MIGRATION RLS NÃO APLICADA

**OBRIGATÓRIO:** Aplicar migration no Supabase:

```sql
-- supabase/migrations/20260629000000_fix_rls_security.sql

-- Esta policy permite usuário ler seu próprio profile
CREATE POLICY "profiles_self_access"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);
```

**Como aplicar:**
```
1. Supabase Dashboard
2. SQL Editor
3. Copiar arquivo 20260629000000_fix_rls_security.sql
4. Colar e Run
5. Verificar: Policy criada ✅
```

---

## 🧪 Como Testar Após Deploy

### 1. Verificar que Deploy Subiu
```
Vercel Dashboard → Deployments
Commit 9ef507f deve estar deployed
```

### 2. Testar Login
```
1. Abrir site (nova aba anônima)
2. Fazer login
3. Observar:
   ✅ Dashboard carrega normalmente
   ❌ NÃO trava navegador
   ❌ NÃO fica em loop
```

### 3. Se AINDA Travar
```
Causa: Migration não aplicada

Sintoma:
  - Usuário é deslogado automaticamente
  - URL mostra: /login?error=rls_error

Solução:
  1. Aplicar migration no Supabase
  2. Aguardar 30 segundos
  3. Fazer login novamente
  4. Deve funcionar ✅
```

---

## 🔍 Verificar RLS no Supabase

### Query 1: Policy existe?
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'profiles_self_access';

-- Esperado: 1 resultado
-- Se retornar vazio: MIGRATION NÃO FOI APLICADA
```

### Query 2: RLS está ativo?
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- Esperado:
-- profiles | true
```

### Query 3: Testar manualmente
```sql
-- Simular query do middleware
SELECT tenant_id, perfil
FROM profiles
WHERE id = auth.uid();

-- Se retornar dados: RLS OK ✅
-- Se dar erro: RLS bloqueando ❌
```

---

## 📊 Status da Correção

### Antes (travava):
```
Login → Middleware → Profile query fails → Redirect → LOOP
```

### Depois (fix temporário):
```
Login → Middleware → Profile query fails → Logout → Redirect
Usuário vê: "error=rls_error"
```

### Ideal (após migration):
```
Login → Middleware → Profile query SUCCESS → Dashboard ✅
```

---

## 🚨 Se Urgente (Rollback Temporário)

Se não puder aplicar migration agora, pode fazer rollback:

### Opção 1: Desabilitar RLS (INSEGURO)
```sql
-- ⚠️ APENAS EMERGÊNCIA - REMOVE SEGURANÇA
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### Opção 2: Reverter Deploy
```
Vercel Dashboard:
1. Deployments
2. Encontrar deploy anterior (2623be2)
3. ... → Promote to Production
```

### Opção 3: Service Role no Middleware (INSEGURO)
```typescript
// ⚠️ NÃO FAZER - apenas se extremamente necessário
// Usar service_role no middleware
// Permite acesso total (SEM isolamento multi-tenant)
```

---

## ✅ Checklist de Resolução

- [x] Correção no middleware (evita loop)
- [x] Commit e push (9ef507f)
- [ ] Deploy Vercel concluído
- [ ] **CRITICAL:** Aplicar migration RLS no Supabase
- [ ] Testar login
- [ ] Verificar que não trava
- [ ] Verificar que dashboard carrega

---

## 📝 Linha do Tempo

**2026-06-29 - 12:55**
- Deploy com RLS security
- Migration SQL criada

**2026-06-29 - 13:00** (aproximado)
- Usuário reporta: "travou o navegador"
- Identificado: loop infinito no middleware

**2026-06-29 - 13:05**
- Correção aplicada: logout antes de redirect
- Commit 9ef507f
- Push para GitHub

**2026-06-29 - 13:10**
- ⏳ Aguardando deploy Vercel
- ⚠️ Ainda precisa: aplicar migration

---

## 🎓 Lição Aprendida

### O Que Deu Errado:
```
❌ Deployamos código com RLS
❌ Não aplicamos migration
❌ Middleware quebrou
❌ Loop infinito
```

### Ordem Correta:
```
✅ 1. Aplicar migration PRIMEIRO
✅ 2. Testar que funciona
✅ 3. Deploy código
✅ 4. Testar em produção
```

### Para Próxima Vez:
```
1. Migrations SEMPRE antes do código
2. Testar localmente ANTES de deploy
3. Ter plano de rollback pronto
4. Monitorar logs após deploy
```

---

## 📞 Comunicação

**Se tem usuários afetados:**

```
Mensagem:
"Detectamos um problema temporário no login.
Estamos corrigindo agora.
Tempo estimado: 5-10 minutos.
Desculpe o transtorno."

Após corrigir:
"Problema resolvido! Sistema funcionando normalmente.
Obrigado pela paciência."
```

---

**Status:** ✅ CORREÇÃO APLICADA  
**Deploy:** ⏳ EM PROGRESSO  
**Urgência:** 🚨 ALTA  
**Próximo passo:** APLICAR MIGRATION + TESTAR
