import { useState } from 'react';

interface EnderecoViaCEP {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  erro?: boolean;
}

export function useViaCEP() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarCEP = async (cep: string): Promise<EnderecoViaCEP | null> => {
    // Limpar formatação
    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
      setError('CEP deve ter 8 dígitos');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

      if (!response.ok) {
        throw new Error('Erro ao buscar CEP');
      }

      const data = await response.json();

      if (data.erro) {
        setError('CEP não encontrado');
        return null;
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { buscarCEP, loading, error };
}
