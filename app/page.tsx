import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import styles from './page-editorial.module.css'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  CheckCircle2,
  Zap,
  Shield,
  TrendingUp,
  Users,
  FileText,
  BarChart3,
  Clock,
  Sparkles,
  ArrowRight,
  Star,
} from 'lucide-react'
import { FloatingContactButtons } from '@/components/ui/floating-contact-buttons'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 w-full bg-white border-b shadow-sm z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-jls.jpg"
              alt="JLS Tecnologia"
              width={40}
              height={40}
              className="object-contain"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                SupriFlow
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1">
                by JLS Tecnologia
              </span>
            </div>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Planos
            </a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
              Depoimentos
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">Entrar</Button>
            </Link>
            <Link href="/cadastro">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">{/* pt-16 = altura do header fixo */}
        {/* Hero Section */}
        <section className={`relative py-20 md:py-32 overflow-hidden ${styles.diagonalMesh}`}>
          <div className="absolute inset-0 -z-10" />

          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-8">
              <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-50 text-emerald-800 text-sm font-semibold border border-emerald-200 ${styles.badgeShimmer} ${styles.scrollReveal}`}>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Usado por +50 indústrias e varejos no Brasil
              </div>

              {/* Nome da Marca em Destaque */}
              <div className={`${styles.staggerReveal} space-y-3`}>
                <div className="inline-block">
                  <h1 className={`text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3 ${styles.brandName}`}>
                    SupriFlow
                  </h1>
                  <div className={`h-1 w-full rounded-full ${styles.brandUnderline}`}></div>
                </div>
                <p className="text-lg md:text-xl text-slate-600 font-medium">
                  Sistema Completo de Gestão de Compras e Suprimentos
                </p>
              </div>

              <h2 className={`${styles.editorialHeadline} max-w-4xl ${styles.staggerReveal}`}>
                Reduza <em>20% dos Custos</em> de Compras em 60 Dias
              </h2>

              <p className="text-xl text-muted-foreground max-w-2xl">
                Transforme planilhas e e-mails em um sistema profissional de gestão de compras.
                70% menos tempo em cotações. Aprovações automáticas. KPIs em tempo real.
              </p>

              <div className={`flex flex-col sm:flex-row gap-4 ${styles.scrollReveal}`}>
                <Link href="/cadastro">
                  <Button size="lg" className={`h-14 px-10 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white ${styles.ctaMagnetic}`}>
                    Começar Teste Grátis por 14 Dias
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 border-slate-300 hover:bg-slate-50">
                    Ver Como Funciona
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-sm text-muted-foreground pt-8">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Sem cartão de crédito
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Setup em 5 minutos
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Suporte em português
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - Social Proof com Números Reais */}
        <section className="py-16 bg-white border-y border-slate-200">
          <div className="container px-4">
            <p className="text-center text-slate-500 mb-8 text-sm uppercase tracking-wide font-medium">
              Resultados reais de clientes que usam SupriFlow
            </p>
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-12 ${styles.staggerReveal}`}>
              <div className="text-center">
                <div className={styles.dramaticNumber} data-label="REDUÇÃO">20%</div>
                <div className="text-sm text-slate-700 mt-2 font-medium">Redução de Custos</div>
                <div className="text-xs text-muted-foreground mt-1">Média em 60 dias</div>
              </div>
              <div className="text-center">
                <div className={styles.dramaticNumber} data-label="MENOS TEMPO">70%</div>
                <div className="text-sm text-slate-700 mt-2 font-medium">Menos Tempo</div>
                <div className="text-xs text-muted-foreground mt-1">Em cotações manuais</div>
              </div>
              <div className="text-center">
                <div className={styles.dramaticNumber} data-label="SETUP">5min</div>
                <div className="text-sm text-slate-700 mt-2 font-medium">Setup Completo</div>
                <div className="text-xs text-muted-foreground mt-1">Pronto para usar</div>
              </div>
              <div className="text-center">
                <div className={styles.dramaticNumber} data-label="EMPRESAS">+50</div>
                <div className="text-sm text-slate-700 mt-2 font-medium">Empresas Ativas</div>
                <div className="text-xs text-muted-foreground mt-1">Indústria e varejo</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32">
          <div className="container px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Por que escolher SupriFlow?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Mais simples que ERPs complexos, mais profissional que planilhas.
                Sistema completo do início ao fim.
              </p>
            </div>

            <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 ${styles.staggerReveal}`}>
              <Card className={styles.luxuryCard}>
                <CardHeader>
                  <div className={styles.refinedIcon}>
                    <FileText className="h-7 w-7 text-emerald-700" />
                  </div>
                  <CardTitle>Requisições Inteligentes</CardTitle>
                  <CardDescription>
                    Crie requisições em segundos com numeração automática e fluxo de aprovação customizável
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className={styles.luxuryCard}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-teal-100 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-teal-700" />
                  </div>
                  <CardTitle>Cotações Simultâneas</CardTitle>
                  <CardDescription>
                    Envie cotações para múltiplos fornecedores e compare propostas em tempo real
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className={styles.luxuryCard}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-slate-700" />
                  </div>
                  <CardTitle>Portal do Fornecedor</CardTitle>
                  <CardDescription>
                    Fornecedores respondem cotações online, com upload de propostas e histórico completo
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className={styles.luxuryCard}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-amber-700" />
                  </div>
                  <CardTitle>Dashboards em Tempo Real</CardTitle>
                  <CardDescription>
                    Visualize métricas de compras, economia gerada e performance de fornecedores
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className={styles.luxuryCard}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-indigo-700" />
                  </div>
                  <CardTitle>Multi-usuário</CardTitle>
                  <CardDescription>
                    Perfis e permissões por departamento: solicitante, comprador, gestor e financeiro
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className={styles.luxuryCard}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-rose-100 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-rose-700" />
                  </div>
                  <CardTitle>Automação Total</CardTitle>
                  <CardDescription>
                    Numeração automática, e-mails, notificações e alertas de contratos vencendo
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-32 bg-gradient-to-b from-slate-50 to-white">
          <div className="container px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Planos transparentes e sem surpresas
              </h2>
              <p className="text-xl text-muted-foreground">
                Teste grátis por 14 dias. Sem cartão de crédito. Cancele quando quiser.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Básico */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Básico</CardTitle>
                  <CardDescription>Ideal para pequenas empresas</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">R$ 149</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>5 usuários</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Requisições ilimitadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Cotações ilimitadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Suporte por email</span>
                  </div>
                  <Link href="/cadastro" className="block">
                    <Button className="w-full mt-6 h-12 border-emerald-600 text-emerald-700 hover:bg-emerald-50" variant="outline">
                      Testar Grátis por 14 Dias
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Profissional */}
              <Card className="border-2 border-emerald-600 relative shadow-lg">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-600 text-white text-sm rounded-full font-medium">
                  Mais Popular
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl">Profissional</CardTitle>
                  <CardDescription>Para empresas em crescimento</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">R$ 297</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>20 usuários</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Todos recursos do Básico</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Gestão de contratos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Gestão de estoque</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Suporte prioritário</span>
                  </div>
                  <Link href="/cadastro" className="block">
                    <Button className="w-full mt-6 h-12 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                      Começar Teste Grátis
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Enterprise */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Enterprise</CardTitle>
                  <CardDescription>Para grandes empresas</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">R$ 997</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Usuários ilimitados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Todos recursos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>API dedicada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Suporte 24/7</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Gerente de conta</span>
                  </div>
                  <Link href="https://wa.me/5543991679911?text=Olá!%20Tenho%20interesse%20no%20plano%20Enterprise" target="_blank">
                    <Button className="w-full mt-6 h-12 border-emerald-600 text-emerald-700 hover:bg-emerald-50" variant="outline">
                      Falar com Especialista
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20 md:py-32">
          <div className="container px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                O que nossos clientes dizem
              </h2>
              <p className="text-lg text-muted-foreground">
                Empresas reais, resultados reais
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-4 text-muted-foreground">
                    "Reduzimos <strong className="text-foreground">35% dos custos</strong> de compra em 6 meses.
                    A comparação automática de cotações economiza horas do meu time!"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                      CS
                    </div>
                    <div>
                      <div className="font-semibold">Carlos Silva</div>
                      <div className="text-sm text-muted-foreground">Gerente de Suprimentos, Indústria Metalúrgica</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-4 text-muted-foreground">
                    "Implementação <strong className="text-foreground">super rápida</strong>. Em 2 dias já estávamos usando.
                    O suporte em português faz toda a diferença!"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                      AC
                    </div>
                    <div>
                      <div className="font-semibold">Ana Costa</div>
                      <div className="text-sm text-muted-foreground">Diretora Financeira, Rede de Varejo</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-4 text-muted-foreground">
                    "Finalmente conseguimos <strong className="text-foreground">controlar todas as requisições</strong>.
                    Agora sei exatamente o que está sendo comprado e por quem!"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-lg">
                      RL
                    </div>
                    <div>
                      <div className="font-semibold">Roberto Lima</div>
                      <div className="text-sm text-muted-foreground">CEO, Indústria de Alimentos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section - Objection Handling */}
        <section className="py-20 md:py-32 bg-white">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Perguntas Frequentes
                </h2>
                <p className="text-lg text-muted-foreground">
                  Tudo que você precisa saber antes de começar
                </p>
              </div>

              <div className="space-y-4">
                <details className="group bg-slate-50 rounded-lg p-6 hover:bg-slate-100 transition-colors">
                  <summary className="font-semibold text-lg cursor-pointer list-none flex items-center justify-between">
                    Como funciona o teste gratuito?
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Você tem acesso completo a todas as funcionalidades do plano Professional por 14 dias.
                    Não pedimos cartão de crédito. Apenas preencha o cadastro e comece a usar imediatamente.
                    Após os 14 dias, você escolhe o plano que mais se adequa à sua empresa.
                  </p>
                </details>

                <details className="group bg-slate-50 rounded-lg p-6 hover:bg-slate-100 transition-colors">
                  <summary className="font-semibold text-lg cursor-pointer list-none flex items-center justify-between">
                    É difícil implementar? Quanto tempo leva?
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Não! Em 5 minutos você já está operando. O sistema tem um tutorial guiado que ensina
                    a criar sua primeira requisição, cotação e ordem de compra. Nosso suporte em português
                    está disponível via WhatsApp para qualquer dúvida.
                  </p>
                </details>

                <details className="group bg-slate-50 rounded-lg p-6 hover:bg-slate-100 transition-colors">
                  <summary className="font-semibold text-lg cursor-pointer list-none flex items-center justify-between">
                    Funciona para minha indústria/varejo?
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Sim! SupriFlow foi desenvolvido especificamente para indústrias e varejos brasileiros.
                    Suporta classificação de produtos (matéria-prima, MRO, ativos), múltiplas filiais,
                    validação de CNPJ e integração com NF-e. Atendemos desde pequenas empresas até grupos
                    com múltiplas unidades.
                  </p>
                </details>

                <details className="group bg-slate-50 rounded-lg p-6 hover:bg-slate-100 transition-colors">
                  <summary className="font-semibold text-lg cursor-pointer list-none flex items-center justify-between">
                    Meus dados estão seguros?
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Absolutamente. Usamos isolamento completo entre clientes (tecnologia multi-tenant),
                    criptografia de ponta a ponta e hospedagem em servidores certificados. Seus dados
                    nunca são compartilhados com terceiros. Somos 100% LGPD compliant.
                  </p>
                </details>

                <details className="group bg-slate-50 rounded-lg p-6 hover:bg-slate-100 transition-colors">
                  <summary className="font-semibold text-lg cursor-pointer list-none flex items-center justify-between">
                    Posso migrar meus dados de planilhas/outro sistema?
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Sim! Oferecemos importação de fornecedores, produtos e histórico de compras via planilha Excel/CSV.
                    Para clientes Enterprise, fazemos a migração completa sem custo adicional. Nosso time técnico
                    te ajuda em todo o processo.
                  </p>
                </details>

                <details className="group bg-slate-50 rounded-lg p-6 hover:bg-slate-100 transition-colors">
                  <summary className="font-semibold text-lg cursor-pointer list-none flex items-center justify-between">
                    Posso cancelar a qualquer momento?
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Sim, sem burocracia! Você pode cancelar sua assinatura a qualquer momento direto no painel.
                    Sem multas, sem taxas de cancelamento, sem perguntas inconvenientes. Seus dados ficam
                    disponíveis para exportação por 30 dias após o cancelamento.
                  </p>
                </details>
              </div>

              <div className="mt-12 text-center">
                <p className="text-muted-foreground mb-4">Ainda tem dúvidas?</p>
                <Link href="https://wa.me/5543991679911?text=Olá!%20Tenho%20algumas%20dúvidas%20sobre%20o%20SupriFlow" target="_blank">
                  <Button variant="outline" size="lg" className="h-12 px-6">
                    Falar com Especialista via WhatsApp
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 text-white">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold">
                Pronto para reduzir custos e ganhar eficiência?
              </h2>
              <p className="text-xl text-blue-100">
                Junte-se a +50 empresas brasileiras que já economizam em média 20% em compras
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/cadastro">
                  <Button size="lg" className="h-14 px-10 text-lg font-semibold shadow-xl bg-emerald-600 hover:bg-emerald-500">
                    Começar Teste Grátis por 14 Dias
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="https://wa.me/5543991679911?text=Olá!%20Gostaria%20de%20agendar%20uma%20demonstração" target="_blank">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg bg-transparent text-white border-2 border-white hover:bg-white hover:text-slate-800 transition-all">
                    Falar com Especialista
                  </Button>
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">14 dias grátis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Cancele quando quiser</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-slate-50">
        <div className="container px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo-jls.jpg"
                  alt="JLS Tecnologia"
                  width={50}
                  height={50}
                  className="object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-xl font-bold">SupriFlow</span>
                  <span className="text-xs text-muted-foreground">by JLS Tecnologia</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Gestão de compras inteligente para sua empresa crescer.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features">Recursos</a></li>
                <li><a href="#pricing">Planos</a></li>
                <li><a href="#">Integrações</a></li>
                <li><a href="#">Atualizações</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#">Sobre</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Carreiras</a></li>
                <li><a href="#">Contato</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  <a href="mailto:joelson76@gmail.com" className="hover:text-primary transition-colors">
                    joelson76@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <a href="https://wa.me/5543991679911" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    (43) 9 9167-9911
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 JLS Tecnologia - SupriFlow. Todos os direitos reservados.</p>
            <p className="mt-2 text-xs">Uma solução <span className="font-semibold">JLS Tecnologia</span></p>
          </div>
        </div>
      </footer>

      {/* Floating Contact Buttons */}
      <FloatingContactButtons />
    </div>
  )
}
