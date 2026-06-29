# ✅ Deploy Checklist - Vercel + Supabase

## 📋 Resumo

Deploy realizado em 2026-06-29 com melhorias de branding e segurança RLS.

---

## 🚀 Status do Deploy

### ✅ Código
- [x] Commit criado: `93f4107`
- [x] Push para GitHub: `master`
- [x] Vercel detectando automaticamente

### ⏳ Aguardando
- [ ] Deploy Vercel completar (2-3 min)
- [ ] Migration RLS aplicada no Supabase
- [ ] Testes de funcionalidade

---

## 📦 O Que Foi Deployado

### 1. **Landing Page - Branding**
```
✅ Nome SupriFlow em destaque (96px, gradiente)
✅ Linha decorativa com shimmer
✅ Tagline descritiva
✅ Botões com cores consistentes (verde esmeralda)
```

### 2. **Design Editorial**
```
✅ Tipografia: Space Grotesk + IBM Plex Serif
✅ Animações sutis: glow, shimmer, stagger reveal
✅ Cards com hover 3D refinado
✅ CSS module: page-editorial.module.css
```

### 3. **Segurança RLS**
```
✅ Self-access policies (profiles)
✅ Token validation (cotações públicas)
✅ WITH CHECK em todas policies
✅ Removido service_role desnecessário
✅ Helper: lib/supabase/public-access.ts
```

### 4. **Migration SQL**
```
✅ supabase/migrations/20260629000000_fix_rls_security.sql
⚠️  PRECISA SER APLICADA MANUALMENTE NO SUPABASE
```

---

## ⚠️ PASSO CRÍTICO - Aplicar Migration

**IMPORTANTE:** A migration RLS está no código mas **NÃO é aplicada automaticamente**.

### Opção 1: Supabase Dashboard (Recomendado)

```bash
1. Abrir: https://supabase.com/dashboard/project/[SEU-PROJECT]
2. Ir em: SQL Editor
3. Abrir arquivo: supabase/migrations/20260629000000_fix_rls_security.sql
4. Copiar TODO o conteúdo
5. Colar no SQL Editor
6. Clicar: Run (ou Ctrl+Enter)
7. Verificar output:
   ✅ Policies criadas
   ✅ Funções criadas
   ⚠️  Avisos sobre tabelas que não existem (normal)
```

### Opção 2: Supabase CLI

```bash
# Se tiver Supabase CLI instalado
supabase db push --db-url "postgresql://..."

# OU conectar ao projeto
supabase link --project-ref [PROJECT-REF]
supabase db push
```

---

## 🧪 Checklist de Testes

### Após Deploy + Migration:

#### 1. **Landing Page**
```
[ ] Abrir: https://[SEU-DOMINIO].vercel.app
[ ] Verificar: Nome "SupriFlow" em destaque
[ ] Verificar: Animação de brilho no nome
[ ] Verificar: Linha com shimmer
[ ] Verificar: Botões verdes (não cinza)
[ ] Verificar: Responsivo em mobile
```

#### 2. **Login / Criar Usuário**
```
[ ] Login funciona normalmente
[ ] Criar usuário como ADMIN
[ ] Verificar: Profile criado automaticamente
[ ] Verificar: Sem erros de RLS
```

#### 3. **Links de Fornecedor (CRÍTICO)**
```
[ ] Pegar token de item_cotacao do banco
[ ] Abrir: https://[DOMINIO]/fornecedor/[TOKEN]
[ ] Verificar: Cotação carrega (SEM "permission denied")
[ ] Preencher valores
[ ] Submeter proposta
[ ] Verificar: Proposta salva com sucesso
```

#### 4. **Isolamento Multi-Tenant**
```
[ ] Login como Tenant A
[ ] Tentar acessar cotação do Tenant B via URL
[ ] Verificar: Não carrega dados do outro tenant
[ ] Verificar: Sem erro (apenas não mostra)
```

#### 5. **Criar Produto/Requisição**
```
[ ] Criar produto novo
[ ] Criar requisição nova
[ ] Verificar: tenant_id correto
[ ] Verificar: Dados salvos com sucesso
```

---

## 🔍 Verificações de Segurança

### RLS Ativo?
```sql
-- Rodar no Supabase SQL Editor:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'cotacoes', 'fornecedores');

-- Esperado:
-- profiles    | true
-- cotacoes    | true
-- fornecedores| true
```

### Policies Criadas?
```sql
-- Verificar policies:
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('profiles', 'cotacoes')
ORDER BY tablename, policyname;

-- Esperado para profiles:
-- profiles_self_access
-- profiles_self_update
-- profiles_tenant_isolation
-- profiles_insert_system

-- Esperado para cotacoes:
-- cotacoes_access_secure
-- cotacoes_write_tenant
-- cotacoes_update_tenant
-- cotacoes_delete_tenant
```

### Função Criada?
```sql
-- Verificar função:
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN ('validar_token_cotacao', 'set_cotacao_token');

-- Esperado: 2 resultados
```

---

## 🚨 Se Algo Der Errado

### Problema 1: Links de fornecedor quebrados
**Sintoma:** "Cotação não encontrada" ou "permission denied"

**Causa:** Migration não foi aplicada

**Solução:**
```
1. Aplicar migration (ver Opção 1 acima)
2. Verificar que função validar_token_cotacao existe
3. Testar novamente
```

### Problema 2: Erro ao criar usuário
**Sintoma:** "Erro ao buscar dados do administrador"

**Causa:** Policy profiles_self_access não existe

**Solução:**
```
1. Verificar que migration foi aplicada
2. Verificar policies de profiles
3. Se não existir, aplicar migration novamente
```

### Problema 3: Fontes não carregam
**Sintoma:** Textos em fonte padrão (não Space Grotesk)

**Causa:** Google Fonts bloqueado ou erro de import

**Solução:**
```
1. Verificar console do navegador (F12)
2. Se erro de CORS, aguardar cache limpar
3. Hard refresh: Ctrl+Shift+R
```

### Problema 4: Animações não funcionam
**Sintoma:** Nome estático, sem brilho

**Causa:** CSS module não carregado

**Solução:**
```
1. Verificar que page-editorial.module.css existe
2. Hard refresh: Ctrl+Shift+R
3. Verificar import em page.tsx
```

---

## 🔄 Rollback (Se Necessário)

### Reverter Deploy:
```bash
# Via Vercel Dashboard:
1. Ir em: Deployments
2. Encontrar deploy anterior (ac3ac84)
3. Clicar: ... → Redeploy
4. Confirmar
```

### Reverter Migration:
```sql
-- Rodar no Supabase SQL Editor:

-- Remover policies novas
DROP POLICY IF EXISTS "profiles_self_access" ON profiles;
DROP POLICY IF EXISTS "cotacoes_access_secure" ON cotacoes;
-- ... etc

-- Recriar policies antigas
CREATE POLICY "profiles_tenant" ON profiles
  FOR ALL USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

CREATE POLICY "cotacoes_public_read" ON cotacoes
  FOR SELECT USING (true);  -- ⚠️ INSEGURO mas funcional
```

---

## 📊 Métricas Esperadas

### Performance:
```
Lighthouse Score:
- Performance: 90+ (fontes Google podem reduzir)
- Accessibility: 100
- Best Practices: 100
- SEO: 100

Core Web Vitals:
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
```

### Funcionalidades:
```
✅ 100% das funcionalidades mantidas
✅ 0 downtime (deploy gradual)
✅ Links de fornecedor funcionando
✅ Criação de usuários funcionando
✅ Isolamento multi-tenant mantido
```

---

## 📝 Comandos Úteis

### Verificar logs Vercel:
```bash
# Se tiver Vercel CLI instalado
vercel logs [DEPLOYMENT-URL]
```

### Verificar logs Supabase:
```
Dashboard → Logs → Postgres Logs
Filtrar por: "ERROR" ou "WARNING"
```

### Limpar cache browser:
```
Chrome: Ctrl+Shift+Delete → Cached images/files
Firefox: Ctrl+Shift+Delete → Cache
```

### Hard refresh:
```
Chrome/Edge: Ctrl+Shift+R
Firefox: Ctrl+F5
```

---

## ✅ Checklist Final

### Deploy Completo Quando:

- [x] Código no GitHub
- [ ] Deploy Vercel concluído
- [ ] Migration RLS aplicada no Supabase
- [ ] Landing page carrega com branding
- [ ] Login funciona
- [ ] Criar usuário funciona
- [ ] Links de fornecedor funcionam
- [ ] Isolamento multi-tenant OK
- [ ] Sem erros no console
- [ ] Lighthouse score OK

### Comunicação:

- [ ] Avisar usuários se houver (se aplicável)
- [ ] Monitorar logs primeiras 24h
- [ ] Verificar métricas Vercel Analytics
- [ ] Criar backup antes de próximo deploy

---

## 🎯 Próximos Passos

### Imediato:
1. ⏳ Aguardar deploy Vercel (2-3 min)
2. ⚠️ Aplicar migration RLS no Supabase
3. 🧪 Testar funcionalidades críticas

### Após Validar:
- [ ] Monitorar erros por 24h
- [ ] Verificar analytics/métricas
- [ ] Ajustar se necessário
- [ ] Documentar aprendizados

---

**Deploy iniciado em:** 2026-06-29  
**Commit:** 93f4107  
**Status:** ⏳ EM PROGRESSO  
**Próximo passo:** APLICAR MIGRATION RLS
