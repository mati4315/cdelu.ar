# Imagen de producción mínima para Fastify
FROM node:20-alpine

WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias (producción)
RUN npm ci --only=production

# Copiar código
COPY . .

# Exponer puerto
EXPOSE 3001

# Variables por defecto
ENV NODE_ENV=production

# Comando de inicio
CMD ["node", "src/index.js"]


