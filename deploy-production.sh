REMOTE_SERVER="root@192.168.1.60"
REMOTE_DIR="/opt/contractforge"
echo "🚀 DÉPLOIEMENT COMPLET DE CONTRACTFORGE.IO"
echo "=========================================="
check_error() {
    if [ $? -ne 0 ]; then
        echo "❌ Erreur: $1"
        exit 1
    fi
}
echo "📦 1. Construction du frontend..."
cd smart-contract-deployer
npx vite build --mode production
check_error "Build du frontend"
cd ..
echo "📦 2. Construction du backend..."
cd smart-contract-compiler-api
npm run build
check_error "Build du backend"
cd ..
echo "📂 3. Préparation des fichiers de déploiement..."
rm -rf deploy-package
mkdir -p deploy-package/backend deploy-package/frontend
echo "   - Préparation du backend..."
cp -r smart-contract-compiler-api/dist deploy-package/backend/
cp -r smart-contract-compiler-api/src deploy-package/backend/
cp smart-contract-compiler-api/package*.json deploy-package/backend/
cp -r smart-contract-compiler-api/data deploy-package/backend/
cp smart-contract-compiler-api/.env deploy-package/backend/
cat > deploy-package/backend/Dockerfile << 'EOF'
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
echo "   - Préparation du frontend..."
cp -r smart-contract-deployer/dist deploy-package/frontend/
cp smart-contract-deployer/package*.json deploy-package/frontend/
cat > deploy-package/frontend/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY dist ./dist
COPY package*.json ./
ENV NODE_ENV=production
EXPOSE 5173
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173 || exit 1
CMD ["serve", "-s", "dist", "-l", "5173", "-n"]
EOF

cat > deploy-package/deploy-server.sh << 'EOF'
echo "🔧 DÉPLOIEMENT SUR LE SERVEUR"
echo "============================="
cd /opt/contractforge
echo "🛑 Nettoyage des conteneurs existants..."
docker stop $(docker ps -aq --filter "name=contractforge") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=contractforge") 2>/dev/null || true
echo "🧹 Suppression des anciennes images..."
docker rmi $(docker images -q --filter "reference=contractforge*") 2>/dev/null || true
docker rmi $(docker images -q --filter "reference=justin*") 2>/dev/null || true
docker system prune -f
echo "🐳 Construction de l'image backend..."
cd backend
docker build -t contractforge-backend:latest .
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la construction du backend"
    exit 1
fi
echo "🐳 Construction de l'image frontend..."
cd ../frontend
docker build -t contractforge-frontend:latest .
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la construction du frontend"
    exit 1
fi

echo "🚀 Démarrage du backend..."
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
echo "🚀 Démarrage du frontend..."
docker run -d \
    --name contractforge-frontend \
    --restart unless-stopped \
    -p 5173:5173 \
    contractforge-frontend:latest
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du démarrage du frontend"
    exit 1
fi

echo "⏳ Vérification des services..."
sleep 15
echo "📊 Statut des conteneurs:"
docker ps --filter "name=contractforge" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo "🏥 Vérification de la santé des services..."
backend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3004/health || echo "000")
frontend_health=$(wget --spider -q -O /dev/null -T 5 http://localhost:5173 && echo "200" || echo "000")
echo "Backend: HTTP $backend_health"
echo "Frontend: HTTP $frontend_health"
if [ "$backend_health" = "200" ] && [ "$frontend_health" = "200" ]; then
    echo "✅ Déploiement réussi!"
    echo "🌐 Backend: http://192.168.1.60:3004"
    echo "🌐 Frontend: http://192.168.1.60:5173"
else
    echo "⚠️  Certains services peuvent ne pas être complètement prêts"
    echo "   Vérifiez les logs: docker logs contractforge-backend"
    echo "                    docker logs contractforge-frontend"
fi
EOF
chmod +x deploy-package/deploy-server.sh
echo "📦 4. Création de l'archive de déploiement..."
tar -czf contractforge-production.tar.gz deploy-package/
echo "📤 5. Transfert vers le serveur de production..."
scp contractforge-production.tar.gz $REMOTE_SERVER:/tmp/
check_error "Transfert vers le serveur"
echo "🔧 6. Déploiement sur le serveur distant..."
ssh $REMOTE_SERVER << 'REMOTE_EOF'
    mkdir -p /opt/contractforge
    cd /opt/contractforge
    if [ -d "backend" ] || [ -d "frontend" ]; then
        echo "💾 Sauvegarde de l'ancien déploiement..."
        tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz backend frontend 2>/dev/null || true
    fi
    rm -rf backend frontend deploy-server.sh
    cd /tmp
    tar -xzf contractforge-production.tar.gz
    mv deploy-package/* /opt/contractforge/
    rm -rf deploy-package contractforge-production.tar.gz
    cd /opt/contractforge
    chmod +x deploy-server.sh
    ./deploy-server.sh
REMOTE_EOF
check_error "Déploiement sur le serveur"
echo "🧹 7. Nettoyage local..."
rm -rf deploy-package contractforge-production.tar.gz
echo ""
echo "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!"
echo "=================================="
echo "🌐 Frontend: http://192.168.1.60:5173"
echo "🌐 Backend:  http://192.168.1.60:3004"
echo ""
echo "📋 Commandes utiles:"
echo "   - Logs backend:  ssh $REMOTE_SERVER 'docker logs contractforge-backend'"
echo "   - Logs frontend: ssh $REMOTE_SERVER 'docker logs contractforge-frontend'"
echo "   - Status:        ssh $REMOTE_SERVER 'docker ps | grep contractforge'"
echo ""