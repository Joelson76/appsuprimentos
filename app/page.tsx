import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
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
      <header className="header-solid sticky top-0 z-[100] w-full border-b relative">
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
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
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
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/cadastro">
              <Button>Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-background -z-10" />

          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                <Zap className="h-4 w-4" />
                Teste grátis por 14 dias
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl">
                Gestão de Compras{' '}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Simples e Eficiente
                </span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl">
                Automatize requisições, cotações e pedidos de compra.
                Reduza custos, ganhe tempo e tenha controle total sobre seus suprimentos.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/cadastro">
                  <Button size="lg" className="h-12 px-8 text-base">
                    Começar Agora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                    Ver Demonstração
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

        {/* Stats Section */}
        <section className="py-16 bg-slate-50">
          <div className="container px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">98%</div>
                <div className="text-sm text-muted-foreground mt-2">Satisfação</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">-40%</div>
                <div className="text-sm text-muted-foreground mt-2">Custos de Compra</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">10h</div>
                <div className="text-sm text-muted-foreground mt-2">Economizadas/Semana</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">500+</div>
                <div className="text-sm text-muted-foreground mt-2">Empresas Ativas</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32">
          <div className="container px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Tudo que você precisa em um só lugar
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Sistema completo para gestão de compras e suprimentos,
                do zero ao pedido recebido
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-2 hover:border-blue-200 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Requisições Inteligentes</CardTitle>
                  <CardDescription>
                    Crie requisições em segundos com numeração automática e fluxo de aprovação customizável
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-blue-200 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-cyan-600" />
                  </div>
                  <CardTitle>Cotações Simultâneas</CardTitle>
                  <CardDescription>
                    Envie cotações para múltiplos fornecedores e compare propostas em tempo real
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-blue-200 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Portal do Fornecedor</CardTitle>
                  <CardDescription>
                    Fornecedores respondem cotações online, com upload de propostas e histórico completo
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-blue-200 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>Dashboards em Tempo Real</CardTitle>
                  <CardDescription>
                    Visualize métricas de compras, economia gerada e performance de fornecedores
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-blue-200 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Multi-usuário</CardTitle>
                  <CardDescription>
                    Perfis e permissões por departamento: solicitante, comprador, gestor e financeiro
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-blue-200 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-pink-600" />
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
        <section id="pricing" className="py-20 md:py-32 bg-slate-50">
          <div className="container px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Planos para empresas de todos os tamanhos
              </h2>
              <p className="text-xl text-muted-foreground">
                Comece grátis e faça upgrade quando precisar
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
                    <Button className="w-full mt-6" variant="outline">
                      Começar Grátis
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Profissional */}
              <Card className="border-2 border-blue-600 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm rounded-full">
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
                    <Button className="w-full mt-6">
                      Começar Grátis
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
                  <Button className="w-full mt-6" variant="outline">
                    Falar com Vendas
                  </Button>
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
                Empresas que confiam no SupriFlow
              </h2>
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
                    Reduzimos 35% dos custos de compra em 6 meses.
                    A comparação automática de cotações é incrível!
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100" />
                    <div>
                      <div className="font-semibold">Carlos Silva</div>
                      <div className="text-sm text-muted-foreground">Gerente de Suprimentos</div>
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
                    Implementação super rápida. Em 2 dias já estávamos usando.
                    Suporte excelente!
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100" />
                    <div>
                      <div className="font-semibold">Ana Costa</div>
                      <div className="text-sm text-muted-foreground">Diretora Financeira</div>
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
                    Finalmente conseguimos controlar todas as requisições.
                    O fluxo de aprovação é perfeito!
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100" />
                    <div>
                      <div className="font-semibold">Roberto Lima</div>
                      <div className="text-sm text-muted-foreground">CEO</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold">
                Pronto para revolucionar suas compras?
              </h2>
              <p className="text-xl text-blue-100">
                Junte-se a centenas de empresas que já economizam tempo e dinheiro com o SupriFlow
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/cadastro">
                  <Button size="lg" variant="secondary" className="h-12 px-8 text-base">
                    Começar Teste Grátis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-transparent text-white border-white hover:bg-white/10">
                  Agendar Demonstração
                </Button>
              </div>
              <p className="text-sm text-blue-100">
                ✓ 14 dias grátis • ✓ Sem cartão de crédito • ✓ Cancele quando quiser
              </p>
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
