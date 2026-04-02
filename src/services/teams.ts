import pb from '@/lib/pocketbase/client'

export interface Team {
  id: string
  name: string
  created: string
  updated: string
}

export const getTeams = () => pb.collection('teams').getFullList<Team>({ sort: 'name' })
export const createTeam = (data: { name: string }) => pb.collection('teams').create<Team>(data)
export const updateTeam = (id: string, data: { name: string }) =>
  pb.collection('teams').update<Team>(id, data)
export const deleteTeam = (id: string) => pb.collection('teams').delete(id)
