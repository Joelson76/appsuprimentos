# ⚠️ Impacto das Correções RLS na Funcionalidade

## 📋 Resumo

**Pergunta:** "A funcionalidade vai continuar a mesma?"

**Resposta Curta:** ✅ **SIM**, mas precisa aplicar código atualizado JUNTO com a migration.

**Resposta Longa:** Se aplicar APENAS a migration sem atualizar o código, vai **QUEBRAR** os links de fornecedor.

---

## 🔍 O Que Vai Acontecer

### Cenário 1: ❌ Aplicar APENAS migration (VAI QUEBRAR)

```typescript
// Código atual (app/fornecedor/[token]/page.tsx)
const { data: cotacaoData } = await supabase
  .from('cotacoes')
  .select('*')
  .eq('id', itemData.cotacao_id)

// Resultado após migration:
// ❌ null (RLS bloqueia porque token não foi setado)
```

**Sintoma:** Links de fornecedor param de funcionar (erro "Cotação não encontrada")

---

### Cenário 2: ✅ Aplicar migration + código atualizado (FUNCIONA)

```typescript
// Código atualizado (já apliquei)
const dados = await fetchCotacaoByToken(tokenLimpo)

// fetchCotacaoByToken faz:
// 1. Seta token na sessão via RPC
// 2. Busca cotação (RLS valida token e permite)
// 3. Busca fornecedor e itens

// Resultado: ✅ Funciona normalmente
```

**Sintoma:** Tudo funciona como antes, mas **mais seguro**.

---

## 📊 Comparação de Funcionalidades

| Funcionalidade | Antes (INSEGURO) | Depois (SEGURO) | Status |
|----------------|------------------|-----------------|--------|
| **Login/Logout** | ✅ Funciona | ✅ Funciona | ✅ OK |
| **Criar usuário** | ✅ Funciona | ✅ Funciona | ✅ OK |
| **Ver próprio profile** | ✅ service_role | ✅ RLS self-access | ✅ OK |
| **CRUD requisições** | ✅ Funciona | ✅ Funciona | ✅ OK |
| **CRUD cotações** | ✅ Funciona | ✅ Funciona | ✅ OK |
| **CRUD pedidos** | ✅ Funciona | ✅ Funciona | ✅ OK |
| **Link fornecedor** | ✅ Funciona (ABERTO) | ⚠️ Precisa código atualizado | ⚠️ |
| **Submeter proposta** | ✅ Funciona | ⚠️ Precisa código atualizado | ⚠️ |
| **Isolamento tenants** | ⚠️ Quebrado (cotações) | ✅ Mantido | ✅ MELHOR |

---

## 🔧 O Que Foi Atualizado

### 1. Migration SQL
```
✅ supabase/migrations/20260629000000_fix_rls_security.sql
```

**Mudanças:**
- ✅ Profiles: self-access policy
- ✅ Cotações: token validation
- ✅ WITH CHECK em todas policies
- ✅ Funções helper criadas

### 2. Código Backend (API)
```
✅ app/api/usuarios/criar/route.ts
```

**Mudanças:**
- Removido `service_role` para buscar profile
- Usa cliente normal com RLS

**Impacto:** ✅ NENHUM (melhoria interna)

### 3. Código Frontend (Fornecedor)
```
✅ app/fornecedor/[token]/page.tsx
```

**Mudanças:**
- Usa `fetchCotacaoByToken()` que seta token
- Não faz queries diretas sem token

**Impacto:** ⚠️ **CRÍTICO** - Precisa aplicar JUNTO com migration

### 4. Helper Criado
```
✅ lib/supabase/public-access.ts
```

**Funções:**
- `setPublicCotacaoToken()` - Seta token na sessão
- `fetchCotacaoByToken()` - Busca cotação com token
- `submitRespostaCotacao()` - Submete resposta

**Impacto:** ✅ NENHUM (novo arquivo)

---

## 📝 Ordem Correta de Aplicação

### ✅ ORDEM CERTA (não quebra):

1. **Commitar código atualizado**
   ```bash
   git add .
   git commit -m "fix: update RLS security - code compatibility"
   git push
   ```

2. **Deploy código**
   ```bash
   # Vercel / servidor
   # Aguardar deploy completar
   ```

3. **Aplicar migration**
   ```bash
   supabase db push
   # OU via Dashboard: SQL Editor
   ```

**Resultado:** ✅ Tudo funciona, zero downtime

---

### ❌ ORDEM ERRADA (quebra):

1. **Aplicar migration primeiro**
   ```bash
   supabase db push
   ```
   ❌ Links de fornecedor quebram IMEDIATAMENTE

2. **Deploy código depois**
   ```bash
   git push
   # Deploy demora 2-5min
   ```
   ❌ 2-5 minutos de downtime

**Resultado:** ❌ Fornecedores não conseguem acessar cotações

---

## 🧪 Como Testar ANTES de Produção

### 1. Testar Localmente

```bash
# 1. Aplicar migration local
supabase db reset  # Recria banco local
supabase db push   # Aplica migration

# 2. Rodar dev
npm run dev

# 3. Testar link de fornecedor
# Pegar token de item_cotacao do banco:
# SELECT token_resposta FROM itens_cotacao LIMIT 1;

# 4. Abrir no navegador:
# http://localhost:3000/fornecedor/[TOKEN]

# 5. Verificar:
# ✅ Cotação carrega
# ✅ Pode preencher valores
# ✅ Pode submeter proposta
```

### 2. Testar Criação de Usuário

```bash
# 1. Login como admin
# 2. Ir em Usuários → Criar Usuário
# 3. Preencher dados e salvar
# 4. Verificar:
# ✅ Usuário criado com sucesso
# ✅ Sem erros de RLS
# ✅ Profile criado automaticamente
```

### 3. Testar Isolamento Multi-Tenant

```bash
# 1. Criar 2 tenants no banco
# 2. Login como Tenant A
# 3. Tentar acessar cotação do Tenant B via URL:
# /cotacoes/[ID-DO-TENANT-B]

# 4. Verificar:
# ✅ Não carrega dados do Tenant B
# ✅ Sem erro (só não mostra)
```

---

## 📊 Checklist de Validação

### Antes de Aplicar em Produção:

- [x] Migration SQL criada
- [x] Código atualizado (fornecedor + API)
- [x] Helper `public-access.ts` criado
- [ ] **Testado localmente** ⚠️ OBRIGATÓRIO
- [ ] Migration aplicada em desenvolvimento
- [ ] Links de fornecedor testados
- [ ] Criação de usuário testada
- [ ] Isolamento multi-tenant validado

### Após Aplicar em Produção:

- [ ] Deploy de código concluído
- [ ] Migration aplicada
- [ ] Testar link de fornecedor em produção
- [ ] Testar criação de usuário
- [ ] Monitorar logs por 24h
- [ ] Verificar se não há erros RLS

---

## 🚨 Plano de Rollback

Se algo der errado após aplicar:

### Rollback da Migration:

```sql
-- Reverter para policies antigas (INSEGURAS mas funcionais)

-- Cotações: voltar para USING (true)
DROP POLICY IF EXISTS "cotacoes_access_secure" ON cotacoes;
DROP POLICY IF EXISTS "cotacoes_write_tenant" ON cotacoes;
DROP POLICY IF EXISTS "cotacoes_update_tenant" ON cotacoes;
DROP POLICY IF EXISTS "cotacoes_delete_tenant" ON cotacoes;

CREATE POLICY "cotacoes_public_read"
  ON cotacoes
  FOR SELECT
  USING (true);

CREATE POLICY "cotacoes_tenant"
  ON cotacoes
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- Profiles: voltar para policy antiga
DROP POLICY IF EXISTS "profiles_self_access" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
DROP POLICY IF EXISTS "profiles_tenant_isolation" ON profiles;

CREATE POLICY "profiles_tenant"
  ON profiles
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));
```

### Rollback do Código:

```bash
# Reverter commit
git revert HEAD
git push

# Aguardar deploy
```

**Tempo de recuperação:** ~5 minutos

---

## ✅ Resumo Final

### Funcionalidade Mantida:

- ✅ Login/Logout
- ✅ Criar usuários
- ✅ CRUD requisições/cotações/pedidos
- ✅ Ver próprio profile
- ✅ Isolamento entre tenants
- ✅ Links de fornecedor (com código atualizado)
- ✅ Submeter proposta

### Melhorias:

- ✅ Sem `service_role` desnecessário
- ✅ Isolamento multi-tenant corrigido
- ✅ Acesso público controlado por token
- ✅ WITH CHECK em todas policies

### Riscos:

- ⚠️ **BAIXO** se aplicar na ordem certa (código → migration)
- ⚠️ **MÉDIO** se aplicar migration primeiro (downtime 2-5min)
- ⚠️ **ZERO** se testar localmente antes

---

## 🎯 Próximos Passos

### Opção 1: Aplicar Agora (Recomendado)

```bash
# 1. Testar localmente
supabase db reset && supabase db push
npm run dev
# Testar link de fornecedor

# 2. Se OK, commitar
git add .
git commit -m "fix: secure RLS policies and token validation"
git push

# 3. Aguardar deploy

# 4. Aplicar migration em produção
supabase db push --db-url [PRODUCTION_URL]
```

### Opção 2: Testar em Staging Primeiro

```bash
# 1. Criar branch staging
git checkout -b staging/rls-security

# 2. Push para staging
git push origin staging/rls-security

# 3. Testar em ambiente staging

# 4. Se OK, merge para main
git checkout main
git merge staging/rls-security
git push
```

### Opção 3: Aplicar Manualmente com Janela de Manutenção

```
1. Agendar janela (ex: domingo 2h da manhã)
2. Avisar usuários (se houver)
3. Aplicar código + migration
4. Testar
5. Avisar que voltou
```

---

**Recomendação:** Opção 1 (aplicar agora) se testar localmente primeiro.

**Tempo estimado:** 30min (teste local) + 10min (deploy) = 40min total

**Risco:** Baixo (se testar antes)

**Benefício:** Alta segurança + código limpo
