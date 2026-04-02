import { useState } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus, Tag } from 'lucide-react'
import { UNIDADES, BANCOS } from '@/types'
import { toast } from '@/hooks/use-toast'
import { BrokerSettings } from '@/components/BrokerSettings'
import { CommissionSettings } from '@/components/CommissionSettings'
import { CreditCardSettings } from '@/components/CreditCardSettings'
import { TeamsManager } from '@/components/TeamsManager'

export default function Settings() {
  const { categories, addCategory, removeCategory, taggingRules, addRule, removeRule } =
    useSettings()

  const [newCat, setNewCat] = useState('')
  const [newRuleKeyword, setNewRuleKeyword] = useState('')
  const [newRuleType, setNewRuleType] = useState<'categoria' | 'unidade' | 'banco'>('categoria')
  const [newRuleTarget, setNewRuleTarget] = useState('')

  const handleAddCategory = () => {
    if (!newCat.trim()) return
    if (categories.includes(newCat.trim())) {
      toast({ title: 'Atenção', description: 'Categoria já existe.', variant: 'destructive' })
      return
    }
    addCategory(newCat.trim())
    setNewCat('')
    toast({ title: 'Sucesso', description: 'Categoria adicionada.' })
  }

  const handleAddRule = () => {
    if (!newRuleKeyword.trim() || !newRuleTarget.trim()) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos da regra.',
        variant: 'destructive',
      })
      return
    }
    addRule({
      keyword: newRuleKeyword.trim(),
      targetType: newRuleType,
      targetValue: newRuleTarget,
    })
    setNewRuleKeyword('')
    setNewRuleTarget('')
    toast({ title: 'Sucesso', description: 'Regra de auto-tagging criada.' })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">Configurações</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie categorias, regras automáticas e preferências.
        </p>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 max-w-[1050px]">
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="rules">Regras Auto-tagging</TabsTrigger>
          <TabsTrigger value="cards">Cartões</TabsTrigger>
          <TabsTrigger value="collaborators">Colaboradores</TabsTrigger>
          <TabsTrigger value="commissions">Modelos de Repasse</TabsTrigger>
          <TabsTrigger value="teams">Equipes</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Categorias</CardTitle>
              <CardDescription>
                Crie ou remova categorias para classificar seus lançamentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="Nova categoria (ex: Assinaturas)"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                </div>
                <Button onClick={handleAddCategory} className="shrink-0 gap-2">
                  <Plus className="w-4 h-4" /> Adicionar
                </Button>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Categoria</TableHead>
                      <TableHead className="w-[100px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((c) => (
                      <TableRow key={c}>
                        <TableCell className="font-medium">{c}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => removeCategory(c)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {categories.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                          Nenhuma categoria cadastrada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Auto-tagging</CardTitle>
              <CardDescription>
                Defina palavras-chave que preencherão automaticamente categoria, unidade ou banco.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="space-y-1 md:col-span-1">
                  <Label>Se a descrição contiver:</Label>
                  <Input
                    placeholder="ex: Uber"
                    value={newRuleKeyword}
                    onChange={(e) => setNewRuleKeyword(e.target.value)}
                  />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <Label>Definir campo:</Label>
                  <Select
                    value={newRuleType}
                    onValueChange={(v: any) => {
                      setNewRuleType(v)
                      setNewRuleTarget('')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="categoria">Categoria</SelectItem>
                      <SelectItem value="unidade">Unidade</SelectItem>
                      <SelectItem value="banco">Banco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-1">
                  <Label>Para o valor:</Label>
                  {newRuleType === 'categoria' && (
                    <Select value={newRuleTarget} onValueChange={setNewRuleTarget}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {newRuleType === 'unidade' && (
                    <Select value={newRuleTarget} onValueChange={setNewRuleTarget}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDADES.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {newRuleType === 'banco' && (
                    <Select value={newRuleTarget} onValueChange={setNewRuleTarget}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANCOS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Button onClick={handleAddRule} className="w-full md:w-auto md:col-span-1 gap-2">
                  <Plus className="w-4 h-4" /> Criar Regra
                </Button>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Palavra-chave</TableHead>
                      <TableHead>Campo Alvo</TableHead>
                      <TableHead>Valor Atribuído</TableHead>
                      <TableHead className="w-[100px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taggingRules.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">"{r.keyword}"</TableCell>
                        <TableCell className="capitalize">{r.targetType}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary text-xs font-medium">
                            <Tag className="w-3 h-3" /> {r.targetValue}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => removeRule(r.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {taggingRules.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          Nenhuma regra cadastrada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4 mt-4">
          <CreditCardSettings />
        </TabsContent>

        <TabsContent value="collaborators" className="space-y-4 mt-4">
          <BrokerSettings />
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4 mt-4">
          <CommissionSettings />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4 mt-4">
          <TeamsManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
