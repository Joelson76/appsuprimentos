# SupriFlow - Sistema de Gestão de Compras e Suprimentos

SaaS multi-tenant para gestão de compras, suprimentos e fornecedores.

## 🚀 Stack Tecnológico

- **Frontend:** Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Pagamentos:** Asaas (PIX + Boleto + Cartão)
- **E-mails:** Resend

## ✨ Funcionalidades Implementadas

- ✅ Requisições de Compra
- ✅ Cotações com Portal do Fornecedor
- ✅ Comparação de Propostas por Item
- ✅ Geração Automática de Pedidos
- ✅ Multi-Tenant com RLS

## 📦 Deploy na Vercel

### 1. Configure as variáveis de ambiente:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 2. Execute as migrations no Supabase

### 3. Deploy:

```bash
vercel
```

## 🛠️ Desenvolvimento Local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Acesse http://localhost:3000

## 📖 Documentação

- [CLAUDE.md](./CLAUDE.md) - Guia de desenvolvimento
- [PROXIMOS_PASSOS.md](./PROXIMOS_PASSOS.md) - Roadmap

---

Desenvolvido com ❤️ usando Next.js e Supabase
