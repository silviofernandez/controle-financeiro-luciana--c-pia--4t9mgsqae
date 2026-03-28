import { Transaction, Banco, Unidade, TransactionType, ClassificacaoDespesa } from '@/types'

const guessBank = (desc: string): Banco => {
  const d = desc.toLowerCase()
  if (d.includes('santander')) return 'Santander'
  if (d.includes('inter')) return 'Inter'
  if (d.includes('btg')) return 'BTG'
  if (d.includes('nu') || d.includes('nubank')) return 'Nubank'
  if (d.includes('caixa')) return 'Caixa'
  if (d.includes('d financeiro')) return 'D Financeiro'
  if (d.includes('itau') || d.includes('itaú')) return 'Itaú'
  if (d.includes('neon')) return 'Neon'
  return 'Outros'
}

const rawFebData = `02/02|Jau|1610|up talentos , recrutamento santander|despesa|variavel|
02/02|Jau|3758.79|fgts multa 40% gabriela martins santander|despesa|variavel|
02/02|Jau|287.99|quires inovancao plcas qrcode santander|despesa|variavel|
02/02|Silvio|150|prolabore concerto roda volvo santander|despesa|fixo|
02/02|Pederneiras|146.68|agua sabesp janeiro santander|despesa|fixo|
02/02|Jau|716.78|iptu atrasados 4/24 santander|despesa|fixo|
02/02|Jau|40|exame admissional marina d financeiro|despesa|variavel|
02/02|Jau|40|exame admissional gabriela siriani d financeiro|despesa|variavel|
02/02|Jau|94.8|cafe da manha 02/02 d financeiro|despesa|variavel|
02/02|Pederneiras|23.9|despesa refeicao ruan 03/02 d financeiro|despesa|variavel|
02/02|Jau|142|despesa copa copos big festa d financeiro|despesa|variavel|
02/02|Jau|28|despesa refeicao leonardo lencois d financeiro|despesa|variavel|
02/02|Jau|20|despesa refeicao eduardo lencois d financeiro|despesa|variavel|
02/02|Jau|200|paroquia nossa senhora santander|despesa|variavel|
03/02|L. Paulista|635.74|vivo lencois santander|despesa|fixo|
03/02|Jau|273.67|rescisao gabriela martins inter|despesa|variavel|
03/02|Jau|202.66|cesta de janeiro gabriela martins|despesa|variavel|
03/02|Jau|380|flash cesta kgb santander|despesa|variavel|
03/02|Jau|5320|flash cesta la baccaro santander|despesa|variavel|
03/02|Geral|2817.45|saldo financeiro|receita||true
04/02|Jau|75.6|sacolas de aniversarios d financeiro|despesa|variavel|
04/02|Geral|4012.07|saldo financeiro|receita||true
05/02|Jau|380|flash cesta bruna tiburcio santander|despesa|variavel|
05/02|Jau|50|doacao casa da crianca d financeiro|despesa|variavel|
05/02|Geral|3962.07|saldo financeiro|receita||true
06/02|Jau|160|trasnf p/ pedro 4 exames medicos santander|despesa|variavel|
06/02|Jau|100|trasnf p/ pedro 4 acerto gabriela dias|despesa|variavel|
06/02|Jau|1657.18|multa fgts 40% gabriela dias santander|despesa|variavel|
06/02|Jau|2960.15|sal gustavo inter|despesa|fixo|
06/02|Jau|6893.03|sal elisangela inter|despesa|fixo|
06/02|Jau|1092.25|sal stephany inter|despesa|fixo|
06/02|Jau|2062.63|sal ruan inter|despesa|fixo|
06/02|Jau|1051.32|sal rosileia inter|despesa|fixo|
06/02|Jau|679.85|sal natanny inter|despesa|fixo|
06/02|Jau|2108.23|sal mariana nardello inter|despesa|fixo|
06/02|Jau|1534.87|sal leticia inter|despesa|fixo|
06/02|Jau|2218.62|sal victor scalco inter|despesa|fixo|
06/02|Jau|1456.32|sal victor silva inter|despesa|fixo|
06/02|Jau|2814.62|sal guilherme libanorio inter|despesa|fixo|
06/02|Jau|1332.74|sal isabela couto inter|despesa|fixo|
06/02|Jau|1065.53|sal bruna carolina inter|despesa|fixo|
06/02|Jau|2480|sal pedro inter|despesa|fixo|
06/02|Jau|1206.32|sal gabriela dias|despesa|fixo|
06/02|Pederneiras|1775.5|sal maria eduarda inter|despesa|fixo|
06/02|Pederneiras|2497.46|sal beatriz inter|despesa|fixo|
06/02|L. Paulista|2311.94|sal emanuelly inter|despesa|fixo|
06/02|Jau|1471.64|ferias 10 dias de dezembro pg total santander|despesa|fixo|
06/02|Silvio|380|vale transporte adriana d financeiro|despesa|fixo|
06/02|Silvio|2210.32|salario adriana inter|despesa|fixo|
06/02|Jau|121|despesa juridico d financeiro|despesa|variavel|
06/02|Geral|3461.07|saldo financeiro|receita||true
07/02|Jau|2000|ajuda de custo jessica inter|despesa|fixo|
07/02|Jau|5000|ajuda de custo gabriel inter|despesa|fixo|
07/02|Jau|2075|parcela 3 g4 trasnf cris santander|despesa|fixo|
07/02|Silvio|250|prolabore sebastiao peixes santander|despesa|fixo|
07/02|Jau|488.7|up talentos boleto vaga apoio santander|despesa|variavel|
07/02|Silvio|445.47|caicara clube janeiro santander|despesa|fixo|
07/02|Jau|319.94|leovaldo preto 312,74 santander|despesa|variavel|
07/02|Jau|250|doacao catedral n senhora santander|despesa|variavel|
10/02|Silvio|2895.85|unimed corporativo santander|despesa|fixo|`

const ciaData: Transaction[] = [
  {
    id: 'cia-1',
    tipo: 'despesa',
    descricao: 'Assinatura Software ERP',
    valor: 1500,
    data: '2026-01-10T10:00:00.000Z',
    categoria: 'Fornecedores',
    unidade: 'Geral',
    banco: 'Santander',
    despesaTipo: 'cia',
    classificacao: 'fixo',
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'cia-2',
    tipo: 'despesa',
    descricao: 'Contabilidade Mensal',
    valor: 2500,
    data: '2026-01-15T10:00:00.000Z',
    categoria: 'Fornecedores',
    unidade: 'Geral',
    banco: 'Inter',
    despesaTipo: 'cia',
    classificacao: 'fixo',
    created_at: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'cia-3',
    tipo: 'despesa',
    descricao: 'Marketing Institucional',
    valor: 4500,
    data: '2026-02-05T10:00:00.000Z',
    categoria: 'Outros',
    unidade: 'Geral',
    banco: 'Santander',
    despesaTipo: 'cia',
    classificacao: 'variavel',
    created_at: '2026-02-05T10:00:00.000Z',
  },
  {
    id: 'cia-4',
    tipo: 'despesa',
    descricao: 'Assessoria Jurídica',
    valor: 3000,
    data: '2026-03-20T10:00:00.000Z',
    categoria: 'Fornecedores',
    unidade: 'Geral',
    banco: 'BTG',
    despesaTipo: 'cia',
    classificacao: 'fixo',
    created_at: '2026-03-20T10:00:00.000Z',
  },
]

export const getMockData = (): Transaction[] => {
  const janData: Transaction[] = [
    {
      id: '1',
      tipo: 'despesa',
      descricao: 'Custos Operacionais Jau',
      valor: 184000,
      data: '2026-01-15T10:00:00.000Z',
      categoria: 'Outros',
      unidade: 'Jau',
      banco: 'Santander',
      classificacao: 'fixo',
      created_at: '2026-01-15T10:00:00.000Z',
    },
    {
      id: '2',
      tipo: 'despesa',
      descricao: 'Folha e Fornecedores Pederneiras',
      valor: 10500,
      data: '2026-01-16T10:00:00.000Z',
      categoria: 'Folha de Pagamento',
      unidade: 'Pederneiras',
      banco: 'Inter',
      classificacao: 'fixo',
      created_at: '2026-01-16T10:00:00.000Z',
    },
    {
      id: '3',
      tipo: 'despesa',
      descricao: 'Manutenção L. Paulista',
      valor: 16700,
      data: '2026-01-17T10:00:00.000Z',
      categoria: 'Fornecedores',
      unidade: 'L. Paulista',
      banco: 'BTG',
      classificacao: 'variavel',
      created_at: '2026-01-17T10:00:00.000Z',
    },
    {
      id: '4',
      tipo: 'despesa',
      descricao: 'Despesas Silvio',
      valor: 39600,
      data: '2026-01-18T10:00:00.000Z',
      categoria: 'Outros',
      unidade: 'Silvio',
      banco: 'Nubank',
      classificacao: 'variavel',
      created_at: '2026-01-18T10:00:00.000Z',
    },
    {
      id: '5',
      tipo: 'receita',
      descricao: 'Faturamento Geral Jan',
      valor: 300000,
      data: '2026-01-20T10:00:00.000Z',
      categoria: 'Trabalho',
      unidade: 'Geral',
      banco: 'Santander',
      created_at: '2026-01-20T10:00:00.000Z',
    },
  ]

  const marginData: Transaction[] = [
    {
      id: 'cm-1',
      tipo: 'receita',
      descricao: 'Comissão Venda Imóvel Jaú',
      valor: 145000,
      data: '2026-02-15T10:00:00.000Z',
      categoria: 'Comissão',
      unidade: 'Jau',
      banco: 'Santander',
      receitaTipo: 'comissao',
      created_at: '2026-02-15T10:00:00.000Z',
    },
    {
      id: 'cm-2',
      tipo: 'despesa',
      descricao: 'Despesa Operacional Jaú (Direta)',
      valor: 42000,
      data: '2026-02-16T10:00:00.000Z',
      categoria: 'Fornecedores',
      unidade: 'Jau',
      banco: 'Santander',
      despesaTipo: 'unitaria',
      classificacao: 'variavel',
      created_at: '2026-02-16T10:00:00.000Z',
    },
    {
      id: 'cm-3',
      tipo: 'receita',
      descricao: 'Comissão Venda Imóvel Pederneiras',
      valor: 82000,
      data: '2026-02-17T10:00:00.000Z',
      categoria: 'Comissão',
      unidade: 'Pederneiras',
      banco: 'Inter',
      receitaTipo: 'comissao',
      created_at: '2026-02-17T10:00:00.000Z',
    },
    {
      id: 'cm-4',
      tipo: 'despesa',
      descricao: 'Despesa Operacional Pederneiras (Direta)',
      valor: 28000,
      data: '2026-02-18T10:00:00.000Z',
      categoria: 'Fornecedores',
      unidade: 'Pederneiras',
      banco: 'Inter',
      despesaTipo: 'unitaria',
      classificacao: 'variavel',
      created_at: '2026-02-18T10:00:00.000Z',
    },
    {
      id: 'cm-5',
      tipo: 'receita',
      descricao: 'Comissão Lançamento Lençóis',
      valor: 56000,
      data: '2026-02-19T10:00:00.000Z',
      categoria: 'Comissão',
      unidade: 'L. Paulista',
      banco: 'BTG',
      receitaTipo: 'comissao',
      created_at: '2026-02-19T10:00:00.000Z',
    },
    {
      id: 'cm-6',
      tipo: 'despesa',
      descricao: 'Custo de Stand Lençóis (Direta)',
      valor: 15500,
      data: '2026-02-20T10:00:00.000Z',
      categoria: 'Outros',
      unidade: 'L. Paulista',
      banco: 'BTG',
      despesaTipo: 'unitaria',
      classificacao: 'variavel',
      created_at: '2026-02-20T10:00:00.000Z',
    },
  ]

  const febParsed = rawFebData
    .split('\n')
    .filter(Boolean)
    .map((line, i) => {
      const [dateStr, und, valStr, desc, tipo, classif, isChk] = line.split('|')
      const [day, month] = dateStr.trim().split('/')
      return {
        id: `feb-${i}`,
        tipo: tipo as TransactionType,
        descricao: desc.trim(),
        valor: parseFloat(valStr),
        data: `2026-${month}-${day}T10:00:00.000Z`,
        categoria: 'Outros',
        unidade: und as Unidade,
        banco: guessBank(desc),
        classificacao: classif ? (classif as ClassificacaoDespesa) : null,
        isCheckpoint: isChk === 'true',
        created_at: new Date().toISOString(),
      }
    })

  return [...janData, ...marginData, ...ciaData, ...febParsed]
}
