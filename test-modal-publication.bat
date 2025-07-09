@echo off
echo ==========================================
echo   TEST MODAL PUBLICATION FORMEASE
echo ==========================================

echo 🚀 Ouverture du Form Builder pour tester la publication...
start "" "http://localhost:8080/frontend/pages/forms/builder.html"

echo.
echo 📋 INSTRUCTIONS DE TEST :
echo.
echo 1. ➕ Ajoutez quelques champs au formulaire
echo 2. 👁️ Cliquez sur "Aperçu" (bouton bleu)
echo 3. 📤 Cliquez sur "Publier & Partager" (bouton du modal)
echo 4. 🧪 Testez TOUS les boutons du modal de publication :
echo.
echo    📋 COPIER LE LIEN :
echo       - Doit copier l'URL dans le presse-papier
echo       - L'icône doit changer temporairement en checkmark
echo       - Toast de confirmation doit apparaître
echo.
echo    📱 QR CODE :
echo       - Doit s'afficher automatiquement
echo       - Image 150x150px avec l'URL du formulaire
echo       - Fallback élégant si l'image ne charge pas
echo.
echo    🔄 CRÉER NOUVEAU FORMULAIRE :
echo       - Doit vider le formulaire actuel
echo       - Fermer le modal automatiquement
echo       - Afficher l'état "nouveau formulaire"
echo.
echo    💾 TÉLÉCHARGER JSON :
echo       - Doit télécharger un fichier .json
echo       - Nom : formease-[titre]-[id].json
echo       - Contenu : Toutes les données du formulaire
echo       - Animation sur le bouton après téléchargement
echo.
echo    📊 VOIR DANS LE DASHBOARD :
echo       - Doit ouvrir le dashboard dans un nouvel onglet
echo       - URL : /frontend/pages/dashboard/home.html
echo       - Garder le builder ouvert
echo.
echo    ❌ FERMER :
echo       - Doit fermer le modal de publication
echo       - Retourner au modal d'aperçu
echo       - Nettoyage complet du DOM
echo.
echo ✅ RÉSULTAT ATTENDU :
echo    TOUS les boutons doivent fonctionner parfaitement
echo    sans erreur dans la console du navigateur.
echo.
echo 🔍 Pour voir les détails techniques, ouvrez :
echo    F12 → Console (pour voir les logs)
echo    F12 → Network (pour voir les requêtes)
echo.
echo 💡 Si un bouton ne fonctionne pas :
echo    1. Ouvrez la console (F12)
echo    2. Regardez les erreurs JavaScript
echo    3. Vérifiez les URLs dans l'onglet Network
echo.
pause
