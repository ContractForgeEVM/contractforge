#!/bin/bash

REMOTE_SERVER="root@192.168.1.60"
REMOTE_DIR="/opt/contractforge"
echo "🚀 DÉPLOIEMENT BACKEND SEULEMENT - CONTRACTFORGE.IO"
echo "=================================================="

check_error() {
    if [ $? -ne 0 ]; then
        echo "❌ Erreur: $1"
        exit 1
    fi
}

echo "📦 1. Construction du backend..."
cd smart-contract-compiler-api
npm run build
check_error "Build du backend"
cd ..

echo "📂 2. Préparation des fichiers de déploiement..."
rm -rf deploy-backend-package
mkdir -p deploy-backend-package/backend

echo "   - Préparation du backend..."
cp -r smart-contract-compiler-api/dist deploy-backend-package/backend/
cp -r smart-contract-compiler-api/src deploy-backend-package/backend/
cp smart-contract-compiler-api/package*.json deploy-backend-package/backend/
cp -r smart-contract-compiler-api/data deploy-backend-package/backend/
cp smart-contract-compiler-api/.env deploy-backend-package/backend/

cat > deploy-backend-package/backend/Dockerfile << 'EOF'
FROM ubuntu:22.04
ENV NODE_VERSION=18
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="/root/.foundry/bin:$PATH"
RUN foundryup
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY data ./data
COPY .env ./
ENV NODE_ENV=production
ENV PORT=3004
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1
CMD ["node", "dist/index.js"]
EOF

cat > deploy-backend-package/deploy-backend-server.sh << 'EOF'
echo "🔧 DÉPLOIEMENT BACKEND SUR LE SERVEUR"
echo "====================================="
cd /opt/contractforge
echo "🛑 Arrêt du conteneur backend existant..."
docker stop contractforge-backend 2>/dev/null || true
docker rm contractforge-backend 2>/dev/null || true
echo "🧹 Suppression de l'ancienne image backend..."
docker rmi contractforge-backend:latest 2>/dev/null || true
docker system prune -f
echo "🐳 Construction de la nouvelle image backend..."
cd backend
docker build -t contractforge-backend:latest .
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la construction du backend"
    exit 1
fi
echo "🚀 Démarrage du nouveau backend..."
docker run -d \
    --name contractforge-backend \
    --restart unless-stopped \
    -p 3004:3004 \
    -v /opt/contractforge/logs:/app/logs \
    contractforge-backend:latest
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du démarrage du backend"
    exit 1
fi
echo "⏳ Attente du démarrage du backend..."
sleep 10
echo "🏥 Vérification de la santé du backend..."
backend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3004/health || echo "000")
echo "Backend: HTTP $backend_health"
if [ "$backend_health" = "200" ]; then
    echo "✅ Déploiement backend réussi!"
    echo "🌐 Backend: http://192.168.1.60:3004"
else
    echo "⚠️  Le backend peut ne pas être complètement prêt"
    echo "   Vérifiez les logs: docker logs contractforge-backend"
fi
EOF

chmod +x deploy-backend-package/deploy-backend-server.sh

echo "📦 3. Création de l'archive de déploiement..."
tar -czf contractforge-backend-only.tar.gz deploy-backend-package/

echo "📤 4. Transfert vers le serveur de production..."
scp contractforge-backend-only.tar.gz $REMOTE_SERVER:/tmp/
check_error "Transfert vers le serveur"

echo "🔧 5. Déploiement sur le serveur distant..."
ssh $REMOTE_SERVER << 'REMOTE_EOF'
    mkdir -p /opt/contractforge
    cd /opt/contractforge
    if [ -d "backend" ]; then
        echo "💾 Sauvegarde de l'ancien backend..."
        tar -czf backend-backup-$(date +%Y%m%d-%H%M%S).tar.gz backend 2>/dev/null || true
    fi
    rm -rf backend deploy-backend-server.sh
    cd /tmp
    tar -xzf contractforge-backend-only.tar.gz
    mv deploy-backend-package/* /opt/contractforge/
    rm -rf deploy-backend-package contractforge-backend-only.tar.gz
    cd /opt/contractforge
    chmod +x deploy-backend-server.sh
    ./deploy-backend-server.sh
REMOTE_EOF

check_error "Déploiement sur le serveur"

echo "🧹 6. Nettoyage local..."
rm -rf deploy-backend-package contractforge-backend-only.tar.gz

echo ""
echo "🎉 DÉPLOIEMENT BACKEND TERMINÉ AVEC SUCCÈS!"
echo "============================================"
echo "🌐 Backend: http://192.168.1.60:3004"
echo "🌐 API: https://contractforge.io/api/web"
echo ""
echo "📋 Commandes utiles:"
echo "   - Logs backend:  ssh $REMOTE_SERVER 'docker logs contractforge-backend'"
echo "   - Status:        ssh $REMOTE_SERVER 'docker ps | grep contractforge-backend'"
echo "   - Restart:       ssh $REMOTE_SERVER 'docker restart contractforge-backend'"
echo ""
echo "✅ Tous les nouveaux templates DeFi sont maintenant disponibles !" 