/**
 * Service AI pour FormEase
 * Connecte la page AI generator au backend
 */

class AIService {
  constructor() {
    this.baseURL = "http://localhost:3000/api";
    this.token = localStorage.getItem("authToken");
  }

  /**
   * Générer un formulaire avec l'IA
   * @param {string} prompt - Description du formulaire souhaité
   * @returns {Promise<Object>} - Formulaire généré
   */
  async generateForm(prompt) {
    try {
      const response = await fetch(`${this.baseURL}/ai/generate-form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la génération du formulaire:", error);
      throw error;
    }
  }

  /**
   * Sauvegarder un formulaire généré
   * @param {Object} formData - Données du formulaire
   * @returns {Promise<Object>} - Formulaire sauvegardé
   */
  async saveGeneratedForm(formData) {
    try {
      const response = await fetch(`${this.baseURL}/forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          fields: formData.fields,
          settings: {
            theme: formData.theme || "default",
            source: "ai-generator",
            metadata: formData.metadata,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      throw error;
    }
  }

  /**
   * Obtenir les formulaires sauvegardés de l'utilisateur
   * @returns {Promise<Array>} - Liste des formulaires
   */
  async getSavedForms() {
    try {
      const response = await fetch(`${this.baseURL}/forms`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data.forms || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des formulaires:", error);
      return [];
    }
  }

  /**
   * Obtenir les statistiques d'utilisation de l'IA
   * @returns {Promise<Object>} - Statistiques
   */
  async getAIUsageStats() {
    try {
      const response = await fetch(`${this.baseURL}/ai/usage-stats`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        // Retourner des stats par défaut si l'endpoint n'existe pas
        return {
          formsGenerated: 0,
          monthlyLimit: 50,
          remainingGenerations: 50,
        };
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la récupération des stats:", error);
      return {
        formsGenerated: 0,
        monthlyLimit: 50,
        remainingGenerations: 50,
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
}

// Instance globale
window.aiService = new AIService();
