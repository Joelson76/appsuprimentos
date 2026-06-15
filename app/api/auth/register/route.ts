import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cnpj as cnpjValidator } from 'cpf-cnpj-validator'
import type { RegisterRequest } from '@/lib/types'
// Email templates foram removidos - usar email-service-simple.ts se necessário

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()

    // Validar CNPJ
    if (!cnpjValidator.isValid(body.empresa.cnpj)) {
      return NextResponse.json(
        { error: 'CNPJ inválido' },
        { status: 400 }
      )
    }

    // Cliente Supabase com service_role (server-side only)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Verificar se CNPJ já existe
    const { data: existingTenant } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('cnpj', body.empresa.cnpj)
      .single()

    if (existingTenant) {
      return NextResponse.json(
        { error: 'CNPJ já cadastrado' },
        { status: 409 }
      )
    }

    // Criar tenant (trial de 14 dias)
    const trialFim = new Date()
    trialFim.setDate(trialFim.getDate() + 14)

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        nome: body.empresa.nome,
        cnpj: body.empresa.cnpj,
        plano: body.plano,
        status: 'TRIAL',
        trial_fim: trialFim.toISOString(),
        endereco: body.empresa.endereco || null,
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Erro ao criar tenant:', tenantError)
      return NextResponse.json(
        { error: 'Erro ao criar empresa' },
        { status: 500 }
      )
    }

    // Criar usuário admin via Supabase Auth
    // O trigger handle_new_user criará o profile automaticamente
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: body.admin.email,
        password: body.admin.senha,
        email_confirm: true, // Auto-confirmar e-mail em dev
        user_metadata: {
          tenant_id: tenant.id,
          nome: body.admin.nome,
          perfil: 'ADMIN',
        },
      })

    if (authError) {
      console.error('Erro ao criar usuário:', authError)
      // Rollback: deletar tenant se falhar ao criar usuário
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json(
        { error: 'Erro ao criar usuário administrador' },
        { status: 500 }
      )
    }

    // Enviar e-mail de boas-vindas via Resend
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: body.admin.email,
        subject: '🎉 Bem-vindo ao SupriFlow!',
        react: BoasVindasEmail({
          nomeAdmin: body.admin.nome,
          nomeEmpresa: tenant.nome,
          email: body.admin.email,
          plano: tenant.plano,
          trialFim: trialFim.toLocaleDateString('pt-BR'),
        }),
      })
    } catch (emailError) {
      // Não bloqueia o cadastro se o e-mail falhar
      console.error('Erro ao enviar e-mail de boas-vindas:', emailError)
    }

    return NextResponse.json(
      {
        message: 'Empresa cadastrada com sucesso! Faça login para continuar.',
        tenant_id: tenant.id,
        trial_fim: trialFim.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro no registro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
