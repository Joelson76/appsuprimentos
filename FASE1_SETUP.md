# Fase 1 - Setup e Configuração

## ✅ O que foi implementado

### Estrutura do Projeto
- ✅ Next.js 14 com App Router + TypeScript + TailwindCSS
- ✅ shadcn/ui configurado e componentes instalados
- ✅ Clientes Supabase (browser e server)
- ✅ Middleware para proteção de rotas
- ✅ Estrutura de pastas organizada

### Banco de Dados
- ✅ Migration SQL completa em `supabase/migrations/20250101000000_fase1_inicial.sql`
- ✅ Tabelas: tenants, profiles, audit_logs
- ✅ Enums: perfil_usuario, status_tenant, plano_tipo
- ✅ Row Level Security (RLS) configurado
- ✅ Triggers automáticos (updated_at, handle_new_user)
- ✅ Função de custom claims JWT

### Autenticação
- ✅ Página de login funcional
- ✅ Página de cadastro com 3 steps (empresa, admin, plano)
- ✅ API route de registro (`/api/auth/register`)
- ✅ Validação de CNPJ
- ✅ Trial automático de 14 dias

### Dashboard
- ✅ Layout com Sidebar e Header
- ✅ Página inicial do dashboard com cards de métricas
- ✅ Página de usuários com listagem
- ✅ Logout funcional

---

## 🚀 Como Configurar

### 1. Criar projeto no Supabase

1. Acesse https://supabase.com
2. Crie um novo projeto
3. Aguarde a criação do banco de dados
4. Anote as credenciais:
   - **Project URL**: encontrado em Settings > API
   - **anon/public key**: encontrado em Settings > API
   - **service_role key**: encontrado em Settings > API (⚠️ NUNCA expor no frontend)

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Resend (configurar depois)
RESEND_API_KEY=
EMAIL_FROM=noreply@supriflow.com.br

# Asaas (configurar depois)
ASAAS_API_KEY=

NODE_ENV=development
```

### 3. Aplicar a migration no Supabase

Você tem 2 opções:

#### Opção A: Via Dashboard do Supabase (mais fácil)

1. Abra o SQL Editor no dashboard do Supabase
2. Copie todo o conteúdo de `supabase/migrations/20250101000000_fase1_inicial.sql`
3. Cole no SQL Editor
4. Execute (Run)
5. Verifique se as tabelas foram criadas em "Table Editor"

#### Opção B: Via Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref seu-projeto-ref

# Aplicar migrations
supabase db push
```

### 4. Configurar o Auth Hook

⚠️ **IMPORTANTE**: O custom claims JWT precisa ser configurado manualmente no dashboard:

1. Acesse o dashboard do Supabase
2. Vá em **Authentication > Hooks**
3. Selecione **Custom Access Token Hook**
4. Configure:
   - **Hook Type**: SQL
   - **Function**: `custom_access_token_hook`
5. Salve

### 5. Testar o sistema

```bash
# Instalar dependências (se ainda não fez)
npm install

# Rodar em desenvolvimento
npm run dev
```

Acesse http://localhost:3000

---

## 📋 Checklist de Testes

### Cadastro e Login
- [ ] Acessar `/cadastro`
- [ ] Preencher dados da empresa com CNPJ válido
- [ ] Preencher dados do administrador
- [ ] Selecionar plano
- [ ] Cadastrar com sucesso
- [ ] Fazer login com as credenciais criadas
- [ ] Verificar redirecionamento para `/dashboard`

### Dashboard
- [ ] Visualizar dashboard com informações da empresa
- [ ] Ver badge de trial ativo
- [ ] Verificar se o nome do usuário aparece no header
- [ ] Testar logout

### Usuários
- [ ] Acessar `/usuarios`
- [ ] Ver o usuário admin cadastrado
- [ ] Verificar badge "Você" no próprio usuário

### Multi-Tenant (RLS)
- [ ] Criar uma segunda empresa
- [ ] Fazer login com a segunda empresa
- [ ] Verificar que NÃO aparecem dados da primeira empresa

---

## 🔧 Troubleshooting

### Erro: "Invalid API key"
- Verifique se as variáveis de ambiente estão corretas
- Reinicie o servidor de desenvolvimento (`npm run dev`)

### Erro: "relation 'tenants' does not exist"
- A migration não foi aplicada
- Execute a migration via SQL Editor no dashboard do Supabase

### Erro: "tenant_id not found in JWT"
- O Auth Hook não foi configurado
- Configure o hook manualmente no dashboard (passo 4)

### Erro: "CNPJ já cadastrado"
- Use outro CNPJ para testar
- Ou delete o tenant existente no banco de dados

### Redirecionamento infinito
- Limpe os cookies do navegador
- Verifique se o middleware está funcionando corretamente

---

## 📚 Próximos Passos (Fase 2)

Após validar a Fase 1, podemos implementar:

1. **Módulo de Fornecedores**: CRUD completo
2. **Requisições de Compra**: Workflow de aprovação
3. **Cotações**: Comparativo de fornecedores
4. **Pedidos de Compra**: Numeração automática
5. **Edge Functions**: Buscar CNPJ, enviar e-mails, gerar PDFs

---

## 🎯 Status: PRONTO PARA TESTAR

A Fase 1 está completa e pronta para ser testada!

1. Configure as variáveis de ambiente
2. Aplique a migration
3. Configure o Auth Hook
4. Teste o cadastro e login
