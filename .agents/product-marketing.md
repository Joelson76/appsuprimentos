# Product Marketing Context - SupriFlow

## Product Overview

**Product Name:** SupriFlow  
**Tagline:** Sistema Completo de Gestão de Compras e Suprimentos  
**Company:** JLS Tecnologia  
**Contact:** joelson76@gmail.com  
**Website:** (em desenvolvimento)  
**Logo:** Azul/Teal da JLS Tecnologia (assets/logo-jls.jpg)

## What We Do

SupriFlow é um SaaS multi-tenant para gestão completa de compras, suprimentos e fornecedores. Ajudamos empresas brasileiras dos setores de Indústria/Manufatura e Varejo/Comércio a:

- **Centralizar** todas as requisições de compra em um único sistema
- **Automatizar** processos de cotação com múltiplos fornecedores
- **Controlar** ordens de compra, recebimentos e estoque
- **Analisar** performance de fornecedores e KPIs de compras
- **Reduzir custos** através de melhor negociação e controle
- **Garantir compliance** com políticas de alçada e aprovações

## Target Market

### Primary Market
**B2B SaaS** - Empresas brasileiras de médio porte

### Industries
1. **Indústria/Manufatura** (primary)
   - Fábricas e indústrias de transformação
   - Necessidade crítica de controle de matéria-prima e insumos MRO
   - Gestão de múltiplas filiais e CNPJs

2. **Varejo/Comércio** (secondary)
   - Redes de lojas e comércio
   - Gestão de produtos para revenda
   - Controle de múltiplos pontos de venda

### Company Size
- 20-500 funcionários
- Faturamento: R$ 5M - R$ 100M/ano
- Múltiplas filiais (1 matriz + N filiais)

## Target Personas

### 1. Diretor de Suprimentos / Compras (Economic Buyer)
**Dores:**
- Falta de visibilidade sobre o que está sendo comprado
- Processos manuais e lentos (planilhas, e-mails)
- Dificuldade em comparar preços e negociar
- Não consegue medir performance dos fornecedores
- Risco de compras fora da política (maverick spending)

**Objetivos:**
- Reduzir custos de aquisição em 10-20%
- Aumentar eficiência do time de compras
- Garantir compliance com políticas aprovadas
- Ter dashboards e KPIs em tempo real

### 2. Gerente de Compras (Champion)
**Dores:**
- Muito tempo perdido com cotações manuais
- Difícil rastrear status de requisições
- Fornecedores demoram a responder
- Planilhas desatualizadas e descentralizadas
- Retrabalho e falta de histórico

**Objetivos:**
- Agilizar processo de cotação
- Ter histórico completo de compras
- Melhorar relacionamento com fornecedores
- Reduzir tempo de aprovação

### 3. Comprador / Analista (End User)
**Dores:**
- Sistema atual é complicado/lento
- Muitas aprovações manuais
- Difícil encontrar fornecedores homologados
- Não sabe histórico de preços

**Objetivos:**
- Interface simples e rápida
- Processo claro de aprovação
- Acesso fácil a fornecedores cadastrados
- Ver histórico de compras anteriores

### 4. Solicitante / Requisitante (Secondary User)
**Dores:**
- Precisa mandar e-mail ou preencher formulário manual
- Não sabe o status da requisição
- Demora muito para chegar o material

**Objetivos:**
- Fazer requisição de forma simples
- Acompanhar status em tempo real
- Receber notificações automáticas

## Value Proposition

### Main Promise
"Reduza custos e ganhe eficiência transformando seu processo de compras de planilhas e e-mails em um sistema profissional e automatizado"

### Key Benefits

**1. Economia de Tempo**
- 70% menos tempo em cotações (automação de envio para fornecedores)
- 50% menos retrabalho (tudo centralizado, histórico completo)

**2. Redução de Custos**
- 10-20% de economia em compras (melhor comparação e negociação)
- Evita compras duplicadas e maverick spending

**3. Controle Total**
- Alçadas de aprovação configuráveis
- RLS (Row Level Security) para isolamento multi-tenant
- Rastreabilidade completa de todo o processo

**4. Visibilidade**
- Dashboards e KPIs em tempo real
- Avaliação de performance de fornecedores
- Histórico de preços e análise de tendências

**5. Compliance**
- Sistema de aprovações por perfil (SUPER_ADMIN > ADMIN > GESTOR > COMPRADOR > SOLICITANTE)
- Auditoria completa de alterações
- Integração com NF-e XML

## Unique Selling Points (USPs)

1. **Multi-Tenant Nativo com RLS**
   - Arquitetura segura desde a origem
   - Cada tenant totalmente isolado via PostgreSQL RLS
   - Suporte a múltiplas filiais com CNPJs diferentes

2. **Brasileiro por Design**
   - Validação de CNPJ/CEP nativa
   - Integração com Receita Federal
   - Parsing de NF-e XML
   - Valores em Real (R$), formato pt-BR

3. **Sistema Completo de Gestão de Compras**
   - Não apenas requisições, mas todo o ciclo:
     - Requisição → Cotação → Ordem de Compra → Recebimento → Pagamento
   - Gestão de fornecedores, produtos e contratos

4. **Classificação Inteligente de Produtos**
   - COMPRAS_DIRETAS (produção/revenda)
   - COMPRAS_INDIRETAS (MRO - manutenção, reparo, operação)
   - ATIVOS_IMOBILIZADOS (capex)
   - USO_IMEDIATO (consumo direto)

5. **Automação de Cotações**
   - Links únicos para fornecedores responderem
   - WhatsApp e e-mail automáticos
   - Comparação lado a lado

6. **KPIs e Analytics Nativos**
   - Performance de fornecedores
   - Histórico de preços
   - Alertas de estoque
   - Lead time médio

## Pricing Model

**SaaS por Assinatura (Mensal/Anual)**

### Planos (via Asaas - PIX, Boleto, Cartão)

1. **TRIAL** - R$ 0/mês (14 dias)
   - 1 usuário
   - 10 requisições/mês
   - Funcionalidades básicas
   - Ideal para: Teste do sistema

2. **STARTER** - R$ 197/mês
   - Até 5 usuários
   - 50 requisições/mês
   - 1 filial
   - Suporte por e-mail
   - Ideal para: Pequenas empresas

3. **PROFESSIONAL** - R$ 497/mês
   - Até 20 usuários
   - Requisições ilimitadas
   - Até 5 filiais
   - Suporte prioritário
   - Dashboards avançados
   - Ideal para: Médias empresas

4. **ENTERPRISE** - R$ 997/mês
   - Usuários ilimitados
   - Requisições ilimitadas
   - Filiais ilimitadas
   - Suporte dedicado (WhatsApp)
   - Customizações
   - Treinamento incluído
   - API para integração
   - Ideal para: Grandes empresas e grupos

### Add-ons
- Filiais extras: R$ 50/filial/mês
- Usuários extras: R$ 20/usuário/mês
- Integração customizada: sob consulta

## Competition

### Direct Competitors
1. **Bling** - ERP com módulo de compras (limitado)
2. **Omie** - ERP com gestão de compras (complexo)
3. **Conta Azul** - Gestão empresarial (foco em fiscal/financeiro)

**Nossa vantagem:** Foco 100% em compras e suprimentos, mais simples e especializado

### Indirect Competitors
- **Planilhas Excel** (principal concorrente!)
- **E-mail + WhatsApp**
- **ERPs grandes** (SAP, TOTVS) - muito caros e complexos

### Why SupriFlow Wins
- Mais barato e simples que ERPs grandes
- Mais profissional e robusto que planilhas
- Especializado em compras (não tenta fazer tudo)
- Brasileiro por design (CNPJ, NF-e, etc.)

## Tech Stack

**Frontend:** Next.js 14 + TypeScript + TailwindCSS + shadcn/ui  
**Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)  
**Payments:** Asaas (PIX + Boleto + Cartão)  
**Email:** Resend  
**Deployment:** Vercel (recomendado)

## Brand Voice

### Tone
- **Profissional** mas acessível
- **Direto** e objetivo (setor industrial aprecia eficiência)
- **Confiável** e técnico (dados, números, segurança)
- **Brasileiro** (sem estrangeirismos desnecessários)

### Do's
✅ Falar em economia de tempo e dinheiro (ROI claro)  
✅ Usar casos reais e exemplos práticos  
✅ Destacar segurança e compliance  
✅ Enfatizar simplicidade vs ERPs complexos  
✅ Mostrar que entendemos o processo de compras industrial  

### Don'ts
❌ Não usar jargão excessivo ou termos em inglês sem necessidade  
❌ Não prometer "revolucionar" ou superlativos vazios  
❌ Não comparar diretamente com concorrentes (focar em valor)  
❌ Não subestimar a importância de planilhas (reconhecer que funcionam, mas têm limites)  

## Key Messages

### Elevator Pitch (30s)
"SupriFlow é o sistema completo de gestão de compras e suprimentos para indústrias e varejos brasileiros. Transformamos seu processo de planilhas e e-mails em um sistema profissional que reduz custos, ganha tempo e dá controle total sobre suas aquisições."

### Problem Statement
"Empresas brasileiras de médio porte ainda gerenciam compras com planilhas, e-mails e WhatsApp. Isso gera retrabalho, falta de controle, dificuldade em comparar preços e risco de compras fora da política. ERPs tradicionais são muito caros e complexos para essa necessidade."

### Solution
"SupriFlow centraliza todo o ciclo de compras em uma plataforma simples: requisição, cotação automática com fornecedores, aprovações por alçada, ordem de compra, recebimento e análise de performance. Tudo com segurança multi-tenant, suporte a múltiplas filiais e integração com documentos fiscais brasileiros."

## Marketing Channels (Priority)

1. **LinkedIn Organic + Ads** (B2B manufacturing/retail)
2. **Google Ads** (search: "sistema de compras", "gestão de suprimentos")
3. **Content Marketing** (blog SEO sobre gestão de compras)
4. **Cold Email** (diretores de compras/suprimentos)
5. **Partnerships** (consultorias, integradores de sistemas)
6. **Marketplace/Directories** (GetApp, Capterra, G2 - futuro)

## Current Stage

**Status:** MVP em desenvolvimento  
**Next Milestones:**
- [ ] Landing page institucional
- [ ] Onboarding automatizado para trial
- [ ] Programa de beta testers (3-5 empresas)
- [ ] Primeiros clientes pagantes

## Notes for Marketing Copy

- Sempre use valores em R$ (Real Brasileiro)
- Mencione "multi-tenant" apenas para público técnico
- Para público executivo: falar em "segurança", "isolamento de dados"
- Destacar que suporta múltiplas filiais/CNPJs (importante para indústrias)
- Case study futuro: mostrar % de redução de custos e tempo
- Screenshot das telas principais (dashboard, cotação, requisição)
- Vídeo demo curto (2-3min) do fluxo completo

---

**Last Updated:** 2026-06-29  
**Maintained by:** JLS Tecnologia
