import { useState } from 'react'
import { ImagePlus, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

import { publicationApi } from '@/api'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import type { Publication, Visibility } from '@/types/domain'

interface CreatePostProps {
  onCreated: (publication: Publication) => void
}

export default function CreatePost({ onCreated }: CreatePostProps) {
  const [texte, setTexte] = useState('')
  const [urlImage, setUrlImage] = useState('')
  const [visibilite, setVisibilite] = useState<Visibility>('PUBLIC')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!texte.trim()) {
      toast.error('Veuillez écrire quelque chose')
      return
    }

    setLoading(true)
    try {
      const { data } = await publicationApi.creer({
        texte,
        urlImage: urlImage || null,
        visibilite,
      })
      onCreated(data)
      setTexte('')
      setUrlImage('')
      setVisibilite('PUBLIC')
      toast.success('Publication créée')
    } catch (error) {
      toast.error('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-border/80 bg-card/92 p-5 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Nouvelle publication</p>
            <p className="text-sm text-muted-foreground">
              Ajoutez une information, une question ou une ressource à votre réseau.
            </p>
          </div>

          <div className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            Publication instantanée
          </div>
        </div>

        <Textarea
          placeholder="Partagez une actualité de cours, une opportunité ou une question précise."
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          rows={4}
          className="min-h-[120px] bg-background/70"
        />

        <div className="grid gap-4 md:grid-cols-[1fr_180px_160px]">
          <div className="space-y-2">
            <label htmlFor="image-url" className="text-sm font-medium text-foreground">
              Image distante
            </label>
            <div className="relative">
              <ImagePlus className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="image-url"
                type="url"
                placeholder="https://..."
                value={urlImage}
                onChange={(e) => setUrlImage(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="visibilite" className="text-sm font-medium text-foreground">
              Visibilité
            </label>
            <select
              id="visibilite"
              value={visibilite}
              onChange={(e) => setVisibilite(e.target.value as Visibility)}
              className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVE">Privé</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleSubmit}
              disabled={loading || !texte.trim()}
              className="h-10 w-full gap-2 rounded-full"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Publication
                </>
              ) : (
                <>
                  Publier
                  <Send className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
