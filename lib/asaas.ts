const ASAAS_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/v3'

const ASAAS_API_KEY = process.env.ASAAS_API_KEY

if (!ASAAS_API_KEY) {
  console.warn('ASAAS_API_KEY não configurada')
}

interface AsaasCustomer {
  name: string
  email: string
  cpfCnpj: string
  phone?: string
  mobilePhone?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  externalReference?: string
}

interface AsaasPayment {
  customer: string
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'
  value: number
  dueDate: string
  description?: string
  externalReference?: string
  installmentCount?: number
  installmentValue?: number
}

interface AsaasSubscription {
  customer: string
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
  value: number
  nextDueDate: string
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  description?: string
  externalReference?: string
}

async function asaasRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${ASAAS_API_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY || '',
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Erro Asaas:', data)
    throw new Error(data.errors?.[0]?.description || 'Erro ao comunicar com Asaas')
  }

  return data
}

export const asaas = {
  // Criar ou atualizar cliente
  async createCustomer(customer: AsaasCustomer): Promise<any> {
    return asaasRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    })
  },

  async getCustomer(customerId: string): Promise<any> {
    return asaasRequest(`/customers/${customerId}`)
  },

  // Criar cobrança avulsa
  async createPayment(payment: AsaasPayment): Promise<any> {
    return asaasRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    })
  },

  async getPayment(paymentId: string): Promise<any> {
    return asaasRequest(`/payments/${paymentId}`)
  },

  async getPixQrCode(paymentId: string): Promise<any> {
    return asaasRequest(`/payments/${paymentId}/pixQrCode`)
  },

  async getBoletoUrl(paymentId: string): Promise<string> {
    const payment = await asaasRequest(`/payments/${paymentId}`)
    return payment.bankSlipUrl
  },

  // Criar assinatura recorrente
  async createSubscription(subscription: AsaasSubscription): Promise<any> {
    return asaasRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscription),
    })
  },

  async getSubscription(subscriptionId: string): Promise<any> {
    return asaasRequest(`/subscriptions/${subscriptionId}`)
  },

  async cancelSubscription(subscriptionId: string): Promise<any> {
    return asaasRequest(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    })
  },

  // Listar cobranças de uma assinatura
  async getSubscriptionPayments(subscriptionId: string): Promise<any> {
    return asaasRequest(`/subscriptions/${subscriptionId}/payments`)
  },
}
