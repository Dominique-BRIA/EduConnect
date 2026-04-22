import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Search, Sparkles, TrendingUp, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { etudiantApi, publicationApi } from '@/api'
import CreatePost from '@/app/components/feed/CreatePost'
import PublicationCard from '@/app/components/feed/PublicationCard'
import { Avatar } from '@/app/components/ui/avatar'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { SkeletonPublicationCard, SkeletonUserCard } from '@/app/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { fullName, getInitials } from '@/lib/formatters'
import type { Publication, Student } from '@/types/domain'

function mergePublications(nextItems: Publication[], currentItems: Publication[]) {
  const merged = new Map<number, Publication>()

  currentItems.forEach((publication) => merged.set(publication.id, publication))
  nextItems.forEach((publication) => merged.set(publication.id, publication))

  return Array.from(merged.values()).sort(
    (left, right) => new Date(right.datePublication).getTime() - new Date(left.datePublication).getTime(),
  )
}

export default function FeedPage() {
  const { user } = useAuth()
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [suggestions, setSuggestions] = useState<Student[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(true)
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())

  const loadFeed = useCallback(async (p = 0) => {
    try {
      if (p > 0) setLoadingMore(true)
      const { data } = await publicationApi.getFil(p)

      if (p === 0) {
        setPublications(data.content || [])
      } else {
        setPublications((prev) => mergePublications(data.content || [], prev))
      }
      setHasMore(!data.last)
      setPage(p)
      setLastRefreshAt(new Date())
    } catch (error) {
      toast.error('Erreur de chargement du fil')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    void loadFeed(0)
  }, [loadFeed])

  const refreshFeedHead = useCallback(async () => {
    if (document.visibilityState === 'hidden') {
      return
    }

    try {
      const { data } = await publicationApi.getFil(0)

      startTransition(() => {
        setPublications((current) => mergePublications(data.content || [], current))
        setHasMore(!data.last)
        setLastRefreshAt(new Date())
      })
    } catch (error) {
      console.error('Impossible de revalider le fil', error)
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshFeedHead()
    }, 15000)

    const handleFocus = () => {
      void refreshFeedHead()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [refreshFeedHead])

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const { data } = await etudiantApi.search(deferredSearch)
        setSuggestions(data.filter((e) => e.id !== user?.id).slice(0, 6))
      } catch (error) {
        console.error('Erreur lors du chargement des suggestions', error)
      } finally {
        setSuggestionsLoading(false)
      }
    }

    setSuggestionsLoading(true)
    void loadSuggestions()
  }, [deferredSearch, user?.id])

  const handleNewPublication = (pub: Publication) => {
    setPublications((prev) => [pub, ...prev])
    setLastRefreshAt(new Date())
  }

  const handleUpdatePublication = (pub: Publication) => {
    setPublications((prev) => prev.map((p) => (p.id === pub.id ? pub : p)))
  }

  const handleDeletePublication = (id: number) => {
    setPublications((prev) => prev.filter((p) => p.id !== id))
  }

  const handleSuivre = async (id: number) => {
    try {
      await etudiantApi.suivre(id)
      setSuggestions((prev) => prev.filter((e) => e.id !== id))
      toast.success('Abonnement effectué')
    } catch (error) {
      toast.error('Erreur lors de l\'abonnement')
    }
  }

  const publicationCountLabel = useMemo(() => {
    if (publications.length === 0) {
      return 'Aucune publication chargée'
    }

    return `${publications.length} publication${publications.length > 1 ? 's' : ''} visible${publications.length > 1 ? 's' : ''}`
  }, [publications.length])

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <section className="rounded-[2rem] border border-border/80 bg-card/88 p-6 shadow-[0_20px_60px_-48px_rgba(27,31,36,0.45)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Fil d’actualité
              </p>
              <h1 className="max-w-3xl text-5xl text-foreground">
                Une vue continue de votre réseau, sans rupture de navigation.
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Le feed fusionne vos publications et celles des étudiants suivis. Les nouvelles
                entrées sont revalidées en arrière-plan pour éviter le rafraîchissement manuel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-border/80 bg-background/80 px-4 py-2 text-sm text-muted-foreground">
                {publicationCountLabel}
              </div>
              <div className="rounded-full border border-border/80 bg-background/80 px-4 py-2 text-sm text-muted-foreground">
                {lastRefreshAt ? `Synchronisé à ${lastRefreshAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Synchronisation en cours'}
              </div>
            </div>
          </div>
        </section>

        <CreatePost onCreated={handleNewPublication} />

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <SkeletonPublicationCard key={index} />
            ))}
          </div>
        ) : publications.length === 0 ? (
          <Card className="rounded-[1.75rem] border-dashed border-border/80 bg-card/80">
            <CardContent className="flex min-h-[340px] flex-col items-center justify-center text-center">
              <TrendingUp className="mb-5 size-12 text-muted-foreground/45" />
              <h3 className="text-xl font-semibold text-foreground">Le fil est encore vide</h3>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                Suivez d’autres étudiants ou publiez votre première information pour lancer la dynamique.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {publications.map((publication) => (
              <PublicationCard
                key={publication.id}
                publication={publication}
                onUpdate={handleUpdatePublication}
                onDelete={handleDeletePublication}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  onClick={() => void loadFeed(page + 1)}
                  disabled={loadingMore}
                  variant="outline"
                  className="rounded-full px-5"
                >
                  {loadingMore && <Loader2 className="size-4 animate-spin" />}
                  {loadingMore ? 'Chargement' : 'Charger la suite'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <Card className="rounded-[1.75rem] border-border/80 bg-card/92 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Avatar size="default">{getInitials(user?.nom, user?.prenom)}</Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">{fullName(user?.nom, user?.prenom)}</p>
                <p className="text-sm text-muted-foreground">{user?.etablissement || 'Votre espace étudiant'}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-muted/70 px-3 py-3 text-center">
                <p className="text-lg font-semibold text-foreground">{user?.nbAbonnements ?? 0}</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Suivis</p>
              </div>
              <div className="rounded-2xl bg-muted/70 px-3 py-3 text-center">
                <p className="text-lg font-semibold text-foreground">{user?.nbAbonnes ?? 0}</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Audience</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/80 bg-card/92 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h2 className="text-xl text-foreground">Suggestions</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Rechercher des profils pertinents et enrichir votre réseau.
            </p>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nom, prénom, établissement"
                className="pl-9"
              />
            </div>

            <div className="mt-4 space-y-3">
              {suggestionsLoading ? (
                [...Array(4)].map((_, index) => <SkeletonUserCard key={index} />)
              ) : suggestions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
                  Aucun profil ne correspond à votre recherche actuelle.
                </div>
              ) : (
                suggestions.map((etudiant) => (
                  <div
                    key={etudiant.id}
                    className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Link to={`/profil/${etudiant.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar size="sm">{getInitials(etudiant.nom, etudiant.prenom)}</Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {fullName(etudiant.nom, etudiant.prenom)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {etudiant.etablissement || 'Établissement non renseigné'}
                          </p>
                        </div>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => void handleSuivre(etudiant.id)}
                        className="rounded-full"
                      >
                        <UserPlus className="size-4" />
                        Suivre
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
