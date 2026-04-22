import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Search,
  Send,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { toast } from 'sonner'

import { etudiantApi, messageApi } from '@/api'
import { Avatar } from '@/app/components/ui/avatar'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { SkeletonUserCard } from '@/app/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useMessageWebSocket } from '@/hooks/useMessageWebSocket'
import { formatDateTime, formatTimeAgo, fullName, getInitials } from '@/lib/formatters'
import type { Message, Student } from '@/types/domain'

interface ConversationSummary {
  contact: Student
  lastMessage: Message | null
  unreadCount: number
}

function getLastMessagePreview(message: Message | null) {
  if (!message) {
    return 'Aucun message'
  }

  if (message.type === 'IMAGE') {
    return 'Image'
  }

  if (message.type === 'VOCAL') {
    return 'Message vocal'
  }

  return message.texte || 'Message'
}

export default function MessagesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { contactId } = useParams<{ contactId?: string }>()
  const activeContactId = contactId ? Number(contactId) : null
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const typingTimeoutRef = useRef<number | null>(null)
  const lastTypingSignalRef = useRef(0)

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [activeContact, setActiveContact] = useState<Student | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Student[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [typingIndicator, setTypingIndicator] = useState<string | null>(null)
  const deferredSearch = useDeferredValue(search.trim())

  const loadConversations = async () => {
    if (!user) {
      return
    }

    setConversationsLoading(true)

    try {
      const { data: contactIds } = await messageApi.getContacts()
      const uniqueIds = Array.from(new Set(contactIds))

      const summaries = await Promise.all(
        uniqueIds.map(async (id) => {
          const [{ data: profile }, { data: conversation }] = await Promise.all([
            etudiantApi.getProfil(id),
            messageApi.getConversation(id),
          ])

          const lastMessage = conversation.at(-1) ?? null
          const unreadCount = conversation.filter(
            (message) => message.destinataire.id === user.id && !message.lu,
          ).length

          return {
            contact: profile,
            lastMessage,
            unreadCount,
          } satisfies ConversationSummary
        }),
      )

      summaries.sort((left, right) => {
        const leftDate = left.lastMessage ? new Date(left.lastMessage.dateEnvoi).getTime() : 0
        const rightDate = right.lastMessage ? new Date(right.lastMessage.dateEnvoi).getTime() : 0
        return rightDate - leftDate
      })

      setConversations(summaries)
    } catch (error) {
      toast.error('Impossible de charger les conversations')
    } finally {
      setConversationsLoading(false)
    }
  }

  useEffect(() => {
    void loadConversations()
  }, [user?.id])

  const loadConversation = async (selectedContactId: number) => {
    setMessagesLoading(true)

    try {
      const [{ data: profile }, { data: conversation }] = await Promise.all([
        etudiantApi.getProfil(selectedContactId),
        messageApi.getConversation(selectedContactId),
      ])

      setActiveContact(profile)
      setMessages(conversation)

      void messageApi.marquerLus(selectedContactId)

      setConversations((current) =>
        current
          .map((conversationSummary) =>
            conversationSummary.contact.id === selectedContactId
              ? {
                  ...conversationSummary,
                  unreadCount: 0,
                  lastMessage: conversation.at(-1) ?? conversationSummary.lastMessage,
                }
              : conversationSummary,
          )
          .sort((left, right) => {
            const leftDate = left.lastMessage ? new Date(left.lastMessage.dateEnvoi).getTime() : 0
            const rightDate = right.lastMessage ? new Date(right.lastMessage.dateEnvoi).getTime() : 0
            return rightDate - leftDate
          }),
      )
    } catch (error) {
      toast.error('Impossible de charger la conversation')
    } finally {
      setMessagesLoading(false)
    }
  }

  useEffect(() => {
    if (activeContactId) {
      void loadConversation(activeContactId)
      return
    }

    setActiveContact(null)
    setMessages([])
  }, [activeContactId])

  useEffect(() => {
    if (!activeContactId && conversations.length > 0) {
      navigate(`/messages/${conversations[0].contact.id}`, { replace: true })
    }
  }, [activeContactId, conversations, navigate])

  useEffect(() => {
    if (!deferredSearch) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    setSearchLoading(true)

    const loadSearch = async () => {
      try {
        const { data } = await etudiantApi.search(deferredSearch)
        setSearchResults(data.filter((candidate) => candidate.id !== user?.id).slice(0, 6))
      } catch (error) {
        console.error('Impossible de rechercher des profils', error)
      } finally {
        setSearchLoading(false)
      }
    }

    void loadSearch()
  }, [deferredSearch, user?.id])

  const refreshActiveConversation = async () => {
    if (!activeContactId) {
      return
    }

    await loadConversation(activeContactId)
  }

  const { isConnected, status, send } = useMessageWebSocket({
    enabled: Boolean(user),
    onEvent: (event) => {
      if (event.type === 'MESSAGE') {
        void loadConversations()

        if (event.from && activeContact?.email === event.from) {
          void refreshActiveConversation()
          setTypingIndicator(null)
        }
      }

      if (event.type === 'TYPING' && event.from && activeContact?.email === event.from) {
        setTypingIndicator(event.from)

        if (typingTimeoutRef.current) {
          window.clearTimeout(typingTimeoutRef.current)
        }

        typingTimeoutRef.current = window.setTimeout(() => {
          setTypingIndicator(null)
        }, 1400)
      }
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleOpenConversation = (contact: Student) => {
    navigate(`/messages/${contact.id}`)
    setSearch('')
    setSearchResults([])
  }

  const activeConversationSummary = useMemo(
    () => conversations.find((conversation) => conversation.contact.id === activeContactId) ?? null,
    [activeContactId, conversations],
  )

  const handleInputChange = (value: string) => {
    setMessageInput(value)

    if (!activeContact || !isConnected) {
      return
    }

    const now = Date.now()

    if (now - lastTypingSignalRef.current > 1200 && value.trim()) {
      lastTypingSignalRef.current = now
      send({
        type: 'TYPING',
        targetEmail: activeContact.email,
      })
    }
  }

  const handleSendMessage = async () => {
    if (!activeContact || !messageInput.trim()) {
      return
    }

    const draft = messageInput.trim()
    setSending(true)

    try {
      const { data } = await messageApi.envoyer({
        destinataireId: activeContact.id,
        texte: draft,
        type: 'TEXTE',
      })

      setMessages((current) => [...current, data])
      setMessageInput('')
      setTypingIndicator(null)
      setConversations((current) => {
        const existing = current.find((conversation) => conversation.contact.id === activeContact.id)
        const updatedConversation: ConversationSummary = {
          contact: activeContact,
          lastMessage: data,
          unreadCount: 0,
        }

        const next = existing
          ? current.map((conversation) =>
              conversation.contact.id === activeContact.id ? updatedConversation : conversation,
            )
          : [updatedConversation, ...current]

        return next.sort((left, right) => {
          const leftDate = left.lastMessage ? new Date(left.lastMessage.dateEnvoi).getTime() : 0
          const rightDate = right.lastMessage ? new Date(right.lastMessage.dateEnvoi).getTime() : 0
          return rightDate - leftDate
        })
      })

      send({
        type: 'MESSAGE',
        targetEmail: activeContact.email,
        data: {
          messageId: data.id,
        },
      })
    } catch (error) {
      toast.error('Impossible d’envoyer le message')
    } finally {
      setSending(false)
    }
  }

  const showConversation = Boolean(activeContactId)

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className={`${showConversation ? 'hidden lg:block' : 'block'} space-y-4`}>
        <section className="rounded-[1.9rem] border border-border/80 bg-card/92 p-5 shadow-[0_18px_60px_-48px_rgba(27,31,36,0.45)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Messagerie</p>
              <h1 className="mt-2 text-4xl text-foreground">Conversations directes</h1>
            </div>
            <div className="rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">
              {isConnected ? (
                <span className="inline-flex items-center gap-2">
                  <Wifi className="size-3.5 text-primary" />
                  Temps réel actif
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <WifiOff className="size-3.5 text-destructive" />
                  {status === 'reconnecting' ? 'Reconnexion' : 'Hors ligne'}
                </span>
              )}
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un étudiant"
              className="pl-9"
            />
          </div>

          {search && (
            <div className="mt-4 space-y-2">
              {searchLoading ? (
                [...Array(2)].map((_, index) => <SkeletonUserCard key={index} />)
              ) : searchResults.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
                  Aucun profil trouvé.
                </div>
              ) : (
                searchResults.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleOpenConversation(profile)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-left transition hover:bg-accent/40"
                  >
                    <Avatar size="sm">{getInitials(profile.nom, profile.prenom)}</Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {fullName(profile.nom, profile.prenom)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {profile.etablissement || 'Établissement non renseigné'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </section>

        <Card className="rounded-[1.9rem] border-border/80 bg-card/92 shadow-sm">
          <CardContent className="p-3">
            <div className="space-y-2">
              {conversationsLoading ? (
                [...Array(4)].map((_, index) => <SkeletonUserCard key={index} />)
              ) : conversations.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-border bg-muted/35 px-5 text-center">
                  <MessageCircle className="mb-3 size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Aucune conversation pour le moment. Recherchez un étudiant pour démarrer.
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const isActive = conversation.contact.id === activeContactId

                  return (
                    <button
                      key={conversation.contact.id}
                      type="button"
                      onClick={() => handleOpenConversation(conversation.contact)}
                      className={`flex w-full items-center gap-3 rounded-[1.35rem] px-4 py-3 text-left transition ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-[0_18px_40px_-28px_rgba(16,115,105,0.7)]'
                          : 'hover:bg-muted/60'
                      }`}
                    >
                      <Avatar
                        size="sm"
                        className={isActive ? 'bg-white/15 text-primary-foreground' : undefined}
                      >
                        {getInitials(conversation.contact.nom, conversation.contact.prenom)}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold">
                            {fullName(conversation.contact.nom, conversation.contact.prenom)}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span
                              className={`inline-flex min-w-5 justify-center rounded-full px-1.5 py-0 text-[10px] ${
                                isActive ? 'bg-white/20 text-primary-foreground' : 'bg-destructive text-white'
                              }`}
                            >
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p
                          className={`truncate text-xs ${
                            isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          }`}
                        >
                          {getLastMessagePreview(conversation.lastMessage)}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </aside>

      <section className={`${showConversation ? 'block' : 'hidden lg:block'} min-w-0`}>
        {activeContact ? (
          <Card className="flex min-h-[72vh] flex-col rounded-[2rem] border-border/80 bg-card/92 shadow-[0_18px_60px_-48px_rgba(27,31,36,0.45)]">
            <div className="flex items-center justify-between gap-4 border-b border-border/70 px-5 py-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full lg:hidden"
                  onClick={() => navigate('/messages')}
                >
                  <ArrowLeft className="size-4" />
                </Button>

                <Avatar size="default">{getInitials(activeContact.nom, activeContact.prenom)}</Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {fullName(activeContact.nom, activeContact.prenom)}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {activeContact.etablissement || 'Étudiant'}
                  </p>
                  {typingIndicator && (
                    <p className="mt-1 text-xs text-primary">En train d’écrire…</p>
                  )}
                </div>
              </div>

              <div className="rounded-full border border-border/80 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
                {activeConversationSummary?.lastMessage
                  ? `Dernier échange ${formatTimeAgo(activeConversationSummary.lastMessage.dateEnvoi)}`
                  : 'Nouvelle conversation'}
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {messagesLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Chargement de la conversation
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <MessageCircle className="mb-3 size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Aucun message pour le moment. Lancez la conversation.
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.expediteur.id === user?.id

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[min(80%,42rem)] rounded-[1.45rem] px-4 py-3 shadow-sm ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border/70 bg-background/80 text-foreground'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {message.texte || getLastMessagePreview(message)}
                        </p>
                        <p
                          className={`mt-2 text-[11px] ${
                            isOwnMessage ? 'text-primary-foreground/75' : 'text-muted-foreground'
                          }`}
                          title={formatDateTime(message.dateEnvoi)}
                        >
                          {formatTimeAgo(message.dateEnvoi)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border/70 px-5 py-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Écrire un message"
                  value={messageInput}
                  onChange={(event) => handleInputChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void handleSendMessage()
                    }
                  }}
                  disabled={sending}
                />
                <Button
                  onClick={() => void handleSendMessage()}
                  disabled={sending || !messageInput.trim()}
                  className="rounded-full"
                >
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex min-h-[72vh] items-center justify-center rounded-[2rem] border-dashed border-border/80 bg-card/80">
            <CardContent className="text-center">
              <MessageCircle className="mx-auto mb-4 size-10 text-muted-foreground/45" />
              <h2 className="text-2xl text-foreground">Choisissez une conversation</h2>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                Ouvrez un échange existant ou recherchez un étudiant pour démarrer une nouvelle discussion.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
