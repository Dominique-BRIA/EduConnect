import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, LockKeyhole, Mail } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', motDePasse: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email.trim() || !form.motDePasse.trim()) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)
    try {
      await login(form)
      navigate('/')
      toast.success('Connexion réussie')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden border-r border-border/80 lg:flex">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,115,105,0.12),transparent_42%),linear-gradient(210deg,rgba(196,106,57,0.14),transparent_34%)]" />
          <div className="relative flex w-full flex-col justify-between p-10">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
                  E
                </div>
                <div>
                  <p className="font-[family:var(--font-display)] text-3xl text-foreground">EduConnect</p>
                  <p className="text-sm text-muted-foreground">Réseau étudiant temps réel</p>
                </div>
              </div>

              <div className="mt-16 max-w-xl space-y-6">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Frontend moderne branché sur le backend Spring
                </p>
                <h1 className="text-6xl leading-[0.92] text-foreground">
                  Un espace social qui reste vivant sans rechargement de page.
                </h1>
                <p className="max-w-lg text-base text-muted-foreground">
                  Messagerie temps réel via WebSocket, fil revalidé en arrière-plan, navigation
                  applicative fluide et structure de données alignée sur les contrats API.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Temps réel', 'Messages privés synchronisés côté REST et signalés côté socket.'],
                ['Fil vivant', 'Le flux se revalide en tâche de fond sans casser la lecture.'],
                ['Structure propre', 'Types métier, layout responsive et états de chargement réels.'],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-[1.75rem] border border-border/70 bg-card/70 p-5 shadow-sm backdrop-blur"
                >
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Connexion
              </p>
              <h1 className="text-4xl text-foreground">Retrouver votre espace étudiant</h1>
              <p className="max-w-md text-sm text-muted-foreground">
                Connectez-vous pour accéder à votre fil, vos messages et vos sessions live sans
                rupture de navigation.
              </p>
            </div>

            <Card className="rounded-[1.9rem] border-border/80 bg-card/92 shadow-[0_24px_80px_-56px_rgba(27,31,36,0.45)] backdrop-blur">
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl">Identifiants</CardTitle>
                <CardDescription>
                  Votre session restera synchronisée automatiquement tant que votre refresh token est valide.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                      <Mail className="size-4 text-primary" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="prenom.nom@campus.fr"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motDePasse" className="flex items-center gap-2 text-sm">
                      <LockKeyhole className="size-4 text-primary" />
                      Mot de passe
                    </Label>
                    <Input
                      id="motDePasse"
                      name="motDePasse"
                      type="password"
                      placeholder="Votre mot de passe"
                      value={form.motDePasse}
                      onChange={handleChange}
                      autoComplete="current-password"
                      disabled={loading}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="mt-4 h-11 w-full gap-2 rounded-full">
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Connexion en cours
                      </>
                    ) : (
                      <>
                        Accéder à mon espace
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
              Pas encore de compte{' '}
              <Link to="/register" className="font-semibold text-primary transition hover:text-primary/85">
                Créer un profil
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
