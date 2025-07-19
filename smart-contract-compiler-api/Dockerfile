# Utiliser Ubuntu pour avoir Foundry
FROM ubuntu:22.04

# Variables d'environnement
ENV NODE_VERSION=18
ENV DEBIAN_FRONTEND=noninteractive

# Installer les dépendances système et shell
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    bash \
    coreutils \
    findutils \
    grep \
    sed \
    tar \
    gzip \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Créer le lien symbolique pour /bin/sh si nécessaire
RUN ln -sf /bin/bash /bin/sh

# Installer Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Installer Foundry
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="/root/.foundry/bin:$PATH"
RUN /bin/bash -c "source ~/.bashrc && foundryup"

# Vérifier que forge est accessible
RUN which forge && forge --version

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer toutes les dépendances (dev incluses pour build)
RUN npm ci

# Copier le code source
COPY . .

# Construire le projet TypeScript
RUN npm run build

# Nettoyer les devDependencies après build
RUN npm prune --production

# Exposer le port 3004
EXPOSE 3004

# Définir les variables d'environnement
ENV NODE_ENV=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

# Commande pour démarrer l'application
CMD ["node", "dist/index.js"] 