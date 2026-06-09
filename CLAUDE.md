# SupriFlow — SaaS de Gestão de Compras e Suprimentos

## Visão Geral
SaaS multi-tenant para gestão de compras, suprimentos e fornecedores.
Setores: Indústria/Manufatura e Varejo/Comércio. Mercado brasileiro.

## Stack
- Frontend: Next.js 14 App Router + TypeScript + TailwindCSS + shadcn/ui
- Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- Filas/Jobs: Supabase Edge Functions com pg_cron (jobs agendados)
- Pagamentos: Asaas (PIX + boleto + cartão)
- E-mails: Resend

## ⚠️ Regra de ouro — Multi-Tenant via RLS
O isolamento entre tenants é feito 100% pelo Row Level Security (RLS) do PostgreSQL.
TODA tabela que contém dados de tenant DEVE ter:
  1. Coluna `tenant_id uuid NOT NULL REFERENCES tenants(id)`
  2. RLS habilitado: `ALTER TABLE <tabela> ENABLE ROW LEVEL SECURITY;`
  3. Policy de isolamento baseada no JWT custom claim `tenant_id`

NUNCA usar o cliente Supabase com a service_role key no frontend.
O frontend SEMPRE usa o cliente anon com a sessão do usuário autenticado.

## Autenticação
- Supabase Auth gerencia login, cadastro, recuperação de senha e tokens
- Perfil e tenant_id são armazenados em `public.profiles` vinculado ao `auth.users`
- Custom claims JWT: { tenant_id, perfil } — injetados via Database Webhook + função PostgreSQL
- No frontend: `supabase.auth.getSession()` para obter o usuário logado

## Perfis (do maior para o menor acesso)
SUPER_ADMIN > ADMIN > GESTOR > COMPRADOR > SOLICITANTE / ALMOXARIFE / FINANCEIRO

## Numeração automática (isolada por tenant)
- Requisições: REQ-{YYYY}-{NNNN}  ex: REQ-2025-0042
- Cotações:    COT-{YYYY}-{NNNN}  ex: COT-2025-0007
- Pedidos:     PO-{YYYY}-{NNNN}   ex: PO-2025-0001
- Implementar via PostgreSQL function + SEQUENCE por tenant

## Padrões de código
- UI e mensagens: sempre em Português Brasileiro
- Commits: inglês, conventional commits (feat:, fix:, chore:, docs:)
- Nomes de arquivos: kebab-case
- Componentes React: PascalCase
- Funções e variáveis: camelCase
- Banco de dados: snake_case (padrão Supabase)
- Migrações: pasta `supabase/migrations/`, numeradas sequencialmente

## Estrutura de pastas
```
supriflow/
├── app/                    # Next.js 14 App Router
├── components/
├── lib/
│   └── supabase/
│       ├── client.ts       # createBrowserClient
│       └── server.ts       # createServerClient (para Server Components)
├── supabase/
│   ├── migrations/         # SQL migrations versionadas
│   ├── functions/          # Edge Functions
│   └── seed.sql
└── CLAUDE.md
```

## Validações brasileiras
- CNPJ: validar dígitos verificadores (lib `cpf-cnpj-validator`)
- CEP: https://viacep.com.br/ws/{cep}/json/
- Receita Federal: https://www.receitaws.com.br/v1/cnpj/{cnpj}
- Moeda: sempre BRL, formato pt-BR (R$ 1.234,56)
- NF-e XML: parser com `fast-xml-parser`

## APIs externas
- Asaas sandbox: https://sandbox.asaas.com/api/v3
- Asaas produção: https://api.asaas.com/v3
- Resend: https://api.resend.com
- ViaCEP: https://viacep.com.br
- ReceitaWS: https://www.receitaws.com.br

## Variáveis de ambiente necessárias
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # apenas em Edge Functions / server-side
RESEND_API_KEY=
EMAIL_FROM=noreply@supriflow.com.br
ASAAS_API_KEY=
NODE_ENV=development
