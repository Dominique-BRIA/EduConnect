export type Visibility = 'PUBLIC' | 'PRIVE'
export type MessageType = 'TEXTE' | 'IMAGE' | 'VOCAL'
export type LiveStatus = 'EN_ATTENTE' | 'ACTIF' | 'TERMINE'

export interface Student {
  id: number
  nom: string
  prenom: string
  email: string
  etablissement: string | null
  dateNaissance: string | null
  pays: string | null
  hobby: string | null
  role: string
  nbAbonnements: number
  nbAbonnes: number
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType?: string
  etudiant: Student
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface Publication {
  id: number
  texte: string
  urlImage: string | null
  likes: number
  resolu: boolean
  datePublication: string
  visibilite: Visibility
  auteur: Student
  nbCommentaires: number
  likedByMe: boolean
}

export interface Commentaire {
  id: number
  idParent: number | null
  texte: string | null
  urlImage: string | null
  urlVoice: string | null
  dateCreation: string
  auteur: Student
}

export interface Message {
  id: number
  texte: string | null
  urlImage: string | null
  urlVoice: string | null
  lu: boolean
  dateEnvoi: string
  type: MessageType
  expediteur: Student
  destinataire: Student
}

export interface Notification {
  id: number
  type: string
  contenu: string
  lue: boolean
  date: string
  refId: number | null
  refType: string | null
}

export interface Live {
  id: number
  titre: string
  urlFlux: string | null
  statut: LiveStatus
  dateDebut: string | null
  dateFin: string | null
  pageActuelle: number
  nombrePages: number
  createur: Student
  participants: Student[]
  intervenants: Student[]
  publicationId: number | null
}

export interface LivePage {
  id: number
  numero: number
  contenuJson: string | null
  dateCreation: string
  dateDerniereSave: string | null
}

export interface LoginPayload {
  email: string
  motDePasse: string
}

export interface RegisterPayload {
  nom: string
  prenom: string
  email: string
  motDePasse: string
  etablissement?: string | null
  dateNaissance?: string | null
  pays?: string | null
  hobby?: string | null
}

export interface PublicationPayload {
  texte: string
  urlImage?: string | null
  visibilite: Visibility
}

export interface CommentPayload {
  texte: string
  idParent?: number | null
  urlImage?: string | null
  urlVoice?: string | null
}

export interface MessagePayload {
  destinataireId: number
  texte?: string | null
  urlImage?: string | null
  urlVoice?: string | null
  type?: MessageType
}

export interface LivePayload {
  titre: string
  publicationId?: number | null
}
