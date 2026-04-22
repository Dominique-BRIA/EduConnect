import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Loader2,
  Plus,
  Radio,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

import { liveApi } from '@/api'
import { Avatar } from '@/app/components/ui/avatar'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { SkeletonLiveCard } from '@/app/components/ui/skeleton'
import { formatTimeAgo, fullName, getInitials } from '@/lib/formatters'
import type { Live } from '@/types/domain'

export default function LivesPage() {
  const navigate = useNavigate()
  const [lives, setLives] = useState<Live[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    titre: '',
    publicationId: '',
  })

  const loadLives = useCallback(async () => {
    try {
      const { data } = await liveApi.getActifs()
      setLives(data)
    } catch (error) {
      toast.error('Impossible de charger les lives actifs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLives()

    const interval = window.setInterval(loadLives, 20000)
    window.addEventListener('focus', loadLives)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', loadLives)
    }
  }, [loadLives])

  const handleJoinLive = async (liveId: number) => {
    try {
      setJoiningId(liveId)
      navigate(`/lives/${liveId}`)
    } catch (error) {
      toast.error('Erreur lors de la connexion au live')
    } finally {
      setJoiningId(null)
    }
  }

  const handleCreateLive = async () => {
    if (!createForm.titre.trim()) {
      toast.error('Veuillez saisir un titre pour le live')
      return
    }

    setCreating(true)

    try {
      const { data: createdLive } = await liveApi.creer({
        titre: createForm.titre.trim(),
        publicationId: createForm.publicationId ? Number(createForm.publicationId) : null,
      })
      const { data: startedLive } = await liveApi.demarrer(createdLive.id)
      toast.success('Live démarré')
      navigate(`/lives/${startedLive.id}`)
    } catch (error) {
      toast.error('Impossible de créer le live')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-[2rem] border-border/80 bg-card/92 shadow-[0_20px_60px_-48px_rgba(27,31,36,0.45)]">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="relative mt-1">
                <Radio className="size-8 text-destructive" />
                <span className="absolute -right-1 -top-1 size-3 rounded-full bg-destructive animate-pulse" />
              </div>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Lives</p>
                <h1 className="text-5xl text-foreground">Sessions actives et tableau blanc collaboratif</h1>
                <p className="max-w-3xl text-sm text-muted-foreground">
                  Les rooms reposent sur les endpoints live existants, avec mise à jour en continu des participants et synchronisation du tableau via WebSocket.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/80 bg-card/92 shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h2 className="text-2xl text-foreground">Lancer un live</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Création puis démarrage immédiat pour entrer directement dans la room.
            </p>

            <div className="space-y-3">
              <Input
                value={createForm.titre}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, titre: event.target.value }))
                }
                placeholder="Titre du live"
              />
              <Input
                value={createForm.publicationId}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, publicationId: event.target.value }))
                }
                placeholder="ID publication lié (optionnel)"
                inputMode="numeric"
              />
              <Button
                onClick={() => void handleCreateLive()}
                disabled={creating}
                className="w-full rounded-full"
              >
                {creating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Création en cours
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Créer et démarrer
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Actifs</p>
            <h2 className="mt-2 text-4xl text-foreground">Directs en cours</h2>
          </div>
          <div className="rounded-full border border-border/80 bg-card/80 px-4 py-2 text-sm text-muted-foreground">
            {lives.length} live{lives.length > 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <SkeletonLiveCard key={index} />
            ))}
          </div>
        ) : lives.length === 0 ? (
          <Card className="rounded-[1.75rem] border-dashed border-border/80 bg-card/80">
            <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
              <Radio className="mb-4 size-12 text-muted-foreground/40" />
              <h3 className="text-xl font-semibold text-foreground">Aucun live actif</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Démarrez une room pour lancer le premier tableau blanc.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {lives.map((live) => {
              const creatorInitials = getInitials(live.createur.nom, live.createur.prenom)

              return (
                <Card
                  key={live.id}
                  className="overflow-hidden rounded-[1.75rem] border-border/80 bg-card/92 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] bg-[linear-gradient(135deg,rgba(16,115,105,0.18),transparent_45%),linear-gradient(215deg,rgba(196,106,57,0.2),transparent_45%)]">
                    <div className="absolute left-4 top-4">
                      <Badge variant="destructive" className="gap-2 rounded-full px-3 py-1">
                        <span className="size-2 rounded-full bg-white animate-pulse" />
                        EN DIRECT
                      </Badge>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 rounded-[1.2rem] border border-white/30 bg-white/70 px-4 py-3 backdrop-blur">
                      <p className="text-sm font-semibold text-foreground">{live.titre}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Démarré {formatTimeAgo(live.dateDebut)}
                      </p>
                    </div>
                  </div>

                  <CardHeader className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">{creatorInitials}</Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {fullName(live.createur.nom, live.createur.prenom)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {live.createur.etablissement || 'Créateur du live'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-muted/55 px-3 py-3">
                        <p className="font-semibold text-foreground">{live.participants.length}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Participants
                        </p>
                      </div>
                      <div className="rounded-2xl bg-muted/55 px-3 py-3">
                        <p className="font-semibold text-foreground">{live.intervenants.length}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Intervenants
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => void handleJoinLive(live.id)}
                      disabled={joiningId === live.id}
                      className="w-full rounded-full"
                    >
                      {joiningId === live.id ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Connexion
                        </>
                      ) : (
                        <>
                          Rejoindre le live
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
