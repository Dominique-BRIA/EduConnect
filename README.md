# EduConnect — Plateforme collaborative étudiante

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Spring Boot 3.2, Spring Security, Spring Data JPA |
| Auth | JWT (access 15min) + Refresh Token (7 jours, rotation) |
| Temps réel | WebSocket natif (tableau blanc + messagerie) |
| Voix live | WebRTC P2P avec signaling via WebSocket |
| Base de données | MySQL 8 |
| Frontend | React 18, React Router v6, Axios |
| CSS | CSS Modules |

---

## Prérequis

- Java 17+
- Maven 3.8+
- MySQL 8
- Node.js 18+

---

## Lancement rapide

### 1. Base de données

```sql
CREATE DATABASE hackaton_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Modifiez `backend/src/main/resources/application.yml` si besoin :
```yaml
spring:
  datasource:
    username: root
    password: root   # ← votre mot de passe MySQL
```

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

Le serveur démarre sur **http://localhost:8080**

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

L'application s'ouvre sur **http://localhost:3000**

---

## Architecture des endpoints REST

### Auth
| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion → access + refresh token |
| POST | `/api/auth/refresh` | Renouveler l'access token |
| POST | `/api/auth/logout` | Révoquer le refresh token |

### Étudiants
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/etudiants/me` | Mon profil |
| GET | `/api/etudiants/{id}` | Profil d'un étudiant |
| GET | `/api/etudiants/search?q=...` | Recherche |
| POST | `/api/etudiants/{id}/suivre` | S'abonner |
| DELETE | `/api/etudiants/{id}/suivre` | Se désabonner |

### Publications
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/publications/fil` | Fil d'actualité (paginé) |
| POST | `/api/publications` | Créer |
| PUT | `/api/publications/{id}` | Modifier |
| DELETE | `/api/publications/{id}` | Supprimer |
| PATCH | `/api/publications/{id}/resolu` | Marquer résolu |
| POST | `/api/publications/{id}/liker` | Liker/unliker |
| GET | `/api/publications/{id}/commentaires` | Commentaires |
| POST | `/api/publications/{id}/commentaires` | Commenter |

### Messages
| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/messages` | Envoyer |
| GET | `/api/messages/conversation/{contactId}` | Conversation |
| GET | `/api/messages/contacts` | Liste des contacts |

### Lives
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/lives` | Lives actifs |
| POST | `/api/lives` | Créer un live |
| POST | `/api/lives/{id}/demarrer` | Démarrer |
| POST | `/api/lives/{id}/arreter` | Arrêter |
| POST | `/api/lives/{id}/rejoindre` | Rejoindre |
| POST | `/api/lives/{id}/quitter` | Quitter |
| POST | `/api/lives/{id}/main/{intervenantId}` | Donner la main |
| DELETE | `/api/lives/{id}/main/{intervenantId}` | Retirer la main |
| GET | `/api/lives/{id}/pages` | Pages du tableau blanc |
| POST | `/api/lives/{id}/pages` | Nouvelle page |
| PUT | `/api/lives/{id}/pages/{num}` | Sauvegarder une page |
| PATCH | `/api/lives/{id}/pages/{num}/active` | Changer de page active |

---

## WebSocket — protocole

### Live (`ws://localhost:8080/ws/live/{liveId}`)

**Authentification (premier message obligatoire) :**
```json
{ "type": "AUTH", "token": "<jwt>", "liveId": 1, "etudiantId": 42 }
```

**Messages émis → reçus par tous :**

| type | Champs | Rôle requis |
|------|--------|-------------|
| `DRAW` | `page`, `stroke` | Intervenant |
| `CLEAR_PAGE` | `page` | Intervenant |
| `NEW_PAGE` | `pageNum` | Intervenant |
| `CHANGE_PAGE` | `pageNum` | Intervenant |
| `GIVE_HAND` | `targetId` | Créateur |
| `REMOVE_HAND` | `targetId` | Créateur |
| `WEBRTC_OFFER` | `targetId`, `sdp` | Intervenant |
| `WEBRTC_ANSWER` | `targetId`, `sdp` | — |
| `WEBRTC_ICE` | `targetId`, `candidate` | — |

**Structure d'un `stroke` :**
```json
{
  "points": [{"x": 100, "y": 200}, {"x": 105, "y": 210}],
  "color": "#4F46E5",
  "size": 4,
  "eraser": false
}
```

### Messages privés (`ws://localhost:8080/ws/messages`)

```json
{ "type": "AUTH", "token": "<jwt>" }
{ "type": "MESSAGE", "targetEmail": "contact@email.com", "data": { ... } }
{ "type": "TYPING", "targetEmail": "contact@email.com" }
```

---

## Système de refresh token

```
Login
  └─→ access_token (15 min, JWT stateless)
  └─→ refresh_token (7 jours, UUID en base)

Requête avec access_token expiré
  └─→ 401 intercepté par Axios
  └─→ POST /api/auth/refresh { refreshToken }
      ├─→ Nouveau access_token
      ├─→ Nouveau refresh_token (rotation)
      └─→ Retry de la requête originale

Logout
  └─→ Suppression du refresh_token en base
```

---

## Fonctionnement du live

1. Le créateur crée et démarre le live → page blanche vide créée en base
2. Les participants rejoignent → connexion WebSocket automatique
3. Le créateur donne la main à des intervenants (plusieurs possibles)
4. **Seuls les intervenants** peuvent dessiner sur le canvas et activer leur micro
5. Les traits sont envoyés en temps réel via WebSocket à tous les participants
6. Un intervenant peut créer une nouvelle page (miniature visible dans le panneau gauche, comme Word)
7. La page active change pour TOUS les participants simultanément
8. La voix fonctionne en P2P WebRTC (signaling via WebSocket) — sans serveur TURN

---

## Structure du projet

```
projet/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/hackaton/
│       ├── config/          # Security, WebSocket, Application
│       ├── controller/      # Auth, Etudiant, Publication, Message, Live, Notification
│       ├── dto/             # Request / Response DTOs
│       ├── entity/          # JPA entities
│       ├── enums/           # Role, Visibilite, LiveStatut, MessageType
│       ├── exception/       # GlobalExceptionHandler
│       ├── repository/      # Spring Data repositories
│       ├── security/        # JwtService, JwtAuthenticationFilter
│       ├── service/         # Business logic
│       └── websocket/       # LiveWebSocketHandler, MessageWebSocketHandler
└── frontend/
    ├── package.json
    └── src/
        ├── api/             # Axios instance + refresh interceptor + tous les appels API
        ├── components/
        │   ├── feed/        # PublicationCard, CreatePost, Commentaires
        │   └── layout/      # Layout, sidebar navigation
        ├── context/         # AuthContext
        ├── hooks/           # useAuth, useLiveWebSocket, useMessageWebSocket
        └── pages/           # Feed, Login, Register, Profile, Messages, Lives, LiveRoom, Notifications
```

---

## Variables d'environnement (optionnel)

Créer `backend/src/main/resources/application-prod.yml` :
```yaml
app:
  jwt:
    secret: VOTRE_SECRET_256_BITS_MINIMUM
    expiration: 900000
    refresh-expiration: 604800000
spring:
  datasource:
    url: jdbc:mysql://prod-host:3306/hackaton_db
    username: ${DB_USER}
    password: ${DB_PASS}
```

Lancer avec : `mvn spring-boot:run -Dspring-boot.run.profiles=prod`
