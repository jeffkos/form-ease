/**
 * Service Dashboard pour FormEase
 * Connecte le dashboard au backend avec données personnalisées par utilisateur
 */

class DashboardService {
  constructor() {
    this.baseURL = "http://localhost:3000/api";
    this.token = localStorage.getItem("authToken");
  }

  /**
   * Obtenir les statistiques du dashboard
   * @returns {Promise<Object>} - Statistiques du dashboard
   */
  async getDashboardStats() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      // Retourner des données par défaut en cas d'erreur
      return {
        totalForms: 0,
        totalResponses: 0,
        totalUsers: 1,
        conversionRate: 0,
        formsChange: "+0%",
        responsesChange: "+0%",
        usersChange: "+0%",
        conversionChange: "+0%",
      };
    }
  }

  /**
   * Obtenir les formulaires récents
   * @returns {Promise<Array>} - Liste des formulaires récents
   */
  async getRecentForms() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard/recent-forms`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des formulaires récents:",
        error
      );
      return [];
    }
  }

  /**
   * Obtenir l'activité récente
   * @returns {Promise<Array>} - Liste des activités récentes
   */
  async getRecentActivity() {
    try {
      const response = await fetch(
        `${this.baseURL}/dashboard/recent-activity`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'activité récente:",
        error
      );
      return [];
    }
  }

  /**
   * Obtenir les données pour les graphiques
   * @param {string} type - Type de graphique (responses, forms)
   * @returns {Promise<Array>} - Données du graphique
   */
  async getChartData(type) {
    try {
      const response = await fetch(
        `${this.baseURL}/dashboard/chart-data?type=${type}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données de graphique:",
        error
      );
      return [];
    }
  }

  /**
   * Obtenir les informations du profil utilisateur
   * @returns {Promise<Object>} - Informations utilisateur
   */
  async getUserProfile() {
    try {
      const response = await fetch(`${this.baseURL}/profile`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result.user;
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      return {
        first_name: "Utilisateur",
        last_name: "",
        email: "",
        plan: "free",
      };
    }
  }

  /**
   * Obtenir les analytics détaillées
   * @returns {Promise<Object>} - Analytics détaillées
   */
  async getAnalytics() {
    try {
      const response = await fetch(`${this.baseURL}/analytics`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result.analytics;
    } catch (error) {
      console.error("Erreur lors de la récupération des analytics:", error);
      return {
        totalViews: 0,
        totalSubmissions: 0,
        conversionRate: 0,
        topForms: [],
        chartData: [],
      };
    }
  }

  /**
   * Obtenir les notifications de l'utilisateur
   * @returns {Promise<Array>} - Liste des notifications
   */
  async getNotifications() {
    try {
      const response = await fetch(`${this.baseURL}/notifications`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        // Si l'endpoint n'existe pas, retourner des notifications par défaut
        return [
          {
            id: 1,
            title: "Bienvenue sur FormEase",
            message: "Découvrez toutes les fonctionnalités de FormEase",
            type: "info",
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ];
      }

      const result = await response.json();
      return result.notifications || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
      return [];
    }
  }

  /**
   * Marquer une notification comme lue
   * @param {number} notificationId - ID de la notification
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async markNotificationAsRead(notificationId) {
    try {
      const response = await fetch(
        `${this.baseURL}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la notification:", error);
      return false;
    }
  }

  /**
   * Obtenir les limites du plan utilisateur
   * @returns {Promise<Object>} - Limites du plan
   */
  async getPlanLimits() {
    try {
      const response = await fetch(`${this.baseURL}/subscription/usage`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result.usage;
    } catch (error) {
      console.error("Erreur lors de la récupération des limites:", error);
      return {
        plan: "free",
        limits: {
          forms: { used: 0, limit: 10 },
          submissions: { used: 0, limit: 100 },
          storage: { used: 0, limit: 1000 },
        },
      };
    }
  }

  /**
   * Rechercher dans les formulaires
   * @param {string} query - Terme de recherche
   * @returns {Promise<Array>} - Résultats de recherche
   */
  async searchForms(query) {
    try {
      const response = await fetch(
        `${this.baseURL}/forms/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result.forms || [];
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      return [];
    }
  }

  /**
   * Obtenir les tendances et insights
   * @returns {Promise<Object>} - Tendances et insights
   */
  async getInsights() {
    try {
      const response = await fetch(`${this.baseURL}/analytics/insights`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result.insights;
    } catch (error) {
      console.error("Erreur lors de la récupération des insights:", error);
      return {
        trends: [],
        recommendations: [],
        performance: {},
      };
    }
  }

  /**
   * Valider le token d'authentification
   * @returns {boolean} - Token valide ou non
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Rediriger vers la page de connexion si non authentifié
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = "/login";
      return false;
    }
    return true;
  }

  /**
   * Formater les données pour les graphiques
   * @param {Array} data - Données brutes
   * @param {string} type - Type de formatage
   * @returns {Array} - Données formatées
   */
  formatChartData(data, type) {
    if (!Array.isArray(data)) return [];

    switch (type) {
      case "line":
        return data.map((item) => ({
          x: item.date || item.label,
          y: item.value || item.count,
        }));
      case "bar":
        return data.map((item) => ({
          label: item.status || item.category,
          value: item.count || item.value,
        }));
      case "pie":
        return data.map((item) => ({
          name: item.status || item.category,
          value: item.count || item.value,
        }));
      default:
        return data;
    }
  }

  /**
   * Calculer les pourcentages de changement
   * @param {number} current - Valeur actuelle
   * @param {number} previous - Valeur précédente
   * @returns {string} - Pourcentage formaté
   */
  calculateChangePercentage(current, previous) {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  }

  /**
   * Formater les dates pour l'affichage
   * @param {string} dateString - Date au format ISO
   * @returns {string} - Date formatée
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  /**
   * Formater les dates relatives (il y a X temps)
   * @param {string} dateString - Date au format ISO
   * @returns {string} - Date relative formatée
   */
  formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return `il y a ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `il y a ${diffInHours}h`;
    } else if (diffInDays < 7) {
      return `il y a ${diffInDays}j`;
    } else {
      return this.formatDate(dateString);
    }
  }
}

// Instance globale
window.dashboardService = new DashboardService();
