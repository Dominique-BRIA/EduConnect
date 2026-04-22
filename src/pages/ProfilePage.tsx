import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Globe2, Loader2, MapPin, UserMinus, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { etudiantApi, publicationApi } from '@/api'
import PublicationCard from '@/app/components/feed/PublicationCard'
import { Avatar } from '@/app/components/ui/avatar'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { SkeletonPublicationCard } from '@/app/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { fullName, getInitials } from '@/lib/formatters'
import type { Publication, Student } from '@/types/domain'

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Student | null>(null)
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [toggleFollowLoading, setToggleFollowLoading] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!id) return
        const numericId = Number(id)
        const { data } = await etudiantApi.getProfil(numericId)
        setProfile(data)
        const { data: subs } = await etudiantApi.getAbonnements()
        setIsFollowing(subs.some((subscription) => subscription.id === numericId))

        const { data: pubs } = await publicationApi.getByEtudiant(numericId, 0)
        setPublications(pubs.content || [])
      } catch (error) {
        toast.error('Erreur lors du chargement du profil')
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [id])

  const handleFollow = async () => {
    if (!id) return
    try {
      setToggleFollowLoading(true)
      if (isFollowing) {
        await etudiantApi.seDesabonner(id)
        setIsFollowing(false)
        setProfile((current) =>
          current
            ? {
                ...current,
                nbAbonnes: Math.max(0, current.nbAbonnes - 1),
              }
            : current,
        )
        toast.success('Désabonnement effectué')
      } else {
        await etudiantApi.suivre(id)
        setIsFollowing(true)
        setProfile((current) =>
          current
            ? {
                ...current,
                nbAbonnes: current.nbAbonnes + 1,
              }
            : current,
        )
        toast.success('Abonnement effectué')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'action')
    } finally {
      setToggleFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="rounded-[2rem] border-border/80 p-6">
          <div className="flex items-start gap-4">
            <div className="size-20 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-64 bg-muted rounded-lg animate-pulse" />
              <div className="h-4 w-48 bg-muted rounded-lg animate-pulse" />
              <div className="h-4 w-40 bg-muted rounded-lg animate-pulse" />
            </div>
            <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
          </div>
        </Card>

        <div>
          <div className="h-8 w-40 bg-muted rounded-lg animate-pulse mb-4" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonPublicationCard key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Profil non trouvé</p>
      </div>
    )
  }

  const initials = getInitials(profile.nom, profile.prenom)
  const isOwnProfile = user?.id === profile.id

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-[2rem] border border-border/80 bg-card/92 p-7 shadow-[0_20px_60px_-48px_rgba(27,31,36,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar size="lg" className="size-16 text-lg">{initials}</Avatar>
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Profil</p>
                <h1 className="mt-2 text-5xl text-foreground">{fullName(profile.nom, profile.prenom)}</h1>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.etablissement && (
                  <div className="rounded-full border border-border/80 bg-muted/60 px-3 py-1.5 text-sm text-muted-foreground">
                    {profile.etablissement}
                  </div>
                )}
                {profile.pays && (
                  <div className="flex items-center gap-1 rounded-full border border-border/80 bg-muted/60 px-3 py-1.5 text-sm text-muted-foreground">
                    <Globe2 className="size-3.5" />
                    {profile.pays}
                  </div>
                )}
                {profile.hobby && (
                  <div className="flex items-center gap-1 rounded-full border border-border/80 bg-muted/60 px-3 py-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {profile.hobby}
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            {!isOwnProfile && (
              <Button
                onClick={handleFollow}
                disabled={toggleFollowLoading}
                variant={isFollowing ? 'outline' : 'default'}
                className="gap-2 rounded-full"
              >
                {toggleFollowLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserMinus className="size-4" />
                    Ne plus suivre
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    Suivre
                  </>
                )}
              </Button>
            )}

            <div className="grid grid-cols-2 gap-3 lg:min-w-[260px]">
              <Card className="rounded-[1.4rem] border-border/80 bg-muted/35 shadow-none">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-semibold text-foreground">{profile.nbAbonnements}</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Abonnements
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-[1.4rem] border-border/80 bg-muted/35 shadow-none">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-semibold text-foreground">{profile.nbAbonnes}</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Abonnés
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <div>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Historique</p>
            <h2 className="mt-2 text-4xl text-foreground">Publications récentes</h2>
          </div>
          <div className="rounded-full border border-border/80 bg-card/80 px-4 py-2 text-sm text-muted-foreground">
            {publications.length} élément{publications.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="space-y-4">
          {publications.length === 0 ? (
            <Card className="rounded-[1.75rem] border-dashed border-border/80 bg-card/80 p-8">
              <p className="text-center text-muted-foreground">
                Aucune publication pour le moment
              </p>
            </Card>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              {publications.map((pub) => (
                <PublicationCard
                  key={pub.id}
                  publication={pub}
                  onUpdate={(updatedPublication) =>
                    setPublications((current) =>
                      current.map((item) => (item.id === updatedPublication.id ? updatedPublication : item)),
                    )
                  }
                  onDelete={(publicationId) =>
                    setPublications((current) => current.filter((item) => item.id !== publicationId))
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
