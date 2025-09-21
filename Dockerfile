# Usa imagen oficial de Playwright que ya trae Chromium instalado
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

# Directorio de trabajo
WORKDIR /app

# Copia package.json e instala dependencias
COPY package*.json ./
RUN npm install

# Copia el resto del código
COPY . .

# Puerto
ENV PORT=3000
EXPOSE 3000

# Comando de arranque
CMD ["node", "proxy-playwright.js"]
