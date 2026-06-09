# SupriFlow

SaaS multi-tenant para gestão de compras, suprimentos e fornecedores.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Pagamentos:** Asaas
- **E-mails:** Resend

## Getting Started

1. Clone o repositório
2. Copie `.env.example` para `.env.local` e preencha as variáveis
3. Instale as dependências:

```bash
npm install
```

4. Execute o projeto em desenvolvimento:

```bash
npm run dev
```

5. Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
supriflow/
├── app/                    # Next.js App Router
├── components/             # Componentes React
├── lib/                    # Utilitários e configurações
│   └── supabase/          # Clientes Supabase
├── supabase/
│   ├── migrations/        # Migrações SQL
│   └── functions/         # Edge Functions
└── CLAUDE.md              # Documentação do projeto
```

## Multi-Tenancy

O isolamento entre empresas (tenants) é garantido via **Row Level Security (RLS)** do PostgreSQL.

- JWT contém `tenant_id` do usuário logado
- Todas as queries são automaticamente filtradas pelo RLS
- Zero possibilidade de vazamento de dados entre tenants

## Documentação

Veja [CLAUDE.md](./CLAUDE.md) para detalhes completos da arquitetura e convenções.

## License

Proprietary - Todos os direitos reservados
