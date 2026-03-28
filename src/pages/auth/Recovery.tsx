import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Landmark, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function Recovery() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { recoverPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({
        title: 'Atenção',
        description: 'Por favor, insira um e-mail.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      await recoverPassword(email)
      setSubmitted(true)
      toast({ title: 'Enviado', description: 'Link de recuperação enviado com sucesso!' })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao solicitar recuperação.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
      <Card className="w-full max-w-md shadow-lg border-blue-100/50 animate-fade-in-up">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 bg-primary/10 flex items-center justify-center rounded-xl">
              <Landmark className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">
            Recuperar Senha
          </CardTitle>
          <CardDescription className="text-slate-500">
            Enviaremos as instruções para você redefinir sua senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Seu E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Enviar Link de Recuperação
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 bg-emerald-50 text-emerald-800 p-4 rounded-lg border border-emerald-200 animate-in fade-in">
              <p className="font-medium">Tudo certo!</p>
              <p className="text-sm">
                Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha
                em instantes.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
