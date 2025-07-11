# 📚 Documentation API - FormEase v4.0

## 🎯 Introduction à l'API

L'API FormEase offre une interface complète pour créer, gérer et intégrer des formulaires dynamiques. Cette documentation couvre toutes les classes, méthodes et événements disponibles.

## 📖 Table des Matières

### 🏗️ Classes Principales
- [FormBuilder](#formbuilder) - Constructeur de formulaires principal
- [ComponentManager](#componentmanager) - Gestionnaire de composants
- [EventSystem](#eventsystem) - Système d'événements
- [ThemeManager](#thememanager) - Gestionnaire de thèmes
- [ValidationEngine](#validationengine) - Moteur de validation

### 🔒 Sécurité
- [SecurityManager](#securitymanager) - Gestionnaire de sécurité
- [AuthManager](#authmanager) - Gestionnaire d'authentification
- [EncryptionManager](#encryptionmanager) - Gestionnaire de chiffrement

### 🏢 Multi-tenant
- [TenantManager](#tenantmanager) - Gestionnaire multi-tenant
- [ResourceManager](#resourcemanager) - Gestionnaire de ressources
- [BillingManager](#billingmanager) - Gestionnaire de facturation

### ⚡ Performance
- [PerformanceOptimizer](#performanceoptimizer) - Optimiseur de performance
- [CacheSystem](#cachesystem) - Système de cache
- [LoadBalancer](#loadbalancer) - Équilibreur de charge

### 🤝 Collaboration
- [CollaborationEngine](#collaborationengine) - Moteur de collaboration
- [CommentSystem](#commentsystem) - Système de commentaires
- [NotificationRouter](#notificationrouter) - Routeur de notifications

## 🏗️ FormBuilder

### Description
La classe principale pour créer et gérer des formulaires dynamiques.

### Constructor

```javascript
new FormBuilder(config)
```

**Paramètres :**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| config | Object | Non | Configuration du FormBuilder |
| config.container | string\|HTMLElement | Oui | Conteneur du formulaire |
| config.theme | string | Non | Thème à utiliser ('modern', 'glassmorphism') |
| config.validation | Object | Non | Configuration de validation |
| config.security | Object | Non | Configuration de sécurité |
| config.collaboration | boolean | Non | Activer la collaboration |

**Exemple :**

```javascript
const formBuilder = new FormBuilder({
    container: '#my-form',
    theme: 'modern',
    validation: {
        realtime: true,
        showErrors: true
    },
    security: {
        csrf: true,
        xss: true
    },
    collaboration: true
});
```

### Méthodes Principales

#### addField(fieldConfig)

Ajoute un champ au formulaire.

**Paramètres :**

```typescript
interface FieldConfig {
    type: string;           // Type du champ ('text', 'email', 'select', etc.)
    name: string;           // Nom du champ
    label?: string;         // Label affiché
    placeholder?: string;   // Texte de placeholder
    required?: boolean;     // Champ requis
    validation?: Object;    // Règles de validation
    value?: any;           // Valeur par défaut
    options?: Array;       // Options pour select/radio
    attributes?: Object;   // Attributs HTML supplémentaires
}
```

**Retour :** `Component` - Instance du composant créé

**Exemple :**

```javascript
const nameField = formBuilder.addField({
    type: 'text',
    name: 'fullName',
    label: 'Nom complet',
    placeholder: 'Entrez votre nom',
    required: true,
    validation: {
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-ZÀ-ÿ\s]+$/
    }
});
```

#### removeField(fieldId)

Supprime un champ du formulaire.

**Paramètres :**
- `fieldId` (string) - ID du champ à supprimer

**Retour :** `boolean` - true si supprimé avec succès

**Exemple :**

```javascript
const success = formBuilder.removeField('field-123');
console.log(success ? 'Champ supprimé' : 'Échec suppression');
```

#### getFieldValue(fieldName)

Récupère la valeur d'un champ.

**Paramètres :**
- `fieldName` (string) - Nom du champ

**Retour :** `any` - Valeur du champ

**Exemple :**

```javascript
const email = formBuilder.getFieldValue('email');
console.log('Email:', email);
```

#### setFieldValue(fieldName, value)

Définit la valeur d'un champ.

**Paramètres :**
- `fieldName` (string) - Nom du champ
- `value` (any) - Nouvelle valeur

**Retour :** `boolean` - true si défini avec succès

**Exemple :**

```javascript
formBuilder.setFieldValue('country', 'France');
```

#### getFormData()

Récupère toutes les données du formulaire.

**Retour :** `Object` - Données du formulaire

**Exemple :**

```javascript
const formData = formBuilder.getFormData();
console.log('Données du formulaire:', formData);
/*
{
    fullName: 'Jean Dupont',
    email: 'jean@example.com',
    country: 'France'
}
*/
```

#### validate()

Valide tous les champs du formulaire.

**Retour :** `ValidationResult`

```typescript
interface ValidationResult {
    valid: boolean;
    errors: Array<{
        field: string;
        message: string;
    }>;
    warnings: Array<{
        field: string;
        message: string;
    }>;
}
```

**Exemple :**

```javascript
const result = formBuilder.validate();
if (result.valid) {
    console.log('Formulaire valide');
} else {
    console.log('Erreurs:', result.errors);
}
```

#### submit(options)

Soumet le formulaire.

**Paramètres :**

```typescript
interface SubmitOptions {
    endpoint?: string;      // URL de soumission
    method?: string;        // Méthode HTTP ('POST', 'PUT')
    headers?: Object;       // Headers HTTP
    beforeSubmit?: Function; // Callback avant soumission
    onSuccess?: Function;   // Callback succès
    onError?: Function;     // Callback erreur
    validateFirst?: boolean; // Valider avant soumission
}
```

**Retour :** `Promise<SubmitResult>`

**Exemple :**

```javascript
try {
    const result = await formBuilder.submit({
        endpoint: '/api/contact',
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        beforeSubmit: (data) => {
            console.log('Envoi des données:', data);
            return true; // Continuer la soumission
        },
        onSuccess: (response) => {
            console.log('Succès:', response);
        },
        validateFirst: true
    });
    
    console.log('Formulaire envoyé:', result);
} catch (error) {
    console.error('Erreur envoi:', error);
}
```

#### render()

Rend le formulaire dans le DOM.

**Retour :** `HTMLElement` - Élément DOM du formulaire

**Exemple :**

```javascript
const formElement = formBuilder.render();
document.body.appendChild(formElement);
```

#### destroy()

Détruit l'instance du FormBuilder et nettoie le DOM.

**Exemple :**

```javascript
formBuilder.destroy();
```

### Événements

Le FormBuilder émet plusieurs événements que vous pouvez écouter :

#### formReady

Déclenché quand le formulaire est prêt.

```javascript
formBuilder.on('formReady', (data) => {
    console.log('Formulaire prêt:', data);
});
```

#### fieldAdded

Déclenché quand un champ est ajouté.

```javascript
formBuilder.on('fieldAdded', (field) => {
    console.log('Champ ajouté:', field.name);
});
```

#### fieldChanged

Déclenché quand la valeur d'un champ change.

```javascript
formBuilder.on('fieldChanged', (event) => {
    console.log(`Champ ${event.field} modifié:`, event.value);
});
```

#### formSubmitted

Déclenché après soumission du formulaire.

```javascript
formBuilder.on('formSubmitted', (result) => {
    if (result.success) {
        console.log('Formulaire envoyé avec succès');
    }
});
```

#### validationError

Déclenché en cas d'erreur de validation.

```javascript
formBuilder.on('validationError', (errors) => {
    console.log('Erreurs de validation:', errors);
});
```

## 🧩 ComponentManager

### Description
Gestionnaire pour les composants de formulaire. Permet d'enregistrer des types personnalisés et de créer des instances.

### Constructor

```javascript
new ComponentManager(options)
```

**Paramètres :**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| options | Object | Non | Options de configuration |
| options.autoRegister | boolean | Non | Enregistrement automatique des composants par défaut |

### Méthodes

#### register(type, ComponentClass)

Enregistre un nouveau type de composant.

**Paramètres :**
- `type` (string) - Type unique du composant
- `ComponentClass` (Function) - Classe du composant

**Exemple :**

```javascript
class CustomRating extends IComponent {
    constructor(config) {
        super(config);
        this.maxStars = config.maxStars || 5;
    }
    
    render() {
        // Implémentation du rendu
        const container = document.createElement('div');
        container.className = 'rating-component';
        
        for (let i = 1; i <= this.maxStars; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.textContent = '⭐';
            star.addEventListener('click', () => this.setRating(i));
            container.appendChild(star);
        }
        
        return container;
    }
    
    setRating(rating) {
        this.value = rating;
        this.emit('change', { value: rating });
    }
    
    validate() {
        return {
            valid: !this.required || this.value > 0,
            errors: this.required && !this.value ? ['Veuillez donner une note'] : []
        };
    }
    
    getValue() {
        return this.value;
    }
    
    setValue(value) {
        this.value = value;
        this.updateDisplay();
    }
}

// Enregistrement du composant
const manager = new ComponentManager();
manager.register('rating', CustomRating);
```

#### create(type, config)

Crée une instance de composant.

**Paramètres :**
- `type` (string) - Type du composant
- `config` (Object) - Configuration du composant

**Retour :** `IComponent` - Instance du composant

**Exemple :**

```javascript
const ratingField = manager.create('rating', {
    name: 'satisfaction',
    label: 'Satisfaction',
    maxStars: 5,
    required: true
});
```

#### getAvailableTypes()

Récupère la liste des types de composants disponibles.

**Retour :** `Array<string>` - Liste des types

**Exemple :**

```javascript
const types = manager.getAvailableTypes();
console.log('Types disponibles:', types);
// ['text', 'email', 'select', 'rating', ...]
```

## 🎨 ThemeManager

### Description
Gestionnaire de thèmes pour personnaliser l'apparence des formulaires.

### Constructor

```javascript
new ThemeManager()
```

### Méthodes

#### register(name, theme)

Enregistre un nouveau thème.

**Paramètres :**
- `name` (string) - Nom unique du thème
- `theme` (Object) - Configuration du thème

**Exemple :**

```javascript
const themeManager = new ThemeManager();

themeManager.register('corporate', {
    name: 'Corporate',
    colors: {
        primary: '#1e40af',
        secondary: '#64748b',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1f2937'
    },
    typography: {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.4'
    },
    spacing: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px'
    },
    borderRadius: '4px',
    shadows: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
        md: '0 4px 6px rgba(0, 0, 0, 0.16)',
        lg: '0 10px 25px rgba(0, 0, 0, 0.20)'
    }
});
```

#### apply(themeName)

Applique un thème.

**Paramètres :**
- `themeName` (string) - Nom du thème à appliquer

**Exemple :**

```javascript
themeManager.apply('corporate');
```

#### getCurrentTheme()

Récupère le thème actuellement appliqué.

**Retour :** `string` - Nom du thème actuel

#### getAvailableThemes()

Récupère la liste des thèmes disponibles.

**Retour :** `Array<Object>` - Liste des thèmes

```javascript
const themes = themeManager.getAvailableThemes();
console.log(themes);
/*
[
    { name: 'modern', displayName: 'Modern' },
    { name: 'glassmorphism', displayName: 'Glassmorphism' },
    { name: 'corporate', displayName: 'Corporate' }
]
*/
```

#### createCustomTheme(baseTheme, customizations)

Crée un thème personnalisé basé sur un thème existant.

**Paramètres :**
- `baseTheme` (string) - Thème de base
- `customizations` (Object) - Personnalisations à appliquer

**Retour :** `Object` - Configuration du thème personnalisé

**Exemple :**

```javascript
const customTheme = themeManager.createCustomTheme('modern', {
    colors: {
        primary: '#e11d48',  // Rouge personnalisé
        secondary: '#64748b'
    },
    borderRadius: '12px'
});

themeManager.register('myCustomTheme', customTheme);
themeManager.apply('myCustomTheme');
```

## 🔒 SecurityManager

### Description
Gestionnaire de sécurité pour protéger les formulaires contre les attaques.

### Constructor

```javascript
new SecurityManager(config)
```

**Paramètres :**

```typescript
interface SecurityConfig {
    csrf?: boolean;          // Protection CSRF
    xss?: boolean;          // Protection XSS
    rateLimiting?: Object;  // Limitation de taux
    encryption?: Object;    // Configuration chiffrement
    audit?: boolean;        // Audit de sécurité
}
```

### Méthodes

#### enableCSRFProtection(options)

Active la protection CSRF.

**Paramètres :**

```typescript
interface CSRFOptions {
    tokenName?: string;     // Nom du token (défaut: '_token')
    headerName?: string;    // Nom du header (défaut: 'X-CSRF-Token')
    endpoint?: string;      // Endpoint pour récupérer le token
}
```

**Exemple :**

```javascript
const security = new SecurityManager();
security.enableCSRFProtection({
    tokenName: '_csrf_token',
    headerName: 'X-CSRF-Token',
    endpoint: '/api/csrf-token'
});
```

#### sanitizeInput(input, options)

Nettoie les entrées utilisateur contre XSS.

**Paramètres :**
- `input` (string) - Données à nettoyer
- `options` (Object) - Options de nettoyage

**Retour :** `string` - Données nettoyées

**Exemple :**

```javascript
const cleanInput = security.sanitizeInput('<script>alert("xss")</script>Hello');
console.log(cleanInput); // 'Hello'
```

#### validateOrigin(origin)

Valide l'origine d'une requête.

**Paramètres :**
- `origin` (string) - Origine à valider

**Retour :** `boolean` - true si origine valide

#### encryptData(data, key)

Chiffre des données sensibles.

**Paramètres :**
- `data` (string) - Données à chiffrer
- `key` (string) - Clé de chiffrement

**Retour :** `string` - Données chiffrées

**Exemple :**

```javascript
const encrypted = security.encryptData('sensitive data', 'encryption-key');
```

#### decryptData(encryptedData, key)

Déchiffre des données.

**Paramètres :**
- `encryptedData` (string) - Données chiffrées
- `key` (string) - Clé de déchiffrement

**Retour :** `string` - Données déchiffrées

## ⚡ PerformanceOptimizer

### Description
Optimiseur de performance pour améliorer les performances des formulaires.

### Constructor

```javascript
new PerformanceOptimizer(config)
```

### Méthodes

#### enableLazyLoading(options)

Active le chargement paresseux des composants.

**Paramètres :**

```typescript
interface LazyLoadingOptions {
    threshold?: number;     // Seuil de déclenchement (défaut: 0.1)
    rootMargin?: string;   // Marge du root (défaut: '0px')
}
```

**Exemple :**

```javascript
const optimizer = new PerformanceOptimizer();
optimizer.enableLazyLoading({
    threshold: 0.2,
    rootMargin: '50px'
});
```

#### enableVirtualScrolling(container, options)

Active le défilement virtuel pour les grandes listes.

**Paramètres :**
- `container` (HTMLElement) - Conteneur de la liste
- `options` (Object) - Options de virtualisation

**Exemple :**

```javascript
optimizer.enableVirtualScrolling(listContainer, {
    itemHeight: 50,
    bufferSize: 10
});
```

#### debounce(func, delay, key)

Applique un debounce à une fonction.

**Paramètres :**
- `func` (Function) - Fonction à debouncer
- `delay` (number) - Délai en millisecondes
- `key` (string) - Clé unique pour le debounce

**Exemple :**

```javascript
optimizer.debounce(() => {
    console.log('Recherche...');
}, 300, 'search');
```

#### getPerformanceMetrics()

Récupère les métriques de performance.

**Retour :** `Object` - Métriques de performance

**Exemple :**

```javascript
const metrics = optimizer.getPerformanceMetrics();
console.log(metrics);
/*
{
    renderTime: 45,
    memoryUsage: 12.5,
    componentCount: 25,
    eventListeners: 150
}
*/
```

## 🤝 CollaborationEngine

### Description
Moteur de collaboration temps réel pour permettre à plusieurs utilisateurs de travailler simultanément.

### Constructor

```javascript
new CollaborationEngine(config)
```

**Paramètres :**

```typescript
interface CollaborationConfig {
    websocket?: {
        url: string;
        reconnectAttempts?: number;
        reconnectDelay?: number;
    };
    presence?: boolean;      // Suivi de présence
    realtime?: boolean;      // Synchronisation temps réel
    conflicts?: string;      // Stratégie de résolution de conflits
}
```

### Méthodes

#### joinRoom(roomId, userId)

Rejoint une salle de collaboration.

**Paramètres :**
- `roomId` (string) - ID de la salle
- `userId` (string) - ID de l'utilisateur

**Retour :** `Promise<Room>` - Information sur la salle

**Exemple :**

```javascript
const collaboration = new CollaborationEngine({
    websocket: {
        url: 'wss://collaboration.formease.com'
    },
    presence: true,
    realtime: true
});

try {
    const room = await collaboration.joinRoom('form-123', 'user-456');
    console.log('Salle rejointe:', room);
} catch (error) {
    console.error('Erreur rejoint salle:', error);
}
```

#### leaveRoom(roomId, userId)

Quitte une salle de collaboration.

**Paramètres :**
- `roomId` (string) - ID de la salle
- `userId` (string) - ID de l'utilisateur

**Retour :** `Promise<boolean>` - true si quitté avec succès

#### updateUserPresence(userId, presence)

Met à jour la présence d'un utilisateur.

**Paramètres :**
- `userId` (string) - ID de l'utilisateur
- `presence` (Object) - Information de présence

**Exemple :**

```javascript
collaboration.updateUserPresence('user-456', {
    state: 'active',
    cursor: { x: 100, y: 200 },
    selection: { start: 10, end: 20 },
    activity: 'editing'
});
```

#### applyOperation(operation)

Applique une opération collaborative.

**Paramètres :**
- `operation` (Object) - Opération à appliquer

**Exemple :**

```javascript
const operation = {
    type: 'insert',
    position: 15,
    content: 'nouveau texte',
    authorId: 'user-456',
    timestamp: Date.now()
};

collaboration.applyOperation(operation);
```

#### getActiveUsers()

Récupère la liste des utilisateurs actifs.

**Retour :** `Array<User>` - Liste des utilisateurs

**Exemple :**

```javascript
const activeUsers = collaboration.getActiveUsers();
console.log('Utilisateurs actifs:', activeUsers);
/*
[
    {
        id: 'user-456',
        name: 'Jean Dupont',
        avatar: 'https://example.com/avatar.jpg',
        state: 'active',
        lastActivity: '2025-07-11T10:30:00Z'
    }
]
*/
```

### Événements Collaboration

#### userJoined

Déclenché quand un utilisateur rejoint.

```javascript
collaboration.on('userJoined', (user) => {
    console.log(`${user.name} a rejoint la collaboration`);
});
```

#### userLeft

Déclenché quand un utilisateur quitte.

```javascript
collaboration.on('userLeft', (user) => {
    console.log(`${user.name} a quitté la collaboration`);
});
```

#### operationApplied

Déclenché quand une opération est appliquée.

```javascript
collaboration.on('operationApplied', (operation) => {
    console.log('Opération appliquée:', operation);
});
```

#### conflictDetected

Déclenché en cas de conflit.

```javascript
collaboration.on('conflictDetected', (conflict) => {
    console.log('Conflit détecté:', conflict);
});
```

## 🔔 NotificationRouter

### Description
Routeur de notifications pour gérer les notifications multi-canaux.

### Constructor

```javascript
new NotificationRouter(config)
```

### Méthodes

#### send(notification)

Envoie une notification.

**Paramètres :**

```typescript
interface Notification {
    type: string;           // Type de notification
    title: string;          // Titre
    message: string;        // Message
    recipients: Array;      // Destinataires
    channels: Array;        // Canaux ('email', 'push', 'in-app')
    priority: string;       // Priorité ('low', 'normal', 'high', 'urgent')
    data?: Object;         // Données supplémentaires
}
```

**Exemple :**

```javascript
const router = new NotificationRouter();

router.send({
    type: 'form_submitted',
    title: 'Nouveau formulaire',
    message: 'Un nouveau formulaire a été soumis',
    recipients: ['admin@example.com'],
    channels: ['email', 'push'],
    priority: 'normal',
    data: {
        formId: 'form-123',
        submittedBy: 'user-456'
    }
});
```

#### subscribe(userId, preferences)

Configure les préférences de notification d'un utilisateur.

**Paramètres :**
- `userId` (string) - ID de l'utilisateur
- `preferences` (Object) - Préférences de notification

**Exemple :**

```javascript
router.subscribe('user-456', {
    email: {
        enabled: true,
        frequency: 'immediate'
    },
    push: {
        enabled: true,
        quiet_hours: { start: '22:00', end: '08:00' }
    },
    in_app: {
        enabled: true
    }
});
```

## 📊 Types et Interfaces

### ValidationResult

```typescript
interface ValidationResult {
    valid: boolean;
    errors: Array<{
        field: string;
        message: string;
        code?: string;
    }>;
    warnings: Array<{
        field: string;
        message: string;
        code?: string;
    }>;
}
```

### SubmitResult

```typescript
interface SubmitResult {
    success: boolean;
    data?: any;
    errors?: Array<string>;
    timestamp: string;
    id?: string;
}
```

### ComponentConfig

```typescript
interface ComponentConfig {
    type: string;
    name: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    value?: any;
    validation?: ValidationConfig;
    attributes?: Object;
    events?: Object;
}
```

### ValidationConfig

```typescript
interface ValidationConfig {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp | string;
    email?: boolean;
    url?: boolean;
    custom?: (value: any) => ValidationResult;
    message?: string;
}
```

## 🔧 Configuration Globale

### FormEaseConfig

Configuration globale pour FormEase.

```javascript
window.FormEaseConfig = {
    // API Configuration
    api: {
        baseUrl: 'https://api.formease.com',
        timeout: 10000,
        retries: 3
    },
    
    // Thème par défaut
    theme: {
        default: 'modern',
        customCSS: '/css/custom-theme.css'
    },
    
    // Sécurité
    security: {
        csrf: true,
        xss: true,
        rateLimit: {
            enabled: true,
            maxRequests: 100,
            windowMs: 60000
        }
    },
    
    // Performance
    performance: {
        lazyLoading: true,
        virtualScrolling: true,
        caching: true
    },
    
    // Collaboration
    collaboration: {
        enabled: false,
        websocketUrl: 'wss://realtime.formease.com'
    },
    
    // Notifications
    notifications: {
        position: 'top-right',
        timeout: 5000,
        sound: true
    }
};
```

## 🚨 Gestion d'Erreurs

### Types d'Erreurs

```javascript
// Erreur de validation
class ValidationError extends Error {
    constructor(message, field, code) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.code = code;
    }
}

// Erreur de sécurité
class SecurityError extends Error {
    constructor(message, type) {
        super(message);
        this.name = 'SecurityError';
        this.type = type;
    }
}

// Erreur de réseau
class NetworkError extends Error {
    constructor(message, status, response) {
        super(message);
        this.name = 'NetworkError';
        this.status = status;
        this.response = response;
    }
}
```

### Gestionnaire d'Erreurs Global

```javascript
// Configuration du gestionnaire d'erreurs
FormEase.onError((error) => {
    console.error('Erreur FormEase:', error);
    
    // Logging vers service externe
    if (window.Sentry) {
        Sentry.captureException(error);
    }
    
    // Notification utilisateur
    FormEase.notify({
        type: 'error',
        message: 'Une erreur est survenue. Veuillez réessayer.',
        timeout: 5000
    });
});
```

## 📞 Support et Ressources

### Liens Utiles
- **Documentation complète** : [docs.formease.com](https://docs.formease.com)
- **Exemples** : [examples.formease.com](https://examples.formease.com)
- **GitHub** : [github.com/jeffkos/form-ease](https://github.com/jeffkos/form-ease)
- **Support** : [support@formease.com](mailto:support@formease.com)

### Changelog API

| Version | Date | Changements |
|---------|------|-------------|
| 4.0.0 | 2025-07-11 | Architecture enterprise complète |
| 3.5.0 | 2025-06-15 | Ajout collaboration temps réel |
| 3.0.0 | 2025-05-01 | Refactoring majeur, nouvelles APIs |

---

**FormEase v4.0** - *Complete API Documentation*
📚 Documentation API complète pour développer avec FormEase !
