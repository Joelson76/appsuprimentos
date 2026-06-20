# 🚀 Passo a Passo - Ativar Templates de E-mail

## ❌ Problema Atual
A tabela `email_templates` **NÃO EXISTE** no banco de dados.
Por isso a página está vazia!

---

## ✅ Solução em 3 Passos

### 📍 PASSO 1: Acessar Supabase

Abra esta URL:
```
https://supabase.com/dashboard/project/rmypzuhbfechbxuikyht/editor
```

Você verá o **SQL Editor** do Supabase.

---

### 📍 PASSO 2: Executar SQL 1 (Criar Tabela)

1. **Abra o arquivo localmente**:
   ```
   EXECUTAR_NO_SUPABASE.sql
   ```

2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)

3. **Cole no SQL Editor** do Supabase

4. **Clique em RUN** (ou pressione Ctrl+Enter)

5. **Aguarde** a mensagem: ✅ Success. No rows returned

---

### 📍 PASSO 3: Executar SQL 2 (Criar Templates Prontos)

1. **Abra o arquivo localmente**:
   ```
   migrations/20260620000003_insert_default_templates.sql
   ```

2. **Copie TODO o conteúdo** (548 linhas - sim, é grande!)

3. **Cole no SQL Editor** do Supabase

4. **Clique em RUN**

5. **Aguarde** a mensagem de sucesso

6. **Execute este comando final**:
   ```sql
   SELECT criar_templates_padrao('c7f69c82-0968-4190-a26e-eb6005ee3a9c');
   ```

7. **Confirme** que retornou: ✅ Success

---

### 📍 PASSO 4: Verificar no Sistema

1. **Acesse**:
   ```
   http://localhost:3000/configuracoes/templates-email
   ```

2. **Você verá 5 templates**:
   - ✅ 💰 Padrão - Cotação Enviada
   - ✅ 🛒 Padrão - Pedido de Compra
   - ✅ ⚠️ Padrão - Alerta de Estoque
   - ✅ 🎉 Padrão - Boas-vindas
   - ✅ 💳 Padrão - Fatura Gerada

3. **Clique em "Preview"** para ver como ficam!

---

## 🎯 Resumo Visual

```
┌─────────────────────────────────────────┐
│  AGORA                                  │
├─────────────────────────────────────────┤
│  Página Vazia                           │
│  ❌ Nenhum template encontrado          │
└─────────────────────────────────────────┘
                 ↓
          Execute os SQLs
                 ↓
┌─────────────────────────────────────────┐
│  DEPOIS                                 │
├─────────────────────────────────────────┤
│  ✅ 5 Templates Prontos                 │
│  📧 Design profissional                 │
│  🎨 Totalmente personalizáveis          │
│  👁️ Preview disponível                  │
└─────────────────────────────────────────┘
```

---

## 🆘 Ajuda Rápida

### Se der erro "tipo_template_email already exists"
O tipo ENUM já existe. Pule a parte do CREATE TYPE e execute o resto.

### Se der erro "table already exists"
A tabela já foi criada. Pule para o PASSO 3.

### Se não aparecer nada mesmo depois
Execute no SQL Editor:
```sql
-- Verificar se a tabela existe
SELECT COUNT(*) FROM email_templates;

-- Verificar seus templates
SELECT tipo, nome, ativo 
FROM email_templates 
WHERE tenant_id = 'c7f69c82-0968-4190-a26e-eb6005ee3a9c';
```

Se retornar 0 templates, execute novamente:
```sql
SELECT criar_templates_padrao('c7f69c82-0968-4190-a26e-eb6005ee3a9c');
```

---

## 📞 Precisa de Ajuda?

Me avise se der qualquer erro e copie a mensagem exata que apareceu!

---

🎉 **Depois de executar, seus templates estarão prontos para usar!**
