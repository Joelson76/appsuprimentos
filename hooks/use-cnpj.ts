import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

interface DadosCNPJ {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  situacao: string;
  data_situacao: string;
  atividade_principal: Array<{
    code: string;
    text: string;
  }>;
}

export function useCNPJ() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarCNPJ = async (cnpj: string): Promise<DadosCNPJ | null> => {
    const supabase = createBrowserClient();

    // Limpar formatação
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    if (cnpjLimpo.length !== 14) {
      setError('CNPJ deve ter 14 dígitos');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Chamar Edge Function do Supabase
      const { data, error: supabaseError } = await supabase.functions.invoke(
        'buscar-cnpj',
        {
          body: { cnpj: cnpjLimpo },
        }
      );

      if (supabaseError) {
        throw supabaseError;
      }

      if (!data || data.erro) {
        setError(data?.message || 'CNPJ não encontrado');
        return null;
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar CNPJ');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const validarCNPJ = (cnpj: string): boolean => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    if (cnpjLimpo.length !== 14) return false;

    // Validar dígitos verificadores
    let tamanho = cnpjLimpo.length - 2;
    let numeros = cnpjLimpo.substring(0, tamanho);
    const digitos = cnpjLimpo.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    tamanho = tamanho + 1;
    numeros = cnpjLimpo.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;

    return true;
  };

  const formatarCNPJ = (cnpj: string): string => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    return cnpjLimpo.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  };

  return { buscarCNPJ, validarCNPJ, formatarCNPJ, loading, error };
}
