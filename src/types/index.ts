export type TransactionType = 'receita' | 'despesa'

export type ClassificacaoDespesa = 'fixo' | 'variavel' | null
export type ReceitaTipo = 'comissao' | 'outro'
export type DespesaTipo = 'unitaria' | 'cia'

export type Unidade = 'Jau' | 'Pederneiras' | 'L. Paulista' | 'Silvio' | 'Geral'
export type Banco =
  | 'Santander'
  | 'Inter'
  | 'BTG'
  | 'Caixa'
  | 'Nubank'
  | 'D Financeiro'
  | 'Itaú'
  | 'Neon'
  | 'Cartão de Crédito'
  | 'Outros'

export type BrokerLevel = 'Júnior' | 'Pleno' | 'Sênior' | string

export type CollaboratorRole =
  | 'Corretor'
  | 'Gerente de Equipe'
  | 'Gerente Geral'
  | 'Apoio'
  | 'Captador'

export interface Broker {
  id: string
  role?: CollaboratorRole | string
  name: string
  level: BrokerLevel
  percentage: number
}

export interface Transaction {
  id: string
  tipo: TransactionType
  descricao: string
  valor: number
  data: string
  categoria: string
  unidade: Unidade
  banco: Banco
  isCheckpoint?: boolean
  classificacao?: ClassificacaoDespesa
  receitaTipo?: ReceitaTipo
  despesaTipo?: DespesaTipo
  corretor?: string
  corretorNivel?: string
  corretorPorcentagem?: number
  captador?: string
  captadorNivel?: string
  captadorPorcentagem?: number
  notaFiscal?: boolean
  juridico?: boolean
  juridicoValor?: number
  equipe?: string
  observacoes?: string
  installments?: number
  installmentNumber?: number
  source?: 'cupom' | 'extrato' | 'manual'
  attachment?: File | string | null
  created_at: string
}

export type RuleValueType = 'percentage' | 'fixed'

export interface RuleVariation {
  id: string
  name: string
  value: number
  type: RuleValueType
}

export interface CommissionRule {
  id: string
  role: string
  variations: RuleVariation[]
}

export interface CreditCardConfig {
  id: string
  name: string
  closingDay: number
  bestPurchaseDay: number
}

export interface CommissionTeam {
  id: string
  name: string
  defaultTax: boolean
  defaultLegal: boolean
  taxPercentage?: number
  legalValue?: number
  rules: CommissionRule[]
}

export const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Casa',
  'Saúde',
  'Lazer',
  'Trabalho',
  'Impostos',
  'Fornecedores',
  'Folha de Pagamento',
  'Comissão',
  'Outros',
]

export const UNIDADES: Unidade[] = ['Jau', 'Pederneiras', 'L. Paulista', 'Silvio', 'Geral']

export const BANCOS: Banco[] = [
  'Santander',
  'Inter',
  'BTG',
  'Caixa',
  'Nubank',
  'D Financeiro',
  'Itaú',
  'Neon',
  'Cartão de Crédito',
  'Outros',
]
