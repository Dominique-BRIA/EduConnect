import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export function formatTimeAgo(date: string | Date | null | undefined): string {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
}

export function getInitials(nom?: string, prenom?: string): string {
  return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase()
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return ''

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function formatShortCount(value: number): string {
  if (value < 1000) {
    return `${value}`
  }

  return new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function fullName(nom?: string | null, prenom?: string | null): string {
  return [prenom, nom].filter(Boolean).join(' ')
}
