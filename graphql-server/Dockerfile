# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Instalar dependencias necesarias para node-gyp o compilaciones nativas si fuera necesario
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runtime

WORKDIR /app

# Copiar solo lo necesario para ejecución
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/scripts ./scripts

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Exponer puerto de Apollo Server
EXPOSE 4000

# Metadata de la imagen
LABEL maintainer="SEP - EIA"
LABEL project="Evaluación Diagnóstica"

CMD ["npm", "start"]
