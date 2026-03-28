export interface ParsedTransaction {
  id: string
  originalName: string
  date: string // YYYY-MM-DD
  amount: number
}

function parseDate(dateStr: string): string {
  // Try DD/MM/YYYY or DD/MM
  const matchBR = dateStr.match(/(\d{2})[/-](\d{2})(?:[/-](\d{4}|\d{2}))?/)
  if (matchBR) {
    const [_, d, m, y] = matchBR
    const year = y ? (y.length === 2 ? `20${y}` : y) : new Date().getFullYear().toString()
    return `${year}-${m}-${d}`
  }

  // Try YYYYMMDD (OFX format)
  const matchOFX = dateStr.match(/^(\d{4})(\d{2})(\d{2})/)
  if (matchOFX) {
    return `${matchOFX[1]}-${matchOFX[2]}-${matchOFX[3]}`
  }

  return new Date().toISOString().split('T')[0]
}

function parseAmount(amountStr: string): number {
  if (!amountStr) return 0
  const clean = amountStr.replace(/[^\d.,-]/g, '')
  // If it has both dot and comma, assume comma is decimal (Brazilian format)
  if (clean.includes(',') && clean.includes('.')) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.'))
  }
  // If only comma, assume it's decimal
  if (clean.includes(',')) {
    return parseFloat(clean.replace(',', '.'))
  }
  return parseFloat(clean)
}

async function parseCSV(file: File): Promise<ParsedTransaction[]> {
  const text = await file.text()
  const lines = text.split('\n').filter((l) => l.trim())
  const separator = lines[0].includes(';') ? ';' : ','

  const results: ParsedTransaction[] = []

  // Skip header if it exists (very basic heuristic)
  const startIndex =
    lines[0].toLowerCase().includes('data') || lines[0].toLowerCase().includes('date') ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i].split(separator).map((c) => c.trim().replace(/^"|"$/g, ''))
    if (cols.length >= 3) {
      // Assuming typical format: Date, Description, Amount
      const date = parseDate(cols[0])
      const desc = cols[1] || 'Desconhecido'
      const amount = parseAmount(cols[2] || cols[3]) // Sometimes amount is in 4th col

      if (!isNaN(amount) && amount !== 0) {
        results.push({
          id: crypto.randomUUID(),
          originalName: desc,
          date,
          amount: Math.abs(amount),
        })
      }
    }
  }
  return results
}

async function parseOFX(file: File): Promise<ParsedTransaction[]> {
  const text = await file.text()
  const trns = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/g) || []

  return trns
    .map((trn) => {
      const dateMatch = trn.match(/<DTPOSTED>([^<]+)/)
      const amtMatch = trn.match(/<TRNAMT>([^<]+)/)
      const memoMatch = trn.match(/<MEMO>([^<]+)/)

      return {
        id: crypto.randomUUID(),
        date: dateMatch ? parseDate(dateMatch[1]) : new Date().toISOString().split('T')[0],
        amount: amtMatch ? Math.abs(parseFloat(amtMatch[1])) : 0,
        originalName: memoMatch ? memoMatch[1].trim() : 'Desconhecido',
      }
    })
    .filter((t) => t.amount !== 0)
}

async function parsePDF(file: File): Promise<ParsedTransaction[]> {
  // @ts-expect-error
  const pdfjsLib =
    await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.mjs')
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.mjs'

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item: any) => item.str).join(' ')
    fullText += pageText + '\n'
  }

  const results: ParsedTransaction[] = []
  // Basic heuristic: Date (DD/MM) + Description + Amount
  const regex = /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.+?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})/g
  let match

  while ((match = regex.exec(fullText)) !== null) {
    const amount = parseAmount(match[3])
    if (!isNaN(amount) && amount !== 0) {
      results.push({
        id: crypto.randomUUID(),
        date: parseDate(match[1]),
        originalName: match[2].trim(),
        amount: Math.abs(amount),
      })
    }
  }

  return results
}

async function parseXLSX(file: File): Promise<ParsedTransaction[]> {
  // @ts-expect-error
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs')
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

  const results: ParsedTransaction[] = []

  // Skip header, find rows with enough columns
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i]
    if (Array.isArray(row) && row.length >= 3) {
      // Assuming Date, Desc, Amount in first 3 or 4 cols
      const dateStr = String(row[0] || '')
      const desc = String(row[1] || 'Desconhecido')
      const amtStr = String(row[2] || row[3] || '0')

      const amount = parseAmount(amtStr)
      if (dateStr && !isNaN(amount) && amount !== 0) {
        results.push({
          id: crypto.randomUUID(),
          date: parseDate(dateStr),
          originalName: desc,
          amount: Math.abs(amount),
        })
      }
    }
  }
  return results
}

export async function parseStatement(file: File): Promise<ParsedTransaction[]> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'csv':
      return parseCSV(file)
    case 'ofx':
    case 'ofc':
      return parseOFX(file)
    case 'pdf':
      return parsePDF(file)
    case 'xlsx':
    case 'xls':
      return parseXLSX(file)
    default:
      throw new Error('Formato de arquivo não suportado.')
  }
}
