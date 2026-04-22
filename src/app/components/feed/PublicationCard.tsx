import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Globe2,
  Heart,
  Loader2,
  Lock,
  MessageSquare,
  PencilLine,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { publicationApi } from '@/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog'
import { Avatar } from '@/app/components/ui/avatar'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Textarea } from '@/app/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { formatDateTime, formatShortCount, formatTimeAgo, fullName, getInitials } from '@/lib/formatters'
import type { Commentaire, Publication } from '@/types/domain'

interface PublicationCardProps {
  publication: Publication
  onUpdate: (pub: Publication) => void
  onDelete: (id: number) => void
}

export default function PublicationCard({
  publication,
  onUpdate,
  onDelete,
}: PublicationCardProps) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(publication.texte)
  const [submitting, setSubmitting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Commentaire[] | null>(null)
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentPending, setCommentPending] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)

  const isOwner = user?.id === publication.auteur.id
  const initials = getInitials(publication.auteur?.nom, publication.auteur?.prenom)
  const timeAgo = formatTimeAgo(publication.datePublication)

  const syncCommentCount = (nextCount: number) => {
    onUpdate({
      ...publication,
      nbCommentaires: nextCount,
    })
  }

  const loadComments = async () => {
    if (loadingComments) {
      return
    }

    setLoadingComments(true)
    try {
      const { data } = await publicationApi.getCommentaires(publication.id)
      setComments(data)
      syncCommentCount(data.length)
    } catch (error) {
      toast.error('Impossible de charger les commentaires')
    } finally {
      setLoadingComments(false)
    }
  }

  const handleToggleComments = async () => {
    setShowComments((previous) => !previous)

    if (!showComments && comments === null) {
      await loadComments()
    }
  }

  const handleLike = async () => {
    try {
      const { data } = await publicationApi.liker(publication.id)
      onUpdate(data)
    } catch (error) {
      toast.error('Erreur lors du like')
    }
  }

  const handleDelete = async () => {
    try {
      await publicationApi.supprimer(publication.id)
      onDelete(publication.id)
      toast.success('Publication supprimée')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleEdit = async () => {
    setSubmitting(true)
    try {
      const { data } = await publicationApi.modifier(publication.id, {
        texte: editText,
        urlImage: publication.urlImage,
        visibilite: publication.visibilite,
      })
      onUpdate(data)
      setEditing(false)
      toast.success('Publication modifiée')
    } catch (error) {
      toast.error('Erreur lors de la modification')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkerResolu = async () => {
    try {
      const { data } = await publicationApi.marquerResolu(publication.id)
      onUpdate(data)
      toast.success('Marqué comme résolu')
    } catch (error) {
      toast.error('Erreur lors du marquage')
    }
  }

  const handleComment = async () => {
    if (!commentDraft.trim()) {
      return
    }

    setCommentPending(true)
    try {
      const { data } = await publicationApi.commenter(publication.id, { texte: commentDraft.trim() })
      setComments((previous) => [...(previous ?? []), data])
      setCommentDraft('')
      syncCommentCount((comments?.length ?? publication.nbCommentaires) + 1)
      toast.success('Commentaire ajouté')
    } catch (error) {
      toast.error('Impossible d’ajouter le commentaire')
    } finally {
      setCommentPending(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    setDeletingCommentId(commentId)
    try {
      await publicationApi.supprimerCommentaire(commentId)
      setComments((previous) => (previous ?? []).filter((comment) => comment.id !== commentId))
      syncCommentCount(Math.max(0, (comments?.length ?? publication.nbCommentaires) - 1))
      toast.success('Commentaire supprimé')
    } catch (error) {
      toast.error('Impossible de supprimer le commentaire')
    } finally {
      setDeletingCommentId(null)
    }
  }

  return (
    <article className="rounded-[1.75rem] border border-border/80 bg-card/92 p-5 shadow-[0_18px_60px_-48px_rgba(27,31,36,0.5)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_80px_-48px_rgba(27,31,36,0.45)]">
      <div className="flex items-start justify-between gap-4">
        <Link to={`/profil/${publication.auteur.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar size="default">{initials}</Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {fullName(publication.auteur.nom, publication.auteur.prenom)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {publication.auteur.etablissement || 'Campus non renseigné'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground" title={formatDateTime(publication.datePublication)}>
              {timeAgo}
            </p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {publication.resolu && (
            <Badge className="gap-1 rounded-full bg-accent text-accent-foreground">
              <CheckCircle2 className="size-3.5" />
              Résolu
            </Badge>
          )}
          <Badge variant="outline" className="gap-1 rounded-full border-border/80 bg-muted/70 text-muted-foreground">
            {publication.visibilite === 'PRIVE' ? <Lock className="size-3.5" /> : <Globe2 className="size-3.5" />}
            {publication.visibilite === 'PRIVE' ? 'Privé' : 'Public'}
          </Badge>
          {isOwner && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => setEditing((previous) => !previous)}
              >
                <PencilLine className="size-4" />
              </Button>

              {!publication.resolu && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  onClick={handleMarkerResolu}
                  title="Marquer résolu"
                >
                  <CheckCircle2 className="size-4" />
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer cette publication ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action retire définitivement la publication du fil d’actualité.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        {editing ? (
          <div className="space-y-3">
            <Textarea
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              rows={4}
              className="bg-background/70"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>
                Annuler
              </Button>
              <Button onClick={handleEdit} disabled={submitting || !editText.trim()}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Enregistrement
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-[15px] leading-7 text-foreground">{publication.texte}</p>
        )}
      </div>

      {publication.urlImage && (
        <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-border/70 bg-muted/30">
          <img
            src={publication.urlImage}
            alt="Illustration de publication"
            className="h-auto max-h-[420px] w-full object-cover"
          />
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button
            variant={publication.likedByMe ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleLike}
            className="rounded-full"
          >
            <Heart className={`size-4 ${publication.likedByMe ? 'fill-current' : ''}`} />
            {formatShortCount(publication.likes)}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void handleToggleComments()} className="rounded-full">
            <MessageSquare className="size-4" />
            {formatShortCount(publication.nbCommentaires)}
          </Button>
        </div>

        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Publication {publication.resolu ? 'traitée' : 'ouverte'}
        </p>
      </div>

      {showComments && (
        <div className="mt-4 rounded-[1.4rem] border border-border/70 bg-muted/40 p-4">
          <div className="space-y-3">
            {loadingComments ? (
              <div className="flex items-center gap-3 rounded-2xl bg-card/70 px-4 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Chargement des commentaires
              </div>
            ) : comments && comments.length > 0 ? (
              comments.map((comment) => {
                const isCommentOwner = user?.id === comment.auteur.id

                return (
                  <div
                    key={comment.id}
                    className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar size="sm">{getInitials(comment.auteur.nom, comment.auteur.prenom)}</Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {fullName(comment.auteur.nom, comment.auteur.prenom)}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatTimeAgo(comment.dateCreation)}</p>
                          </div>
                          {isCommentOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-full text-destructive"
                              onClick={() => void handleDeleteComment(comment.id)}
                              disabled={deletingCommentId === comment.id}
                            >
                              {deletingCommentId === comment.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                          {comment.texte}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                Aucun commentaire pour le moment.
              </div>
            )}

            <div className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4">
              <Textarea
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder="Ajouter une réponse utile à cette publication."
                rows={3}
                className="bg-background/70"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleComment}
                  disabled={commentPending || !commentDraft.trim()}
                  className="rounded-full"
                >
                  {commentPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Envoi
                    </>
                  ) : (
                    'Commenter'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
