"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Building2, TrendingDown, Clock, Shield, BarChart3, Users } from "lucide-react";
import Link from "next/link";

export default function TrialPage() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    empresa: "",
    telefone: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implementar criação de trial
    console.log("Trial signup:", formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Minimalista */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
            <span className="font-bold text-xl">SupriFlow</span>
          </div>
          <Link href="/login">
            <Button variant="ghost">Já tem conta? Entrar</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section - Acima da dobra */}
      <section className="container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy + CTA */}
          <div className="space-y-8">
            {/* Social Proof Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Usado por +50 indústrias e varejos no Brasil
            </div>

            {/* Headline - Outcome-focused */}
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-slate-900">
              Reduza 20% dos custos de compras em 60 dias
            </h1>

            {/* Subheadline - Specific pain point */}
            <p className="text-xl text-slate-600 leading-relaxed">
              Transforme planilhas e e-mails em um sistema profissional de gestão de compras.
              Teste grátis por 14 dias — sem cartão de crédito.
            </p>

            {/* Quick Benefits */}
            <ul className="space-y-3">
              {[
                "70% menos tempo em cotações manuais",
                "Histórico completo de preços e fornecedores",
                "Aprovações automáticas por alçada",
                "KPIs e dashboards em tempo real",
              ].map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-slate-700">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Trust Signals */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-slate-600" />
                <span className="text-sm text-slate-600">100% seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-600" />
                <span className="text-sm text-slate-600">Setup em 5 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-600" />
                <span className="text-sm text-slate-600">Suporte em português</span>
              </div>
            </div>
          </div>

          {/* Right: Form - Simple & Clear */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10 border border-slate-200">
            <div className="space-y-6">
              {/* Form Header */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">
                  Comece seu teste gratuito
                </h2>
                <p className="text-slate-600">
                  14 dias grátis • Sem cartão de crédito • Cancele quando quiser
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo*</Label>
                  <Input
                    id="nome"
                    type="text"
                    required
                    placeholder="João Silva"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail corporativo*</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="joao@suaempresa.com.br"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa*</Label>
                  <Input
                    id="empresa"
                    type="text"
                    required
                    placeholder="Nome da sua empresa"
                    value={formData.empresa}
                    onChange={(e) =>
                      setFormData({ ...formData, empresa: e.target.value })
                    }
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone (opcional)</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({ ...formData, telefone: e.target.value })
                    }
                    className="h-12 text-base"
                  />
                  <p className="text-xs text-slate-500">
                    Para suporte prioritário via WhatsApp
                  </p>
                </div>

                {/* Primary CTA - Value-driven copy */}
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? "Criando sua conta..." : "Iniciar teste grátis por 14 dias"}
                </Button>

                <p className="text-xs text-center text-slate-500">
                  Ao criar sua conta, você concorda com nossos{" "}
                  <Link href="/termos" className="underline">
                    Termos de Uso
                  </Link>{" "}
                  e{" "}
                  <Link href="/privacidade" className="underline">
                    Política de Privacidade
                  </Link>
                </p>
              </form>

              {/* What happens next */}
              <div className="pt-6 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-3">
                  O que acontece depois:
                </p>
                <ol className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                      1
                    </span>
                    <span>Acesso imediato ao sistema completo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                      2
                    </span>
                    <span>Tutorial guiado em 5 minutos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                      3
                    </span>
                    <span>Suporte em português via WhatsApp</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-white py-16 border-y border-slate-200">
        <div className="container mx-auto px-4">
          <p className="text-center text-slate-500 mb-8 uppercase tracking-wide text-sm font-medium">
            Confiado por empresas de todos os portes
          </p>
          {/* TODO: Adicionar logos de clientes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-50">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 bg-slate-200 rounded-lg flex items-center justify-center"
              >
                <Building2 className="h-8 w-8 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - Overcome Objections */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Por que escolher SupriFlow?
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Mais simples que ERPs, mais profissional que planilhas
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Benefit 1 */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-6">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              Reduza custos em até 20%
            </h3>
            <p className="text-slate-600 mb-4">
              Compare preços automaticamente, negocie melhor com histórico completo e
              evite compras duplicadas ou fora da política.
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Histórico de preços por produto</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Comparação automática de cotações</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Alçadas e políticas de aprovação</span>
              </li>
            </ul>
          </div>

          {/* Benefit 2 */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              70% menos tempo em cotações
            </h3>
            <p className="text-slate-600 mb-4">
              Envie cotações para múltiplos fornecedores com 1 clique.
              Eles respondem diretamente no sistema via WhatsApp ou e-mail.
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Links únicos para fornecedores</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Notificações automáticas</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Rastreamento de status em tempo real</span>
              </li>
            </ul>
          </div>

          {/* Benefit 3 */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-6">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              Visibilidade total das compras
            </h3>
            <p className="text-slate-600 mb-4">
              Dashboards e KPIs em tempo real. Saiba exatamente o que está sendo
              comprado, por quem, de quem e por quanto.
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Performance de fornecedores</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Análise de gastos por categoria</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Alertas de estoque crítico</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section - Objection Handling */}
      <section className="bg-slate-50 py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Perguntas frequentes
          </h2>

          <div className="space-y-6">
            <details className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                O que está incluído no teste gratuito?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-slate-600">
                Acesso completo a todas as funcionalidades do plano Professional por 14 dias:
                requisições ilimitadas, cotações automáticas, múltiplos usuários, dashboards,
                KPIs e suporte em português. Sem limitações.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                Preciso de cartão de crédito para testar?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-slate-600">
                Não! Basta preencher o formulário acima. Você só informa dados de pagamento
                se decidir continuar após os 14 dias de teste.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                É difícil implementar? Quanto tempo leva?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-slate-600">
                Em 5 minutos você já está operando! O sistema tem um tutorial guiado que
                ensina a criar sua primeira requisição, cotação e ordem de compra.
                Nosso suporte em português ajuda em qualquer dúvida.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                Funciona para minha indústria/varejo?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-slate-600">
                Sim! SupriFlow foi desenvolvido especificamente para indústrias e varejos
                brasileiros. Suporta classificação de produtos (matéria-prima, MRO, ativos),
                múltiplas filiais, validação de CNPJ e integração com NF-e.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                Meus dados estão seguros?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-slate-600">
                Absolutamente. Usamos isolamento completo entre clientes (RLS multi-tenant),
                criptografia de ponta a ponta e hospedagem em servidores certificados.
                Seus dados nunca são compartilhados com terceiros.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 group">
              <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                Posso cancelar a qualquer momento?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-slate-600">
                Sim, sem burocracia! Você pode cancelar sua assinatura a qualquer momento
                direto no painel. Sem multas, sem taxas de cancelamento.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Pronto para reduzir custos e ganhar eficiência?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se a +50 empresas que já transformaram seu processo de compras
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 h-14 px-8 text-lg font-semibold"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Começar teste grátis agora
          </Button>
          <p className="text-blue-100 text-sm mt-4">
            14 dias grátis • Sem cartão • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
                <span className="font-bold text-white text-lg">SupriFlow</span>
              </div>
              <p className="text-sm">
                Sistema completo de gestão de compras e suprimentos
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/funcionalidades" className="hover:text-white">
                    Funcionalidades
                  </Link>
                </li>
                <li>
                  <Link href="/precos" className="hover:text-white">
                    Preços
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-white">
                    Demo
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/sobre" className="hover:text-white">
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link href="/contato" className="hover:text-white">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contato</h4>
              <ul className="space-y-2 text-sm">
                <li>joelson76@gmail.com</li>
                <li>Suporte: WhatsApp</li>
                <li>JLS Tecnologia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>© 2026 SupriFlow by JLS Tecnologia. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
