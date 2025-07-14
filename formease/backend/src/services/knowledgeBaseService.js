const { PrismaClient } = require("@prisma/client");
const winston = require("winston");

const prisma = new PrismaClient();
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/knowledge-base.log" }),
    new winston.transports.Console(),
  ],
});

class KnowledgeBaseService {
  constructor() {
    this.categories = [
      {
        id: "getting-started",
        name: "Premiers pas",
        description: "Guide pour débuter avec FormEase",
        icon: "🚀",
        order: 1,
      },
      {
        id: "forms",
        name: "Gestion des formulaires",
        description: "Création et configuration des formulaires",
        icon: "📝",
        order: 2,
      },
      {
        id: "payments",
        name: "Paiements",
        description: "Configuration des formulaires payants",
        icon: "💳",
        order: 3,
      },
      {
        id: "analytics",
        name: "Analytics",
        description: "Comprendre vos statistiques",
        icon: "📊",
        order: 4,
      },
      {
        id: "marketing",
        name: "Marketing",
        description: "Campagnes et automation",
        icon: "📧",
        order: 5,
      },
      {
        id: "troubleshooting",
        name: "Dépannage",
        description: "Solutions aux problèmes courants",
        icon: "🔧",
        order: 6,
      },
      {
        id: "api",
        name: "API",
        description: "Documentation technique",
        icon: "⚙️",
        order: 7,
      },
    ];

    this.articles = [
      // Getting Started
      {
        id: "welcome",
        title: "Bienvenue sur FormEase",
        slug: "bienvenue-sur-formease",
        category: "getting-started",
        content: `
# Bienvenue sur FormEase

FormEase est une plateforme complète de création et gestion de formulaires intelligents.

## Fonctionnalités principales

- **Création de formulaires** : Interface intuitive avec glisser-déposer
- **Formulaires payants** : Intégration Stripe pour monétiser vos formulaires
- **Analytics avancées** : Suivi des performances et métriques détaillées
- **Marketing automation** : Campagnes email et automation
- **Gestion des contacts** : Base de données centralisée

## Premiers pas

1. Créez votre premier formulaire
2. Configurez les notifications
3. Partagez votre formulaire
4. Analysez les résultats

Pour commencer, consultez le guide "Créer votre premier formulaire".
        `,
        tags: ["débutant", "introduction", "guide"],
        published: true,
        featured: true,
        views: 0,
        helpful: 0,
        notHelpful: 0,
        lastUpdated: new Date(),
        author: "FormEase Team",
      },
      {
        id: "first-form",
        title: "Créer votre premier formulaire",
        slug: "creer-votre-premier-formulaire",
        category: "getting-started",
        content: `
# Créer votre premier formulaire

Ce guide vous accompagne dans la création de votre premier formulaire sur FormEase.

## Étape 1 : Accéder au créateur

1. Connectez-vous à votre compte FormEase
2. Cliquez sur "Nouveau formulaire" dans le dashboard
3. Choisissez un template ou partez de zéro

## Étape 2 : Configurer les champs

### Types de champs disponibles :
- **Texte** : Saisie libre
- **Email** : Validation automatique
- **Téléphone** : Format international
- **Choix multiple** : Cases à cocher
- **Sélection** : Menu déroulant
- **Fichier** : Upload de documents

### Conseils :
- Utilisez des labels clairs
- Rendez obligatoires uniquement les champs essentiels
- Ajoutez des descriptions d'aide si nécessaire

## Étape 3 : Personnaliser l'apparence

- Choisissez un thème
- Personnalisez les couleurs
- Ajoutez votre logo
- Configurez le message de confirmation

## Étape 4 : Publier et partager

1. Cliquez sur "Publier"
2. Copiez le lien de partage
3. Intégrez le formulaire sur votre site
4. Partagez sur les réseaux sociaux

Votre formulaire est maintenant prêt à recevoir des réponses !
        `,
        tags: ["formulaire", "création", "guide", "débutant"],
        published: true,
        featured: true,
        views: 0,
        helpful: 0,
        notHelpful: 0,
        lastUpdated: new Date(),
        author: "FormEase Team",
      },
      // Forms
      {
        id: "form-settings",
        title: "Configuration avancée des formulaires",
        slug: "configuration-avancee-formulaires",
        category: "forms",
        content: `
# Configuration avancée des formulaires

Explorez les options avancées pour optimiser vos formulaires.

## Paramètres généraux

### Limitations
- **Nombre de réponses** : Limitez le nombre de soumissions
- **Période active** : Définissez une date de fin
- **Géolocalisation** : Restreignez par pays/région

### Notifications
- **Email admin** : Recevez chaque nouvelle réponse
- **Auto-répondeur** : Message automatique aux utilisateurs
- **Webhooks** : Intégration avec vos outils

## Validation des données

### Règles de validation
- **Champs obligatoires** : Marquez les champs essentiels
- **Formats personnalisés** : Regex pour validation spécifique
- **Limites de caractères** : Min/max pour les textes

### Protection anti-spam
- **Captcha** : Protection automatique
- **Honeypot** : Piège invisible pour les bots
- **Rate limiting** : Limite de soumissions par IP

## Logique conditionnelle

### Affichage conditionnel
- Montrer/cacher des champs selon les réponses
- Créer des parcours personnalisés
- Adapter le formulaire au contexte

### Calculs automatiques
- Sommes et totaux
- Pourcentages
- Formules personnalisées

## Intégrations

### CRM
- Synchronisation automatique des contacts
- Mapping des champs
- Déduplication

### Email marketing
- Ajout automatique aux listes
- Segmentation par réponses
- Déclenchement de campagnes

Pour des besoins spécifiques, contactez notre support technique.
        `,
        tags: ["formulaire", "configuration", "avancé", "validation"],
        published: true,
        featured: false,
        views: 0,
        helpful: 0,
        notHelpful: 0,
        lastUpdated: new Date(),
        author: "FormEase Team",
      },
      // Payments
      {
        id: "payment-forms",
        title: "Créer des formulaires payants",
        slug: "creer-formulaires-payants",
        category: "payments",
        content: `
# Créer des formulaires payants

Monétisez vos formulaires avec l'intégration Stripe.

## Prérequis

### Compte Stripe
1. Créez un compte sur stripe.com
2. Complétez la vérification de votre identité
3. Configurez vos méthodes de paiement

### Configuration FormEase
1. Accédez aux paramètres de paiement
2. Connectez votre compte Stripe
3. Configurez les webhooks

## Types de formulaires payants

### Paiement unique
- Inscription à un événement
- Achat de produit
- Donation

### Abonnement
- Adhésion mensuelle
- Service récurrent
- Accès premium

### Paiement conditionnel
- Montant variable selon les réponses
- Suppléments optionnels
- Remises automatiques

## Configuration du paiement

### Informations requises
- **Montant** : Prix fixe ou calculé
- **Devise** : EUR, USD, etc.
- **Description** : Texte sur la facture
- **Métadonnées** : Informations supplémentaires

### Options avancées
- **Essai gratuit** : Période d'essai pour les abonnements
- **Coupons** : Codes de réduction
- **Taxes** : Calcul automatique selon la localisation

## Gestion des paiements

### Suivi des transactions
- Dashboard des paiements
- Statut des transactions
- Historique complet

### Gestion des échecs
- Retry automatique
- Notifications d'échec
- Relance des paiements

### Remboursements
- Remboursement partiel ou total
- Gestion des litiges
- Historique des remboursements

## Conformité et sécurité

### PCI DSS
- Conformité automatique
- Données sécurisées
- Audit régulier

### RGPD
- Consentement explicite
- Droit à l'oubli
- Portabilité des données

Pour plus d'informations sur la configuration Stripe, consultez notre guide technique.
        `,
        tags: ["paiement", "stripe", "monétisation", "abonnement"],
        published: true,
        featured: true,
        views: 0,
        helpful: 0,
        notHelpful: 0,
        lastUpdated: new Date(),
        author: "FormEase Team",
      },
      // Troubleshooting
      {
        id: "common-issues",
        title: "Problèmes courants et solutions",
        slug: "problemes-courants-solutions",
        category: "troubleshooting",
        content: `
# Problèmes courants et solutions

Solutions aux problèmes les plus fréquents sur FormEase.

## Formulaires

### Le formulaire ne s'affiche pas
**Causes possibles :**
- Formulaire non publié
- Restrictions géographiques
- Problème de cache

**Solutions :**
1. Vérifiez que le formulaire est publié
2. Contrôlez les paramètres de géolocalisation
3. Videz le cache de votre navigateur
4. Testez en navigation privée

### Les réponses ne sont pas reçues
**Causes possibles :**
- Problème de configuration email
- Filtre anti-spam
- Quota dépassé

**Solutions :**
1. Vérifiez les paramètres de notification
2. Contrôlez vos dossiers spam
3. Vérifiez votre quota de formulaires
4. Contactez le support si le problème persiste

## Paiements

### Paiement échoué
**Causes possibles :**
- Carte expirée ou invalide
- Fonds insuffisants
- Problème de configuration Stripe

**Solutions :**
1. Vérifiez les informations de la carte
2. Contactez votre banque
3. Essayez une autre méthode de paiement
4. Vérifiez la configuration Stripe

### Webhook non reçu
**Causes possibles :**
- URL de webhook incorrecte
- Problème de réseau
- Signature invalide

**Solutions :**
1. Vérifiez l'URL dans les paramètres Stripe
2. Testez la connectivité
3. Régénérez la clé secrète
4. Consultez les logs Stripe

## Analytics

### Données manquantes
**Causes possibles :**
- Filtre de date incorrect
- Problème de synchronisation
- Permissions insuffisantes

**Solutions :**
1. Ajustez les filtres de date
2. Actualisez les données
3. Vérifiez vos permissions
4. Contactez l'administrateur

## Performance

### Chargement lent
**Causes possibles :**
- Connexion internet lente
- Trop de champs dans le formulaire
- Problème de serveur

**Solutions :**
1. Vérifiez votre connexion
2. Simplifiez le formulaire
3. Optimisez les images
4. Contactez le support technique

## Obtenir de l'aide

Si ces solutions ne résolvent pas votre problème :

1. **Documentation** : Consultez notre base de connaissances
2. **Support** : Créez un ticket de support
3. **Communauté** : Posez votre question sur le forum
4. **Contact direct** : support@formease.com

Notre équipe est disponible 24/7 pour vous aider !
        `,
        tags: ["dépannage", "problème", "solution", "support"],
        published: true,
        featured: true,
        views: 0,
        helpful: 0,
        notHelpful: 0,
        lastUpdated: new Date(),
        author: "FormEase Support",
      },
    ];
  }

  /**
   * Obtient toutes les catégories
   */
  getCategories() {
    return this.categories.sort((a, b) => a.order - b.order);
  }

  /**
   * Obtient une catégorie par ID
   */
  getCategoryById(categoryId) {
    return this.categories.find((cat) => cat.id === categoryId);
  }

  /**
   * Obtient tous les articles
   */
  getArticles(options = {}) {
    const {
      category,
      published = true,
      featured,
      limit,
      offset = 0,
      search,
    } = options;

    let articles = [...this.articles];

    // Filtrer par statut publié
    if (published !== undefined) {
      articles = articles.filter((article) => article.published === published);
    }

    // Filtrer par catégorie
    if (category) {
      articles = articles.filter((article) => article.category === category);
    }

    // Filtrer par featured
    if (featured !== undefined) {
      articles = articles.filter((article) => article.featured === featured);
    }

    // Recherche textuelle
    if (search) {
      const searchLower = search.toLowerCase();
      articles = articles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.content.toLowerCase().includes(searchLower) ||
          article.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Trier par date de mise à jour (plus récent en premier)
    articles.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

    // Pagination
    const total = articles.length;
    if (limit) {
      articles = articles.slice(offset, offset + limit);
    }

    return {
      articles,
      total,
      offset,
      limit,
    };
  }

  /**
   * Obtient un article par ID ou slug
   */
  getArticle(identifier) {
    const article = this.articles.find(
      (a) => a.id === identifier || a.slug === identifier
    );

    if (article) {
      // Incrémenter le compteur de vues
      article.views++;
      logger.info(`Article consulté: ${article.title}`, {
        id: article.id,
        views: article.views,
      });
    }

    return article;
  }

  /**
   * Recherche dans les articles
   */
  searchArticles(query, options = {}) {
    const { category, limit = 10 } = options;

    if (!query || query.trim().length < 2) {
      return { articles: [], total: 0, query };
    }

    const searchTerms = query
      .toLowerCase()
      .split(" ")
      .filter((term) => term.length > 1);
    let articles = [...this.articles].filter((article) => article.published);

    // Filtrer par catégorie si spécifiée
    if (category) {
      articles = articles.filter((article) => article.category === category);
    }

    // Calculer le score de pertinence pour chaque article
    const scoredArticles = articles.map((article) => {
      let score = 0;
      const titleLower = article.title.toLowerCase();
      const contentLower = article.content.toLowerCase();
      const tagsLower = article.tags.join(" ").toLowerCase();

      searchTerms.forEach((term) => {
        // Score pour le titre (poids 3)
        if (titleLower.includes(term)) {
          score += 3;
        }

        // Score pour les tags (poids 2)
        if (tagsLower.includes(term)) {
          score += 2;
        }

        // Score pour le contenu (poids 1)
        if (contentLower.includes(term)) {
          score += 1;
        }

        // Bonus pour correspondance exacte dans le titre
        if (titleLower === term) {
          score += 5;
        }
      });

      return { ...article, score };
    });

    // Filtrer les articles avec un score > 0 et trier par score décroissant
    const relevantArticles = scoredArticles
      .filter((article) => article.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    logger.info(`Recherche effectuée: "${query}"`, {
      results: relevantArticles.length,
      query,
    });

    return {
      articles: relevantArticles,
      total: relevantArticles.length,
      query,
    };
  }

  /**
   * Obtient les articles populaires
   */
  getPopularArticles(limit = 5) {
    return this.articles
      .filter((article) => article.published)
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  /**
   * Obtient les articles en vedette
   */
  getFeaturedArticles(limit = 3) {
    return this.articles
      .filter((article) => article.published && article.featured)
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
      .slice(0, limit);
  }

  /**
   * Obtient les articles récents
   */
  getRecentArticles(limit = 5) {
    return this.articles
      .filter((article) => article.published)
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
      .slice(0, limit);
  }

  /**
   * Obtient les articles liés
   */
  getRelatedArticles(articleId, limit = 3) {
    const article = this.getArticle(articleId);
    if (!article) return [];

    // Trouver des articles de la même catégorie avec des tags similaires
    const relatedArticles = this.articles
      .filter(
        (a) =>
          a.id !== articleId &&
          a.published &&
          (a.category === article.category ||
            a.tags.some((tag) => article.tags.includes(tag)))
      )
      .sort((a, b) => {
        // Calculer la similarité basée sur les tags communs
        const commonTagsA = a.tags.filter((tag) =>
          article.tags.includes(tag)
        ).length;
        const commonTagsB = b.tags.filter((tag) =>
          article.tags.includes(tag)
        ).length;
        return commonTagsB - commonTagsA;
      })
      .slice(0, limit);

    return relatedArticles;
  }

  /**
   * Marque un article comme utile
   */
  markArticleHelpful(articleId, helpful = true) {
    const article = this.articles.find((a) => a.id === articleId);
    if (article) {
      if (helpful) {
        article.helpful++;
      } else {
        article.notHelpful++;
      }

      logger.info(`Article marqué comme ${helpful ? "utile" : "non utile"}`, {
        id: articleId,
        helpful: article.helpful,
        notHelpful: article.notHelpful,
      });

      return {
        helpful: article.helpful,
        notHelpful: article.notHelpful,
        total: article.helpful + article.notHelpful,
      };
    }

    return null;
  }

  /**
   * Obtient les statistiques de la base de connaissances
   */
  getStats() {
    const totalArticles = this.articles.length;
    const publishedArticles = this.articles.filter((a) => a.published).length;
    const totalViews = this.articles.reduce((sum, a) => sum + a.views, 0);
    const totalHelpful = this.articles.reduce((sum, a) => sum + a.helpful, 0);
    const totalNotHelpful = this.articles.reduce(
      (sum, a) => sum + a.notHelpful,
      0
    );

    const categoryStats = this.categories.map((category) => {
      const categoryArticles = this.articles.filter(
        (a) => a.category === category.id
      );
      return {
        ...category,
        articleCount: categoryArticles.length,
        publishedCount: categoryArticles.filter((a) => a.published).length,
        totalViews: categoryArticles.reduce((sum, a) => sum + a.views, 0),
      };
    });

    return {
      totalArticles,
      publishedArticles,
      totalViews,
      totalHelpful,
      totalNotHelpful,
      helpfulRatio:
        totalHelpful + totalNotHelpful > 0
          ? (totalHelpful / (totalHelpful + totalNotHelpful)) * 100
          : 0,
      categories: categoryStats,
      mostViewedArticles: this.getPopularArticles(5),
      recentArticles: this.getRecentArticles(5),
    };
  }
}

module.exports = new KnowledgeBaseService();
