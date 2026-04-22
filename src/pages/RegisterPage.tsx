import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, Globe2, Loader2, Mail, PenLine, UserRound } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    confirmMotDePasse: '',
    etablissement: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim() || !form.motDePasse.trim() || !form.etablissement.trim()) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    if (form.motDePasse !== form.confirmMotDePasse) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    if (form.motDePasse.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setLoading(true)
    try {
      const { confirmMotDePasse, ...data } = form
      await register({
        ...data,
        etablissement: data.etablissement || null,
        pays: data.pays || null,
        hobby: data.hobby || null,
        dateNaissance: data.dateNaissance || null,
      })
      navigate('/')
      toast.success('Inscription réussie')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Création de compte
            </p>
            <h1 className="text-5xl text-foreground">Lancer votre présence sur le campus numérique</h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Le profil gère à la fois votre identité, vos publications, vos contacts et vos accès temps réel.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Profil riche', 'Établissement, localisation et centres d’intérêt pour contextualiser les échanges.'],
              ['Messagerie active', 'Ouverture instantanée des conversations et synchronisation en continu.'],
              ['Feed contextualisé', 'Le fil dépend de vos abonnements et se met à jour sans hard refresh.'],
              ['Lives collaboratifs', 'Préparez des sessions synchronisées autour du tableau blanc en temps réel.'],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-[1.75rem] border border-border/80 bg-card/75 p-5 shadow-sm"
              >
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <Card className="rounded-[2rem] border-border/80 bg-card/92 shadow-[0_24px_80px_-56px_rgba(27,31,36,0.45)] backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Vos informations</CardTitle>
            <CardDescription>
              Les champs date, pays et hobby sont facultatifs mais utiles pour enrichir votre profil.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prenom" className="flex items-center gap-2 text-sm">
                    <UserRound className="size-4 text-primary" />
                    Prénom
                  </Label>
                  <Input
                    id="prenom"
                    name="prenom"
                    placeholder="Amina"
                    value={form.prenom}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nom" className="flex items-center gap-2 text-sm">
                    <UserRound className="size-4 text-primary" />
                    Nom
                  </Label>
                  <Input
                    id="nom"
                    name="nom"
                    placeholder="Belaid"
                    value={form.nom}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

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
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="etablissement" className="flex items-center gap-2 text-sm">
                  <Building2 className="size-4 text-primary" />
                  Établissement
                </Label>
                <Input
                  id="etablissement"
                  name="etablissement"
                  placeholder="Université Paris-Saclay"
                  value={form.etablissement}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pays" className="flex items-center gap-2 text-sm">
                    <Globe2 className="size-4 text-primary" />
                    Pays
                  </Label>
                  <Input
                    id="pays"
                    name="pays"
                    placeholder="France"
                    value={form.pays}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateNaissance" className="text-sm">
                    Date de naissance
                  </Label>
                  <Input
                    id="dateNaissance"
                    name="dateNaissance"
                    type="date"
                    value={form.dateNaissance}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hobby" className="flex items-center gap-2 text-sm">
                  <PenLine className="size-4 text-primary" />
                  Centre d’intérêt
                </Label>
                <Input
                  id="hobby"
                  name="hobby"
                  placeholder="Design, IA, football, photo..."
                  value={form.hobby}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="motDePasse" className="text-sm">
                    Mot de passe
                  </Label>
                  <Input
                    id="motDePasse"
                    name="motDePasse"
                    type="password"
                    placeholder="Minimum 6 caractères"
                    value={form.motDePasse}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmMotDePasse" className="text-sm">
                    Confirmation
                  </Label>
                  <Input
                    id="confirmMotDePasse"
                    name="confirmMotDePasse"
                    type="password"
                    placeholder="Retapez votre mot de passe"
                    value={form.confirmMotDePasse}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="h-11 w-full gap-2 rounded-full">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Création du compte
                  </>
                ) : (
                  <>
                    Ouvrir mon espace
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              <p className="text-sm text-muted-foreground">
                Déjà inscrit{' '}
                <Link to="/login" className="font-semibold text-primary transition hover:text-primary/85">
                  Se connecter
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
