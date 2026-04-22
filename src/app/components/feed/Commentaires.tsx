import { useState } from 'react'
import { publicationApi } from '@/api'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { formatTimeAgo, getInitials } from '@/lib/formatters'
import { Button } from '@/app/components/ui/button'
import { Textarea } from '@/app/components/ui/textarea'
import { Avatar } from '@/app/components/ui/avatar'
import { Trash2 } from 'lucide-react'

type Comment = any

interface CommentairesProps {
  publications: Comment[]
  publicationId: string
  onUpdate: () => void
}

export default function Commentaires({
  publications,
  publicationId,
  onUpdate,
}: CommentairesProps) {
  const { user } = useAuth()
  const [nouveau, setNouveau] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAjouter = async () => {
    if (!nouveau.trim()) return

    setLoading(true)
    try {
      await publicationApi.commenter(publicationId, { texte: nouveau })
      setNouveau('')
      onUpdate()
      toast.success('Commentaire ajouté')
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire')
    } finally {
      setLoading(false)
    }
  }

  const handleSupprimer = async (id: string) => {
    try {
      await publicationApi.supprimerCommentaire(id)
      onUpdate()
      toast.success('Commentaire supprimé')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <div className="bg-muted/50 rounded-lg p-3 mt-3 space-y-3">
      <div className="space-y-2">
        {publications?.map((comment) => {
          const isOwner = user?.id === comment.auteur?.id
          const initials = getInitials(comment.auteur?.nom, comment.auteur?.prenom)
          const timeAgo = formatTimeAgo(comment.date)

          return (
            <div key={comment.id} className="flex gap-2 p-2 bg-background rounded text-sm">
              <Avatar size="sm">{initials}</Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-xs">
                    {comment.auteur?.prenom} {comment.auteur?.nom}
                  </p>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleSupprimer(comment.id)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
                <p className="text-sm mt-1">{comment.texte}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 pt-2 border-t border-border">
        <Textarea
          placeholder="Ajouter un commentaire..."
          value={nouveau}
          onChange={(e) => setNouveau(e.target.value)}
          rows={2}
          className="text-sm resize-none"
        />
        <Button
          onClick={handleAjouter}
          disabled={loading || !nouveau.trim()}
          className="self-end"
          size="sm"
        >
          {loading ? 'Ajout...' : 'Ajouter'}
        </Button>
      </div>
    </div>
  )
}
