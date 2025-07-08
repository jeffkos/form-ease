#!/bin/bash
# Script de nettoyage automatique des console.log
# Usage: ./scripts/clean-console-logs.sh

echo "🧹 Début du nettoyage des console.log dans le backend FormEase..."

# Vérifier si nous sommes dans le bon répertoire
if [ ! -d "src" ]; then
    echo "❌ Erreur: Le répertoire 'src' n'existe pas. Exécutez ce script depuis le répertoire backend."
    exit 1
fi

# Créer un répertoire de sauvegarde
backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 Création d'une sauvegarde dans: $backup_dir"
mkdir -p "$backup_dir"
cp -r src/ "$backup_dir/"

# Compter les occurrences avant nettoyage
console_count_before=$(grep -r "console\." src/ --include="*.js" | wc -l)
echo "📊 Console.log détectés avant nettoyage: $console_count_before"

# Fichiers qui utilisent déjà logger (à conserver)
files_with_logger=()

# Fonction pour ajouter l'import logger si nécessaire
add_logger_import() {
    local file="$1"
    
    # Vérifier si le fichier contient déjà un import logger
    if ! grep -q "require.*logger" "$file" && ! grep -q "import.*logger" "$file"; then
        # Déterminer le chemin relatif vers utils/logger
        local dir_depth=$(echo "$file" | tr -cd '/' | wc -c)
        local relative_path=""
        
        case $dir_depth in
            1) relative_path="./utils/logger" ;;
            2) relative_path="../utils/logger" ;;
            3) relative_path="../../utils/logger" ;;
            *) relative_path="../utils/logger" ;; # Par défaut
        esac
        
        # Ajouter l'import en haut du fichier
        sed -i "1i const logger = require('$relative_path');" "$file"
        echo "✅ Import logger ajouté dans: $file"
    fi
}

# Traitement des fichiers JavaScript
find src/ -name "*.js" -type f | while read file; do
    echo "🔍 Traitement de: $file"
    
    # Vérifier si le fichier contient des console.*
    if grep -q "console\." "$file"; then
        echo "  📝 Console.* détecté dans $file"
        
        # Ajouter l'import logger si nécessaire
        add_logger_import "$file"
        
        # Remplacements spécifiques selon le type de console
        
        # Console.log -> logger.info (avec formatage amélioré)
        sed -i 's/console\.log(\([^)]*\));/logger.info(\1, { timestamp: new Date().toISOString() });/g' "$file"
        
        # Console.error -> logger.error (avec gestion des erreurs)
        sed -i 's/console\.error(\([^)]*\));/logger.error(\1, { timestamp: new Date().toISOString() });/g' "$file"
        
        # Console.warn -> logger.warn
        sed -i 's/console\.warn(\([^)]*\));/logger.warn(\1, { timestamp: new Date().toISOString() });/g' "$file"
        
        # Console.info -> logger.info  
        sed -i 's/console\.info(\([^)]*\));/logger.info(\1, { timestamp: new Date().toISOString() });/g' "$file"
        
        # Console.debug -> logger.debug
        sed -i 's/console\.debug(\([^)]*\));/logger.debug(\1, { timestamp: new Date().toISOString() });/g' "$file"
        
        echo "  ✅ Remplacements effectués dans $file"
    fi
done

# Cas spéciaux pour des patterns plus complexes
echo "🎯 Traitement des patterns complexes..."

# Traiter les console.log avec template literals
find src/ -name "*.js" -exec sed -i 's/console\.log(`\([^`]*\)`);/logger.info(`\1`, { timestamp: new Date().toISOString() });/g' {} \;

# Traiter les console.error avec objets d'erreur
find src/ -name "*.js" -exec sed -i 's/console\.error(\([^,]*\),\s*\([^)]*\));/logger.error(\1, { error: \2, timestamp: new Date().toISOString() });/g' {} \;

# Compter les occurrences après nettoyage
console_count_after=$(grep -r "console\." src/ --include="*.js" | wc -l)
echo "📊 Console.* restants après nettoyage: $console_count_after"

# Statistiques finales
cleaned_count=$((console_count_before - console_count_after))
echo ""
echo "📈 RÉSULTATS DU NETTOYAGE:"
echo "  🔄 Console.* traités: $cleaned_count"
echo "  ⚠️  Console.* restants: $console_count_after"
echo "  📦 Sauvegarde créée dans: $backup_dir"

# Vérifications post-nettoyage
echo ""
echo "🔍 VÉRIFICATIONS POST-NETTOYAGE:"

# Vérifier les imports logger
missing_imports=$(find src/ -name "*.js" -exec grep -l "logger\." {} \; | while read file; do
    if ! grep -q "require.*logger" "$file" && ! grep -q "import.*logger" "$file"; then
        echo "$file"
    fi
done | wc -l)

if [ "$missing_imports" -gt 0 ]; then
    echo "  ⚠️  $missing_imports fichiers utilisent logger sans l'importer"
else
    echo "  ✅ Tous les imports logger sont corrects"
fi

# Vérifier la syntaxe JavaScript (si node est disponible)
if command -v node >/dev/null 2>&1; then
    echo "  🔍 Vérification de la syntaxe JavaScript..."
    syntax_errors=0
    find src/ -name "*.js" | while read file; do
        if ! node -c "$file" >/dev/null 2>&1; then
            echo "    ❌ Erreur de syntaxe dans: $file"
            syntax_errors=$((syntax_errors + 1))
        fi
    done
    
    if [ "$syntax_errors" -eq 0 ]; then
        echo "  ✅ Aucune erreur de syntaxe détectée"
    fi
fi

echo ""
echo "🏁 Nettoyage terminé!"
echo "💡 Prochaines étapes:"
echo "   1. Vérifiez les changements: git diff"
echo "   2. Testez l'application: npm test"
echo "   3. Commitez si tout fonctionne: git add . && git commit -m 'Clean console.log and add proper logging'"

# Afficher les fichiers modifiés pour review
echo ""
echo "📁 FICHIERS MODIFIÉS:"
find src/ -name "*.js" -newer "$backup_dir" 2>/dev/null | head -10
if [ $(find src/ -name "*.js" -newer "$backup_dir" 2>/dev/null | wc -l) -gt 10 ]; then
    echo "   ... et $(( $(find src/ -name "*.js" -newer "$backup_dir" 2>/dev/null | wc -l) - 10 )) autres fichiers"
fi

exit 0
