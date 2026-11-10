# ==============================================================================
# Etapa 1: Build de React + Vite
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Variables en tiempo de compilación
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ==============================================================================
# Etapa 2: Servidor web con Nginx
# ==============================================================================
FROM nginx:stable-alpine AS production

# Copiar la plantilla de Nginx (Nginx sustituye automáticamente ${PORT} al iniciar)
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Copiar los archivos estáticos generados por Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Puerto por defecto si se prueba localmente
ENV PORT=80

CMD ["nginx", "-g", "daemon off;"]