import React, { createContext, useContext, useState, useEffect } from 'react'
import { CommissionTeam } from '@/types'
import { toast } from '@/hooks/use-toast'

const MOCK_TEAMS: CommissionTeam[] = [
  {
    id: '11111111-1111-4111-a111-111111111111',
    name: 'Imóveis Usados — Terceiros',
    defaultTax: true,
    defaultLegal: true,
    rules: [
      {
        id: '11111111-1111-4111-a111-111111111112',
        role: 'Corretor',
        variations: [
          {
            id: '11111111-1111-4111-a111-111111111113',
            name: 'Pleno',
            value: 38,
            type: 'percentage',
          },
          {
            id: '11111111-1111-4111-a111-111111111114',
            name: 'Sênior',
            value: 43,
            type: 'percentage',
          },
        ],
      },
      {
        id: '11111111-1111-4111-a111-111111111115',
        role: 'Captador',
        variations: [
          {
            id: '11111111-1111-4111-a111-111111111116',
            name: 'Padrão',
            value: 5,
            type: 'percentage',
          },
        ],
      },
      {
        id: '11111111-1111-4111-a111-111111111117',
        role: 'Gerência da Equipe',
        variations: [
          {
            id: '11111111-1111-4111-a111-111111111118',
            name: 'Padrão',
            value: 5,
            type: 'percentage',
          },
        ],
      },
      {
        id: '11111111-1111-4111-a111-111111111119',
        role: 'Apoio',
        variations: [
          {
            id: '11111111-1111-4111-a111-11111111111a',
            name: 'Padrão',
            value: 1,
            type: 'percentage',
          },
        ],
      },
      {
        id: '11111111-1111-4111-a111-11111111111b',
        role: 'Gerência Geral',
        variations: [
          {
            id: '11111111-1111-4111-a111-11111111111c',
            name: 'Padrão',
            value: 2,
            type: 'percentage',
          },
        ],
      },
    ],
  },
  {
    id: '22222222-2222-4222-a222-222222222222',
    name: 'Lançamentos Jaú',
    defaultTax: true,
    defaultLegal: false,
    rules: [
      {
        id: '22222222-2222-4222-a222-222222222223',
        role: 'Corretor',
        variations: [
          {
            id: '22222222-2222-4222-a222-222222222224',
            name: 'Padrão',
            value: 38,
            type: 'percentage',
          },
        ],
      },
      {
        id: '22222222-2222-4222-a222-222222222225',
        role: 'Gestora da Equipe',
        variations: [
          {
            id: '22222222-2222-4222-a222-222222222226',
            name: 'Padrão',
            value: 5,
            type: 'percentage',
          },
        ],
      },
      {
        id: '22222222-2222-4222-a222-222222222227',
        role: 'Gerência Geral',
        variations: [
          {
            id: '22222222-2222-4222-a222-222222222228',
            name: 'Padrão',
            value: 2,
            type: 'percentage',
          },
        ],
      },
      {
        id: '22222222-2222-4222-a222-222222222229',
        role: 'Apoio',
        variations: [
          {
            id: '22222222-2222-4222-a222-22222222222a',
            name: 'Padrão',
            value: 0.5,
            type: 'percentage',
          },
        ],
      },
    ],
  },
  {
    id: '33333333-3333-4333-a333-333333333333',
    name: 'Pederneiras',
    defaultTax: true,
    defaultLegal: true,
    rules: [
      {
        id: '33333333-3333-4333-a333-333333333334',
        role: 'Corretor',
        variations: [
          {
            id: '33333333-3333-4333-a333-333333333335',
            name: 'Padrão',
            value: 43,
            type: 'percentage',
          },
        ],
      },
      {
        id: '33333333-3333-4333-a333-333333333336',
        role: 'Captador',
        variations: [
          {
            id: '33333333-3333-4333-a333-333333333337',
            name: 'Padrão',
            value: 5,
            type: 'percentage',
          },
        ],
      },
      {
        id: '33333333-3333-4333-a333-333333333338',
        role: 'Apoio',
        variations: [
          {
            id: '33333333-3333-4333-a333-333333333339',
            name: 'Padrão',
            value: 0.5,
            type: 'percentage',
          },
        ],
      },
      {
        id: '33333333-3333-4333-a333-33333333333a',
        role: 'Gerência Geral',
        variations: [
          {
            id: '33333333-3333-4333-a333-33333333333b',
            name: 'Padrão',
            value: 2,
            type: 'percentage',
          },
        ],
      },
    ],
  },
]

interface CommissionContextData {
  teams: CommissionTeam[]
  saveTeam: (team: CommissionTeam) => void
  deleteTeam: (id: string) => void
}

const CommissionContext = createContext<CommissionContextData>({} as CommissionContextData)

export const useCommissions = () => useContext(CommissionContext)

export const CommissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<CommissionTeam[]>(() => {
    // Bumped local storage key to v2 to clean invalid UUIDs
    const saved = localStorage.getItem('@financeiro:commissions:v2')
    if (saved) return JSON.parse(saved)
    return MOCK_TEAMS
  })

  useEffect(() => {
    localStorage.setItem('@financeiro:commissions:v2', JSON.stringify(teams))
  }, [teams])

  const saveTeam = (team: CommissionTeam) => {
    setTeams((prev) => {
      const exists = prev.find((t) => t.id === team.id)
      if (exists) return prev.map((t) => (t.id === team.id ? team : t))
      return [...prev, team]
    })
    toast({ title: 'Sucesso', description: 'Regras de equipe salvas com sucesso.' })
  }

  const deleteTeam = (id: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== id))
    toast({ title: 'Excluído', description: 'Equipe removida com sucesso.' })
  }

  return React.createElement(
    CommissionContext.Provider,
    { value: { teams, saveTeam, deleteTeam } },
    children,
  )
}
