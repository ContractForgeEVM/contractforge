# Utiliser Node.js pour servir l'application
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier les fichiers buildés
COPY dist/ ./dist/

# Installer un serveur HTTP simple
RUN npm install -g serve

# Exposer le port 5173
EXPOSE 5173

# Commande pour servir l'application
CMD ["serve", "-s", "dist", "-l", "5173"] 