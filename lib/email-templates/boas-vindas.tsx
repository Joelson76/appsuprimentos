interface BoasVindasEmailProps {
  nomeAdmin: string
  nomeEmpresa: string
  email: string
  plano: string
  trialFim: string
}

export function BoasVindasEmail({
  nomeAdmin,
  nomeEmpresa,
  email,
  plano,
  trialFim,
}: BoasVindasEmailProps) {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#f9fafb',
      }}
    >
      <div
        style={{
          backgroundColor: '#16a34a',
          padding: '30px 20px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ color: 'white', margin: 0, fontSize: '32px' }}>
          SupriFlow
        </h1>
        <p style={{ color: '#dcfce7', margin: '10px 0 0 0', fontSize: '16px' }}>
          Bem-vindo ao futuro da gestão de compras!
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          padding: '40px 30px',
          borderRadius: '8px',
          margin: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ color: '#1e293b', marginTop: 0, fontSize: '24px' }}>
          🎉 Conta criada com sucesso!
        </h2>

        <p style={{ color: '#475569', lineHeight: 1.6, fontSize: '16px' }}>
          Olá <strong>{nomeAdmin}</strong>,
        </p>

        <p style={{ color: '#475569', lineHeight: 1.6, fontSize: '16px' }}>
          Ficamos muito felizes em ter a <strong>{nomeEmpresa}</strong> como
          parte da comunidade SupriFlow! Sua conta foi criada com sucesso e já
          está pronta para uso.
        </p>

        <div
          style={{
            backgroundColor: '#f0fdf4',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '25px',
            borderLeft: '4px solid #16a34a',
          }}
        >
          <h3
            style={{
              margin: '0 0 15px 0',
              color: '#166534',
              fontSize: '16px',
            }}
          >
            📋 Dados da sua conta:
          </h3>
          <p style={{ margin: '8px 0', color: '#334155', fontSize: '14px' }}>
            <strong>E-mail de acesso:</strong> {email}
          </p>
          <p style={{ margin: '8px 0', color: '#334155', fontSize: '14px' }}>
            <strong>Empresa:</strong> {nomeEmpresa}
          </p>
          <p style={{ margin: '8px 0', color: '#334155', fontSize: '14px' }}>
            <strong>Plano:</strong> {plano}
          </p>
          <p style={{ margin: '8px 0', color: '#334155', fontSize: '14px' }}>
            <strong>Trial válido até:</strong> {trialFim}
          </p>
        </div>

        <div
          style={{
            textAlign: 'center',
            margin: '30px 0',
          }}
        >
          <a
            href={loginUrl}
            style={{
              display: 'inline-block',
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '14px 32px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '16px',
            }}
          >
            Acessar SupriFlow →
          </a>
        </div>

        <div
          style={{
            backgroundColor: '#eff6ff',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '30px',
          }}
        >
          <h3
            style={{
              margin: '0 0 15px 0',
              color: '#1e40af',
              fontSize: '16px',
            }}
          >
            🚀 Próximos passos:
          </h3>
          <ol
            style={{
              margin: 0,
              paddingLeft: '20px',
              color: '#334155',
              fontSize: '14px',
              lineHeight: 1.8,
            }}
          >
            <li>Personalize as informações da sua empresa</li>
            <li>Cadastre seus fornecedores</li>
            <li>Crie sua primeira requisição de compra</li>
            <li>Envie cotações para seus fornecedores</li>
            <li>Gere pedidos de compra automaticamente</li>
          </ol>
        </div>

        <div
          style={{
            backgroundColor: '#fef3c7',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '25px',
            borderLeft: '4px solid #f59e0b',
          }}
        >
          <h3
            style={{
              margin: '0 0 10px 0',
              color: '#92400e',
              fontSize: '14px',
            }}
          >
            💡 Dica:
          </h3>
          <p style={{ margin: 0, color: '#78350f', fontSize: '14px', lineHeight: 1.6 }}>
            Comece cadastrando seus fornecedores mais utilizados. Isso vai
            agilizar muito o processo de criação de cotações e pedidos!
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '30px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '10px 0' }}>
            Precisa de ajuda? Estamos aqui para você!
          </p>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '10px 0' }}>
            📧 suporte@supriflow.com.br
          </p>
        </div>

        <p style={{ color: '#475569', marginTop: '30px', fontSize: '15px' }}>
          Atenciosamente,
          <br />
          <strong>Equipe SupriFlow</strong>
        </p>
      </div>

      <div
        style={{
          textAlign: 'center',
          padding: '20px',
          color: '#94a3b8',
          fontSize: '12px',
        }}
      >
        <p style={{ margin: '5px 0' }}>
          Este é um e-mail automático, por favor não responda.
        </p>
        <p style={{ margin: '5px 0' }}>
          © 2026 SupriFlow. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
