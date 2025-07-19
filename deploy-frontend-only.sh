#!/bin/bash

REMOTE_SERVER="root@192.168.1.60"
REMOTE_DIR="/opt/contractforge"
echo "🚀 DÉPLOIEMENT FRONTEND SEULEMENT - CONTRACTFORGE.IO"
echo "==================================================="

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

echo "📂 2. Préparation des fichiers de déploiement..."
rm -rf deploy-frontend-package
mkdir -p deploy-frontend-package/frontend

echo "   - Préparation du frontend..."
cp -r smart-contract-deployer/dist deploy-frontend-package/frontend/
cp smart-contract-deployer/package*.json deploy-frontend-package/frontend/

cat > deploy-frontend-package/frontend/Dockerfile << 'EOF'
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

cat > deploy-frontend-package/deploy-frontend-server.sh << 'EOF'
echo "🔧 DÉPLOIEMENT FRONTEND SUR LE SERVEUR"
echo "======================================"
cd /opt/contractforge
echo "🛑 Arrêt du conteneur frontend existant..."
docker stop contractforge-frontend 2>/dev/null || true
docker rm contractforge-frontend 2>/dev/null || true
echo "🧹 Suppression de l'ancienne image frontend..."
docker rmi contractforge-frontend:latest 2>/dev/null || true
docker system prune -f
echo "🐳 Construction de la nouvelle image frontend..."
cd frontend
docker build -t contractforge-frontend:latest .
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la construction du frontend"
    exit 1
fi
echo "🚀 Démarrage du nouveau frontend..."
docker run -d \
    --name contractforge-frontend \
    --restart unless-stopped \
    -p 5173:5173 \
    contractforge-frontend:latest
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du démarrage du frontend"
    exit 1
fi
echo "⏳ Attente du démarrage du frontend..."
sleep 10
echo "🏥 Vérification de la santé du frontend..."
frontend_health=$(wget --spider -q -O /dev/null -T 5 http://localhost:5173 && echo "200" || echo "000")
echo "Frontend: HTTP $frontend_health"
if [ "$frontend_health" = "200" ]; then
    echo "✅ Déploiement frontend réussi!"
    echo "🌐 Frontend: http://192.168.1.60:5173"
    echo "🌐 Production: https://contractforge.io"
else
    echo "⚠️  Le frontend peut ne pas être complètement prêt"
    echo "   Vérifiez les logs: docker logs contractforge-frontend"
fi
EOF

chmod +x deploy-frontend-package/deploy-frontend-server.sh

echo "📦 3. Création de l'archive de déploiement..."
tar -czf contractforge-frontend-only.tar.gz deploy-frontend-package/

echo "📤 4. Transfert vers le serveur de production..."
scp contractforge-frontend-only.tar.gz $REMOTE_SERVER:/tmp/
check_error "Transfert vers le serveur"

echo "🔧 5. Déploiement sur le serveur distant..."
ssh $REMOTE_SERVER << 'REMOTE_EOF'
    mkdir -p /opt/contractforge
    cd /opt/contractforge
    if [ -d "frontend" ]; then
        echo "💾 Sauvegarde de l'ancien frontend..."
        tar -czf frontend-backup-$(date +%Y%m%d-%H%M%S).tar.gz frontend 2>/dev/null || true
    fi
    rm -rf frontend deploy-frontend-server.sh
    cd /tmp
    tar -xzf contractforge-frontend-only.tar.gz
    mv deploy-frontend-package/* /opt/contractforge/
    rm -rf deploy-frontend-package contractforge-frontend-only.tar.gz
    cd /opt/contractforge
    chmod +x deploy-frontend-server.sh
    ./deploy-frontend-server.sh
REMOTE_EOF

check_error "Déploiement sur le serveur"

echo "🧹 6. Nettoyage local..."
rm -rf deploy-frontend-package contractforge-frontend-only.tar.gz

echo ""
echo "🎉 DÉPLOIEMENT FRONTEND TERMINÉ AVEC SUCCÈS!"
echo "============================================="
echo "🌐 Frontend: http://192.168.1.60:5173"
echo "🌐 Production: https://contractforge.io"
echo ""
echo "📋 Commandes utiles:"
echo "   - Logs frontend:  ssh $REMOTE_SERVER 'docker logs contractforge-frontend'"
echo "   - Status:        ssh $REMOTE_SERVER 'docker ps | grep contractforge-frontend'"
echo "   - Restart:       ssh $REMOTE_SERVER 'docker restart contractforge-frontend'"
echo ""
echo "✅ Le frontend est maintenant mis à jour avec la nouvelle configuration API !" 