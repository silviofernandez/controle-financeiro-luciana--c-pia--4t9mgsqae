import { addDays, subDays } from 'date-fns'

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export const toSlug = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '_')

export const MOCK_TRANSACTIONS = [
  {
    id: 'm1',
    tipo: 'receita',
    descricao: 'Venda Consultoria',
    valor: 15000,
    data: new Date().toISOString(),
    categoria: 'Serviços',
    unidade: 'Geral',
    banco: 'Nubank',
  },
  {
    id: 'm2',
    tipo: 'despesa',
    descricao: 'Aluguel Escritório',
    valor: 3500,
    data: new Date().toISOString(),
    categoria: 'Casa',
    unidade: 'Geral',
    banco: 'Itaú',
  },
  {
    id: 'm3',
    tipo: 'despesa',
    descricao: 'Software e Ferramentas',
    valor: 850,
    data: addDays(new Date(), 3).toISOString(),
    categoria: 'Trabalho',
    unidade: 'Geral',
    banco: 'Inter',
  },
  {
    id: 'm4',
    tipo: 'despesa',
    descricao: 'Impostos Municipais',
    valor: 2100,
    data: addDays(new Date(), 6).toISOString(),
    categoria: 'Impostos',
    unidade: 'Geral',
    banco: 'Caixa',
  },
  {
    id: 'm5',
    tipo: 'receita',
    descricao: 'Comissão Imóvel Jau',
    valor: 28000,
    data: subDays(new Date(), 10).toISOString(),
    categoria: 'Comissão',
    unidade: 'Jau',
    banco: 'Santander',
  },
  {
    id: 'm6',
    tipo: 'despesa',
    descricao: 'Marketing Ads',
    valor: 4200,
    data: subDays(new Date(), 5).toISOString(),
    categoria: 'Fornecedores',
    unidade: 'Geral',
    banco: 'BTG',
  },
  {
    id: 'm7',
    tipo: 'despesa',
    descricao: 'Folha Pagamento',
    valor: 12000,
    data: addDays(new Date(), 1).toISOString(),
    categoria: 'Folha de Pagamento',
    unidade: 'Geral',
    banco: 'Itaú',
  },
  {
    id: 'm8',
    tipo: 'despesa',
    descricao: 'Energia Elétrica',
    valor: 450,
    data: addDays(new Date(), 4).toISOString(),
    categoria: 'Casa',
    unidade: 'Geral',
    banco: 'Nubank',
  },
]
