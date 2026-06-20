import { createClient } from '@/lib/supabase/server'

export default async function DebugTemplatesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, perfil')
    .eq('id', user?.id || '')
    .single()

  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('tenant_id', profile?.tenant_id || '')
    .order('tipo')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug - Templates de E-mail</h1>

      <div className="bg-blue-50 p-4 rounded mb-4">
        <p><strong>Usuário ID:</strong> {user?.id}</p>
        <p><strong>Tenant ID:</strong> {profile?.tenant_id}</p>
        <p><strong>Perfil:</strong> {profile?.perfil}</p>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded mb-4">
          <p className="text-red-800"><strong>Erro:</strong> {error.message}</p>
          <pre className="text-xs mt-2">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      <div className="bg-green-50 p-4 rounded mb-4">
        <p><strong>Templates encontrados:</strong> {templates?.length || 0}</p>
      </div>

      {templates && templates.length > 0 ? (
        <div className="space-y-4">
          {templates.map((t: any) => (
            <div key={t.id} className="border p-4 rounded">
              <h3 className="font-bold">{t.nome}</h3>
              <p className="text-sm text-gray-600">Tipo: {t.tipo}</p>
              <p className="text-sm text-gray-600">Ativo: {t.ativo ? '✅' : '❌'}</p>
              <p className="text-sm text-gray-600">Assunto: {t.assunto}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-blue-600">Ver HTML</summary>
                <pre className="text-xs bg-gray-100 p-2 mt-2 overflow-auto max-h-40">
                  {t.corpo_html?.substring(0, 500)}...
                </pre>
              </details>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded">
          <p>Nenhum template encontrado</p>
        </div>
      )}
    </div>
  )
}
