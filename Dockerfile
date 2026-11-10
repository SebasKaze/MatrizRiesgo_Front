# ==============================================================================
# Etapa 1: Construcción (Build) de la aplicación React + Vite
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar manifiestos de dependencias para aprovechar la caché de capas de Docker
COPY package.json package-lock.json* ./

# Instalar dependencias de manera limpia y reproducible
RUN npm ci

# Copiar el código fuente del proyecto
COPY . .

# Variable de entorno en tiempo de compilación para apuntar al backend API
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=${VITE_API_URL}

# Compilar la aplicación para producción en /app/dist
RUN npm run build

# ==============================================================================
# Etapa 2: Servidor de producción con Nginx
# ==============================================================================
FROM nginx:stable-alpine AS production

# Configuración de Nginx con soporte para rutas SPA (React), proxy reverso al backend y compresión gzip
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    resolver 127.0.0.11 valid=30s ipv6=off;\n\
\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;\n\
    gzip_min_length 1024;\n\
\n\
    location /api/ {\n\
        set $backend_upstream http://backend:4000;\n\
        proxy_pass $backend_upstream;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
    }\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    location ~* \\.(?:js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp)$ {\n\
        expires 30d;\n\
        add_header Cache-Control "public, immutable";\n\
        try_files $uri =404;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

# Copiar los artefactos compilados desde la etapa builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
