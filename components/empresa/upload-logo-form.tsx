'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface UploadLogoFormProps {
  tenantId: string
  currentLogoUrl: string | null
  tenantNome: string
}

export function UploadLogoForm({ tenantId, currentLogoUrl, tenantNome }: UploadLogoFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem')
      return
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB')
      return
    }

    setUploading(true)

    try {
      const supabase = createClient()

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${tenantId}/logo.${fileExt}`

      // Fazer upload para o storage
      const { error: uploadError } = await supabase.storage
        .from('tenant-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true, // Substituir se já existir
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('tenant-logos')
        .getPublicUrl(fileName)

      // Atualizar tenant com a nova logo_url
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: publicUrl })
        .eq('id', tenantId)

      if (updateError) throw updateError

      setPreviewUrl(publicUrl)
      toast.success('Logo atualizada com sucesso!')
      router.refresh()
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      toast.error(error.message || 'Erro ao fazer upload da logo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveLogo = async () => {
    if (!previewUrl) return

    setRemoving(true)

    try {
      const supabase = createClient()

      // Remover referência da logo no tenant
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: null })
        .eq('id', tenantId)

      if (updateError) throw updateError

      setPreviewUrl(null)
      toast.success('Logo removida com sucesso!')
      router.refresh()
    } catch (error: any) {
      console.error('Erro ao remover logo:', error)
      toast.error(error.message || 'Erro ao remover logo')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Preview da Logo */}
      <div className="flex items-center justify-center">
        {previewUrl ? (
          <div className="relative">
            <Image
              src={previewUrl}
              alt={`Logo ${tenantNome}`}
              width={120}
              height={120}
              className="rounded-lg object-contain border-2 border-border"
            />
          </div>
        ) : (
          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted">
            <div className="text-center">
              <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Sem logo</p>
            </div>
          </div>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || removing}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {previewUrl ? 'Alterar Logo' : 'Enviar Logo'}
            </>
          )}
        </Button>

        {previewUrl && (
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            onClick={handleRemoveLogo}
            disabled={uploading || removing}
          >
            {removing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removendo...
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Remover Logo
              </>
            )}
          </Button>
        )}
      </div>

      {/* Informações */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Formatos aceitos: JPG, PNG, GIF, SVG</p>
        <p>• Tamanho máximo: 2MB</p>
        <p>• Dimensões recomendadas: 200x200px (quadrada)</p>
        {!previewUrl && (
          <p className="text-amber-600 font-medium mt-2">
            💡 Sem logo personalizada, será exibida as iniciais da empresa
          </p>
        )}
      </div>
    </div>
  )
}
