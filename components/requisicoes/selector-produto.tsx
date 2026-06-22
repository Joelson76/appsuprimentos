'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Package, AlertCircle, Search, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Produto {
  id: string
  descricao: string
  codigo: string | null
  unidade: string
  estoque_atual: number
  custo_medio: number | null
  classificacao: string | null
  estoque_minimo_alerta: number | null
}

interface SelectorProdutoProps {
  value: string
  onChange: (produto: Produto | null) => void
  label?: string
  required?: boolean
}

const classificacaoColors: Record<string, string> = {
  COMPRAS_DIRETAS: 'bg-blue-100 text-blue-800',
  COMPRAS_INDIRETAS: 'bg-purple-100 text-purple-800',
  ATIVOS_IMOBILIZADOS: 'bg-orange-100 text-orange-800',
  USO_IMEDIATO: 'bg-teal-100 text-teal-800'
}

export function SelectorProduto({ value, onChange, label = 'Produto', required = false }: SelectorProdutoProps) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadProdutos()
  }, [])

  useEffect(() => {
    if (value && produtos.length > 0) {
      const produto = produtos.find(p => p.id === value)
      setProdutoSelecionado(produto || null)
    }
  }, [value, produtos])

  const loadProdutos = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('produtos')
        .select('id, descricao, codigo, unidade, estoque_atual, custo_medio, classificacao, estoque_minimo_alerta')
        .eq('ativo', true)
        .order('descricao')

      if (error) throw error
      setProdutos(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId) || null
    setProdutoSelecionado(produto)
    onChange(produto)
    setOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    setProdutoSelecionado(null)
    onChange(null)
    setSearchTerm('')
  }

  const produtosFiltrados = produtos.filter(produto => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      produto.descricao.toLowerCase().includes(term) ||
      (produto.codigo && produto.codigo.toLowerCase().includes(term))
    )
  })

  const getEstoqueStatus = (produto: Produto) => {
    if (!produto.estoque_minimo_alerta) return null

    const percentual = (produto.estoque_atual / produto.estoque_minimo_alerta) * 100

    if (produto.estoque_atual === 0) {
      return <Badge variant="destructive" className="ml-2">Sem estoque</Badge>
    } else if (percentual <= 50) {
      return <Badge variant="destructive" className="ml-2">Crítico</Badge>
    } else if (percentual <= 100) {
      return <Badge className="bg-yellow-100 text-yellow-800 ml-2">Baixo</Badge>
    }
    return null
  }

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !produtoSelecionado && "text-muted-foreground"
            )}
          >
            {produtoSelecionado ? (
              <div className="flex items-center gap-2 truncate">
                <Package className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {produtoSelecionado.codigo && `[${produtoSelecionado.codigo}] `}
                  {produtoSelecionado.descricao}
                </span>
              </div>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                {loading ? "Carregando produtos..." : "Buscar produto..."}
              </span>
            )}
            {produtoSelecionado ? (
              <X
                className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              />
            ) : (
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar produto por nome ou código..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                {produtos.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum produto cadastrado</p>
                    <p className="text-xs mt-1">Cadastre produtos em Estoque → Produtos</p>
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhum produto encontrado com "{searchTerm}"
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {produtosFiltrados.map((produto) => (
                  <CommandItem
                    key={produto.id}
                    value={`${produto.codigo || ''} ${produto.descricao}`.toLowerCase()}
                    onSelect={() => handleChange(produto.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex-1">
                        <div className="font-medium">
                          {produto.codigo && `[${produto.codigo}] `}
                          {produto.descricao}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>Estoque: {produto.estoque_atual} {produto.unidade}</span>
                          {produto.custo_medio && (
                            <span>• R$ {produto.custo_medio.toFixed(2)}</span>
                          )}
                          {produto.classificacao && (
                            <Badge className={`${classificacaoColors[produto.classificacao]} text-xs`}>
                              {produto.classificacao.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {getEstoqueStatus(produto)}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {produtoSelecionado && produtoSelecionado.estoque_atual === 0 && (
        <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          <span>Este produto está sem estoque. A requisição gerará necessidade de compra.</span>
        </div>
      )}

      {produtoSelecionado && produtoSelecionado.estoque_minimo_alerta &&
       produtoSelecionado.estoque_atual > 0 &&
       produtoSelecionado.estoque_atual <= produtoSelecionado.estoque_minimo_alerta && (
        <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          <span>Estoque baixo! Disponível: {produtoSelecionado.estoque_atual} {produtoSelecionado.unidade}</span>
        </div>
      )}
    </div>
  )
}
