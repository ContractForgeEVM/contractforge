REMOTE_SERVER="root@192.168.1.60"
IMAGE_NAME="contractforge-frontend-new"
CONTAINER_NAME="contractforge-frontend"
PORT="5173"
echo "🚀 Déploiement de ContractForge.io sur le serveur de production..."
echo "📦 Construction de l'image Docker..."
docker build -t $IMAGE_NAME .
echo "💾 Sauvegarde de l'image Docker..."
docker save $IMAGE_NAME > contractforge-frontend.tar
echo "📤 Transfert de l'image vers le serveur distant..."
scp contractforge-frontend.tar $REMOTE_SERVER:/tmp/
echo "🔧 Déploiement sur le serveur distant..."
ssh $REMOTE_SERVER << EOF
    echo "📥 Chargement de l'image Docker..."
    docker load < /tmp/contractforge-frontend.tar
    echo "🛑 Arrêt de l'ancien conteneur..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    echo "🚀 Démarrage du nouveau conteneur..."
    docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:5173 \
        --restart unless-stopped \
        $IMAGE_NAME
    echo "🧹 Nettoyage..."
    rm /tmp/contractforge-frontend.tar
    echo "✅ Déploiement terminé !"
    echo "📊 Statut du conteneur :"
    docker ps | grep $CONTAINER_NAME
EOF
echo "🧹 Nettoyage local..."
rm contractforge-frontend.tar
echo "🎉 Déploiement terminé avec succès !"
echo "🌐 L'application est accessible sur : http://192.168.1.60:$PORT"