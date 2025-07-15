# 🧪 Guide de Test - Nouveaux Champs Form Builder

## 🚀 Tests Rapides

### 1. Test Automatique Complet

Ouvrez la console du navigateur sur la page Form Builder et tapez :

```javascript
// Charger le testeur
const script = document.createElement('script');
script.src = '/frontend/js/utils/form-builder-tester.js';
document.head.appendChild(script);

// Lancer tous les tests (après chargement)
setTimeout(() => testFormBuilder(), 1000);
```

### 2. Tests Manuels par Catégorie

#### Champs de Base
```javascript
// Test des champs basiques
['text', 'textarea', 'email', 'number_only', 'address', 'website', 'hidden'].forEach(type => {
    testFieldType(type);
});
```

#### Champs de Sélection
```javascript
// Test des champs de sélection
['select', 'radio', 'checkbox', 'slider', 'rating'].forEach(type => {
    testFieldType(type);
});
```

#### Champs Avancés
```javascript
// Test des champs avancés
['file', 'signature', 'captcha', 'html', 'calculations'].forEach(type => {
    testFieldType(type);
});
```

#### Champs de Paiement
```javascript
// Test des paiements
['currency', 'stripe_payment', 'paypal_payment'].forEach(type => {
    testFieldType(type);
});
```

#### Éléments de Structure
```javascript
// Test des éléments de structure
['section', 'field_group', 'page_break', 'consent'].forEach(type => {
    testFieldType(type);
});
```

## 🔍 Vérifications Visuelles

### Interface Sidebar
- ✅ **6 catégories** visibles avec icônes
- ✅ **Badges Premium** sur les champs avancés
- ✅ **Icônes distinctives** pour chaque type
- ✅ **Descriptions claires** sous chaque nom

### Aperçu des Champs
- ✅ **Rendu fidèle** de chaque type
- ✅ **Styles cohérents** avec Tremor UI
- ✅ **Interactions visuelles** (hover, focus)
- ✅ **Validation visuelle** appropriée

### Fonctionnalités Premium
- ✅ **Modal d'upgrade** pour les champs Premium
- ✅ **Vérification d'accès** en temps réel
- ✅ **Design doré** pour les éléments Premium

## 📝 Tests Spécifiques

### Test du Champ Adresse
```javascript
// Ajouter un champ adresse
formBuilder.addFieldFromTemplate('address');

// Vérifier la structure
const addressField = formBuilder.formFields.find(f => f.type === 'address');
console.log('Adresse settings:', addressField.settings);
// Doit contenir: components, autocomplete
```

### Test du Champ Signature (Premium)
```javascript
// Simuler utilisateur non-premium
const originalCheck = formBuilder.checkPremiumAccess;
formBuilder.checkPremiumAccess = () => false;

// Essayer d'ajouter
formBuilder.addFieldFromTemplate('signature');
// Doit afficher modal Premium

// Restaurer
formBuilder.checkPremiumAccess = originalCheck;
```

### Test des Calculs
```javascript
// Ajouter un champ calcul
formBuilder.addFieldFromTemplate('calculations');

// Vérifier les paramètres
const calcField = formBuilder.formFields.find(f => f.type === 'calculations');
console.log('Calcul settings:', calcField.settings);
// Doit contenir: formula, precision, displayOnly
```

### Test des Paiements
```javascript
// Test Stripe
formBuilder.addFieldFromTemplate('stripe_payment');
const stripeField = formBuilder.formFields.find(f => f.type === 'stripe_payment');
console.log('Stripe settings:', stripeField.settings);
// Doit contenir: amount, currency, description, collectBilling

// Test PayPal  
formBuilder.addFieldFromTemplate('paypal_payment');
const paypalField = formBuilder.formFields.find(f => f.type === 'paypal_payment');
console.log('PayPal settings:', paypalField.settings);
// Doit contenir: amount, currency, description, sandbox
```

## 🎯 Critères de Succès

### ✅ Tests Obligatoires

1. **Ajout de Champs** - Tous les types s'ajoutent sans erreur
2. **Rendu Aperçu** - Tous les champs s'affichent correctement  
3. **Validation Premium** - Les champs Premium sont protégés
4. **Persistance** - Les champs sont sauvegardés avec leurs propriétés
5. **Catégorisation** - L'interface sidebar est organisée par catégories

### 📊 Métriques Cibles

- **100%** des types de champs fonctionnels
- **< 2 secondes** temps de rendu par champ
- **0 erreur** JavaScript dans la console
- **Interface responsive** sur mobile et desktop
- **Validation** appropriée pour chaque type

## 🐛 Debugging

### Erreurs Communes

**Champ non ajouté** :
```javascript
// Vérifier que le type existe
console.log(formBuilder.getDefaultTemplates().map(t => t.type));

// Vérifier les erreurs
console.log(formBuilder.formFields);
```

**Aperçu ne s'affiche pas** :
```javascript
// Tester le rendu
const field = formBuilder.formFields[0];
const preview = formBuilder.renderFieldPreview(field);
console.log('Preview HTML:', preview);
```

**Modal Premium ne s'affiche pas** :
```javascript
// Vérifier la fonction premium
console.log('Premium access:', formBuilder.checkPremiumAccess());
console.log('Templates with premium:', formBuilder.getDefaultTemplates().filter(t => t.premium));
```

### Console Utiles

```javascript
// Voir tous les champs ajoutés
console.table(formBuilder.formFields.map(f => ({
    id: f.id,
    type: f.type,
    label: f.label
})));

// Voir les types disponibles
console.log('Types disponibles:', formBuilder.getDefaultTemplates().map(t => `${t.type} (${t.category})`));

// Vérifier l'état du builder
console.log('FormBuilder state:', {
    fields: formBuilder.formFields.length,
    dirty: formBuilder.isDirty,
    current: formBuilder.currentForm
});
```

## 📈 Rapport de Test

### Utilisation

Après avoir lancé `testFormBuilder()`, un rapport complet s'affiche avec :

- **Score global** en pourcentage
- **Détail par catégorie** de champs
- **Erreurs spécifiques** le cas échéant
- **Notification visuelle** avec résumé

### Interprétation

- **90-100%** : 🎉 Excellent - Tous les champs fonctionnent parfaitement
- **70-89%** : 👍 Bon - Quelques ajustements mineurs nécessaires  
- **< 70%** : ⚠️ À améliorer - Problèmes importants à corriger

### Actions Correctives

En cas d'échec :

1. **Vérifier la console** pour les erreurs JavaScript
2. **Contrôler les dépendances** (ApiService, auto-loader)
3. **Valider les templates** et leur structure
4. **Tester individuellement** chaque type problématique

---

**FormEase Form Builder Testing Suite** 🧪  
*Tests automatisés pour valider l'intégration des 20+ nouveaux types de champs*
