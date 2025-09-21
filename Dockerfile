# Usa la versión recomendada de Playwright
FROM mcr.microsoft.com/playwright:v1.55.0-jammy

# Establece el directorio de trabajo
WORKDIR /app

# Copia solo package.json primero (mejor para cache de dependencias)
COPY package.json package-lock.json* ./

# Instala dependencias (sin volver a instalar playwright, ya está incluido en la imagen)
RUN npm install --omit=dev

# Copia el resto de tu código
COPY . .

# Render expone PORT automáticamente
EXPOSE 3000

# Arranca la app
CMD ["npm", "start"]
