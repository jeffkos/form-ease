#!/bin/bash

# Script de configuration des tâches cron pour le monitoring FormEase
# Usage: chmod +x cron-monitoring.sh && ./cron-monitoring.sh

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Configuration des tâches cron pour le monitoring FormEase${NC}"
echo "=================================================="

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

# Vérifier si le fichier de script existe
SCRIPT_PATH="$(pwd)/src/scripts/monitoringAlerts.js"
if [ ! -f "$SCRIPT_PATH" ]; then
    echo -e "${RED}❌ Script de monitoring non trouvé: $SCRIPT_PATH${NC}"
    exit 1
fi

# Créer le répertoire des logs s'il n'existe pas
mkdir -p logs

# Obtenir le chemin absolu du projet
PROJECT_PATH=$(pwd)
NODE_PATH=$(which node)

echo -e "${YELLOW}📁 Chemin du projet: $PROJECT_PATH${NC}"
echo -e "${YELLOW}📁 Chemin Node.js: $NODE_PATH${NC}"

# Créer le fichier de configuration cron
CRON_FILE="/tmp/formease-monitoring-cron"

cat > "$CRON_FILE" << EOF
# FormEase Monitoring - Tâches automatisées
# Généré le $(date)

# Variables d'environnement
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
MAILTO=""

# Vérification des alertes toutes les 15 minutes
*/15 * * * * cd $PROJECT_PATH && $NODE_PATH src/scripts/monitoringAlerts.js check-alerts >> logs/cron-alerts.log 2>&1

# Rapport de santé quotidien à 8h00
0 8 * * * cd $PROJECT_PATH && $NODE_PATH src/scripts/monitoringAlerts.js health-report >> logs/cron-health.log 2>&1

# Vérification complète (alertes + rapport) toutes les 6 heures
0 */6 * * * cd $PROJECT_PATH && $NODE_PATH src/scripts/monitoringAlerts.js both >> logs/cron-complete.log 2>&1

# Nettoyage des logs anciens (> 30 jours) chaque dimanche à 2h00
0 2 * * 0 find $PROJECT_PATH/logs -name "*.log" -mtime +30 -delete

EOF

echo -e "${GREEN}✅ Fichier de configuration cron créé${NC}"

# Fonction pour installer les tâches cron
install_cron() {
    echo -e "${YELLOW}📥 Installation des tâches cron...${NC}"
    
    # Sauvegarder le crontab actuel
    crontab -l > /tmp/current-crontab 2>/dev/null || touch /tmp/current-crontab
    
    # Supprimer les anciennes tâches FormEase si elles existent
    grep -v "FormEase Monitoring" /tmp/current-crontab > /tmp/new-crontab
    
    # Ajouter les nouvelles tâches
    echo "" >> /tmp/new-crontab
    cat "$CRON_FILE" >> /tmp/new-crontab
    
    # Installer le nouveau crontab
    crontab /tmp/new-crontab
    
    echo -e "${GREEN}✅ Tâches cron installées avec succès${NC}"
    
    # Nettoyer les fichiers temporaires
    rm -f /tmp/current-crontab /tmp/new-crontab "$CRON_FILE"
}

# Fonction pour désinstaller les tâches cron
uninstall_cron() {
    echo -e "${YELLOW}🗑️ Désinstallation des tâches cron...${NC}"
    
    # Sauvegarder le crontab actuel
    crontab -l > /tmp/current-crontab 2>/dev/null || touch /tmp/current-crontab
    
    # Supprimer les tâches FormEase
    grep -v "FormEase Monitoring" /tmp/current-crontab > /tmp/new-crontab
    grep -v "monitoringAlerts.js" /tmp/new-crontab > /tmp/final-crontab
    
    # Installer le crontab nettoyé
    crontab /tmp/final-crontab
    
    echo -e "${GREEN}✅ Tâches cron désinstallées${NC}"
    
    # Nettoyer les fichiers temporaires
    rm -f /tmp/current-crontab /tmp/new-crontab /tmp/final-crontab
}

# Fonction pour afficher le statut
show_status() {
    echo -e "${BLUE}📊 Statut des tâches cron FormEase:${NC}"
    echo "================================="
    
    if crontab -l 2>/dev/null | grep -q "FormEase Monitoring"; then
        echo -e "${GREEN}✅ Tâches cron installées${NC}"
        echo ""
        echo "Tâches actives:"
        crontab -l 2>/dev/null | grep -A 10 "FormEase Monitoring"
    else
        echo -e "${RED}❌ Aucune tâche cron installée${NC}"
    fi
    
    echo ""
    echo "Fichiers de log:"
    ls -la logs/cron-*.log 2>/dev/null || echo "Aucun fichier de log trouvé"
}

# Fonction pour tester le script
test_monitoring() {
    echo -e "${YELLOW}🧪 Test du script de monitoring...${NC}"
    
    echo "Test des alertes:"
    cd "$PROJECT_PATH" && node src/scripts/monitoringAlerts.js check-alerts
    
    echo ""
    echo "Test du rapport de santé:"
    cd "$PROJECT_PATH" && node src/scripts/monitoringAlerts.js health-report
}

# Fonction pour afficher les logs
show_logs() {
    echo -e "${BLUE}📋 Logs de monitoring:${NC}"
    echo "===================="
    
    LOG_FILES=("cron-alerts.log" "cron-health.log" "cron-complete.log")
    
    for log_file in "${LOG_FILES[@]}"; do
        if [ -f "logs/$log_file" ]; then
            echo -e "${GREEN}📄 $log_file (dernières 10 lignes):${NC}"
            tail -n 10 "logs/$log_file"
            echo ""
        fi
    done
}

# Menu principal
case "$1" in
    install)
        install_cron
        ;;
    uninstall)
        uninstall_cron
        ;;
    status)
        show_status
        ;;
    test)
        test_monitoring
        ;;
    logs)
        show_logs
        ;;
    *)
        echo -e "${BLUE}Usage: $0 {install|uninstall|status|test|logs}${NC}"
        echo ""
        echo "Commands:"
        echo "  install     - Installe les tâches cron de monitoring"
        echo "  uninstall   - Désinstalle les tâches cron"
        echo "  status      - Affiche le statut des tâches cron"
        echo "  test        - Teste le script de monitoring"
        echo "  logs        - Affiche les logs récents"
        echo ""
        echo "Configuration des variables d'environnement:"
        echo "  ALERT_EMAIL_TO        - Email pour les alertes critiques"
        echo "  HEALTH_REPORT_EMAIL   - Email pour le rapport de santé quotidien"
        echo "  ALERT_WEBHOOK_URL     - URL webhook pour notifications (Slack/Discord)"
        echo "  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS - Configuration email"
        echo ""
        echo "Exemple de configuration .env:"
        echo "  ALERT_EMAIL_TO=admin@formease.com"
        echo "  HEALTH_REPORT_EMAIL=cto@formease.com"
        echo "  ALERT_WEBHOOK_URL=https://hooks.slack.com/services/..."
        echo "  SMTP_HOST=smtp.gmail.com"
        echo "  SMTP_PORT=587"
        echo "  SMTP_USER=noreply@formease.com"
        echo "  SMTP_PASS=your-password"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Opération terminée avec succès!${NC}" 