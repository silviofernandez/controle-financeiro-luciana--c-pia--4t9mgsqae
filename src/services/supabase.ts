const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const isMockEnv = !SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('mock-project')

export interface CommissionPayload {
  description: string
  total_value: number
  team_id: string | null
  broker_id: string | null
  capturer_id: string | null
  has_invoice: boolean
  has_legal: boolean
  legal_value: number
  created_at: string
}

export interface CommissionLinePayload {
  commission_id?: string
  role_name: string
  participant_name: string | null
  level: string | null
  percentage: number | null
  value: number
  created_at: string
}

export const verifyRecordId = async (table: string, id: string): Promise<boolean> => {
  if (isMockEnv || !id) return false
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&select=id`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    })
    if (!res.ok) return false
    const data = await res.json()
    return Array.isArray(data) && data.length > 0
  } catch (error) {
    return false
  }
}

export const saveCommission = async (
  commission: CommissionPayload,
  lines: CommissionLinePayload[],
) => {
  if (isMockEnv) {
    console.warn('Supabase credentials not found or mocked. Simulating save...', {
      commission,
      lines,
    })
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return { id: crypto.randomUUID() }
  }

  try {
    const commRes = await fetch(`${SUPABASE_URL}/rest/v1/commissions`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify([commission]),
    })

    if (!commRes.ok) {
      let errStr = await commRes.text()
      try {
        const errObj = JSON.parse(errStr)
        errStr = errObj.message || errObj.details || errStr
      } catch (e) {
        // Ignorar falha no parse
      }
      console.error('Failed to save commission:', errStr)
      throw new Error(`Erro ao salvar na base: ${errStr}`)
    }

    const commData = await commRes.json()
    const commissionId = commData[0]?.id

    if (commissionId && lines.length > 0) {
      const linesToInsert = lines.map((l) => ({ ...l, commission_id: commissionId }))
      const linesRes = await fetch(`${SUPABASE_URL}/rest/v1/commission_lines`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(linesToInsert),
      })

      if (!linesRes.ok) {
        let errStr = await linesRes.text()
        try {
          const errObj = JSON.parse(errStr)
          errStr = errObj.message || errObj.details || errStr
        } catch (e) {
          // Ignorar falha no parse
        }
        console.error('Failed to save commission lines:', errStr)
        throw new Error(`Erro ao salvar itens da comissão: ${errStr}`)
      }
    }

    return { id: commissionId }
  } catch (error) {
    console.error('Supabase save error:', error)
    throw error
  }
}
