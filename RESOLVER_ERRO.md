# 🔧 Resolver Erros de Migration

## ❌ Erro que você está vendo:

```
ERROR: type "perfil_usuario" already exists
```
ou
```
ERROR: could not find valid entry for job
```

---

## ✅ SOLUÇÃO SIMPLES (Recomendada)

### Use o Reset Rápido:

1. **No SQL Editor do Supabase**, execute:

```sql
-- Copie e cole TODO o conteúdo de:
supabase/RESET_RAPIDO.sql
```

2. **Clique RUN**

3. **Aguarde 5 segundos**

4. **Agora aplique as 5 migrations NA ORDEM:**

#### Fase 1
```sql
-- Cole TODO o conteúdo de:
supabase/migrations/20250101000000_fase1_inicial.sql
-- RUN
```

#### Fase 2
```sql
-- Cole TODO o conteúdo de:
supabase/migrations/20250102000000_fase2_compras.sql
-- RUN
```

#### Fase 3
```sql
-- Cole TODO o conteúdo de:
supabase/migrations/20250103000000_fase3_fiscal_contratos.sql
-- RUN
```

#### Fase 4
```sql
-- Cole TODO o conteúdo de:
supabase/migrations/20250104000000_fase4_estoque_dashboard.sql
-- RUN
```

#### Fase 5
```sql
-- Cole TODO o conteúdo de:
supabase/migrations/20250105000000_fase5_saas.sql
-- RUN
```

---

## ✅ Verificar se deu certo

Execute no SQL Editor:

```sql
-- Deve mostrar 24 tabelas
SELECT COUNT(*) as total_tabelas
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Deve mostrar 3 planos
SELECT nome, preco_centavos/100.0 as preco_reais 
FROM planos 
ORDER BY ordem;

-- Deve mostrar os jobs
SELECT jobname, schedule 
FROM cron.job 
WHERE jobname LIKE '%-%'
ORDER BY jobname;
```

**Resultado esperado:**
- ✅ 24 tabelas
- ✅ 3 planos (Básico R$299, Profissional R$799, Enterprise R$0)
- ✅ 4 jobs (alertas-contratos, alerta-estoque, verificar-trial, reset-pos)

---

## 🎯 Depois de aplicar tudo:

### Configure o Auth Hook:

1. Vá em **Authentication → Hooks**
2. **Custom Access Token**
3. Função: `custom_access_token_hook`
4. **Save**

### Crie o Bucket:

1. **Storage → New bucket**
2. Nome: `documentos`
3. Public: **OFF**
4. **Create**

Depois execute as policies do bucket (no SQL Editor):

```sql
CREATE POLICY "documentos_tenant_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documentos' AND
    (storage.foldername(name))[1] = (auth.jwt()->'app_metadata'->>'tenant_id')
  );

CREATE POLICY "documentos_tenant_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documentos' AND
    (storage.foldername(name))[1] = (auth.jwt()->'app_metadata'->>'tenant_id')
  );

CREATE POLICY "documentos_tenant_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documentos' AND
    (storage.foldername(name))[1] = (auth.jwt()->'app_metadata'->>'tenant_id')
  );
```

---

## 🚀 Tudo pronto!

Agora rode:

```bash
npm run dev
```

E acesse: **http://localhost:3000**

---

## 💡 Dica

Se quiser verificar o que está instalado a qualquer momento:

```sql
-- Ver todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

3 tabelas = Fase 1 apenas  
14 tabelas = Até Fase 2  
18 tabelas = Até Fase 3  
20 tabelas = Até Fase 4  
**24 tabelas = ✅ COMPLETO!**

---

**Boa sorte! 🎉**
