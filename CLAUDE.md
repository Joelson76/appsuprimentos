# SupriFlow — SaaS de Gestão de Compras e Suprimentos

## Visão Geral
SaaS multi-tenant para gestão de compras, suprimentos e fornecedores.
Setores: Indústria/Manufatura e Varejo/Comércio. Mercado brasileiro.

**Desenvolvido por:** JLS Tecnologia  
**Logo:** `jls2.jpg` (assets/logo-jls.jpg)

## Identidade da Marca
- **Produto:** SupriFlow
- **Empresa:** JLS Tecnologia
- **Slogan:** Sistema Completo de Gestão de Compras e Suprimentos
- **Contato:** joelson76@gmail.com
- **Cores principais:** Gradiente roxo/azul (#667eea → #764ba2)
- **Logo:** Azul/Teal da JLS Tecnologia presente em todas apresentações e comunicações

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

## Sistema de Filiais (Multi-CNPJ)
Desde 2026-06-19, o sistema suporta múltiplas filiais por tenant.
- Cada tenant pode ter 1 matriz + N filiais, cada uma com CNPJ próprio
- Tabela `filiais`: armazena CNPJ, endereço, status
- Coluna `filial_id` adicionada em: profiles, requisicoes, cotacoes, ordens_compra, fornecedores
- RLS: filiais visíveis apenas para o tenant dono
- Validação: apenas 1 matriz por tenant (constraint `uq_tenant_matriz`)
- Migration: `20260619000001_add_filiais.sql`

## Classificação de Produtos
Desde 2026-06-22, produtos podem ser classificados para melhor gestão de compras.
- **COMPRAS_DIRETAS**: Produtos para produção/revenda (matérias-primas, componentes)
- **COMPRAS_INDIRETAS**: Insumos operacionais MRO (limpeza, escritório, manutenção)
- **ATIVOS_IMOBILIZADOS**: Bens de capital (máquinas, equipamentos, veículos)
- **USO_IMEDIATO**: Consumo direto sem estocagem (serviços, pequenos valores)
- Enum `classificacao_produto` criado no banco
- Coluna `classificacao` adicionada em `produtos`
- View `vw_produtos_por_classificacao` para análise por tipo
- Relatório disponível em `/relatorios/classificacao-produtos`
- Migration: `20260622000000_classificacao_produtos_SAFE.sql`
- Documentação: `docs/CLASSIFICACAO_PRODUTOS.md`

## Vínculo de Produtos em Requisições/Cotações/Pedidos
Desde 2026-06-22, requisições, cotações e pedidos **usam apenas produtos cadastrados**.
- Coluna `produto_id` adicionada em: `itens_requisicao`, `itens_cotacao`, `itens_pedido`
- Campo `descricao` se tornou opcional (preenchido automaticamente pelo produto)
- View `vw_itens_requisicao_completo` combina item + dados do produto
- View `vw_produtos_mais_requisitados` para análise de demanda
- Função `validar_estoque_requisicao()` verifica disponibilidade
- Componente `SelectorProduto` com alertas de estoque (Crítico/Baixo/Normal)
- Unidade e valor estimado preenchidos automaticamente
- Compatibilidade: itens antigos com texto livre continuam funcionando
- Migration: `20260622000001_vincular_produtos_requisicoes.sql`
- Documentação: `docs/PRODUTOS_REQUISICOES.md`

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
