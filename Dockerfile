# ==============================================================================
# Etapa 1: Build de React + Vite
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Argumento recibido durante el build en Railway
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ==============================================================================
# Etapa 2: Servidor web con Nginx
# ==============================================================================
FROM nginx:stable-alpine AS production

# Creamos una plantilla de Nginx que lee dinámicamente la variable $PORT de Railway
RUN printf 'server {\n\
    listen ${PORT};\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;\n\
    gzip_min_length 1024;\n\
\n\
    location / {\n\
        try_files $$uri $$uri/ /index.html;\n\
    }\n\
\n\
    location ~* \\.(?:js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp)$ {\n\
        expires 30d;\n\
        add_header Cache-Control "public, immutable";\n\
        try_files $$uri =404;\n\
    }\n\
}\n' > /etc/nginx/templates/default.conf.template

# Copiar el build compilado
COPY --from=builder /app/dist /usr/share/nginx/html

# Railway asigna PORT automáticamente, definimos 80 como valor por defecto local
ENV PORT=80

CMD ["nginx", "-g", "daemon off;"]