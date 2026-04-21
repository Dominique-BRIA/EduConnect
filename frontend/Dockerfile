# ── Stage 1 : Build React ────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copier package.json en premier pour profiter du cache
COPY package.json package-lock.json* ./
RUN npm ci --silent

# Copier les sources et builder
COPY public ./public
COPY src ./src
RUN npm run build

# ── Stage 2 : Serveur Nginx ──────────────────────────────────────────────────
FROM nginx:1.25-alpine

# Supprimer la config Nginx par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Notre config personnalisée
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copier le build React
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
