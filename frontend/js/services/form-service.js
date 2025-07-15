/**
 * Service Formulaires pour FormEase
 * Connecte le builder et la gestion des formulaires au backend
 */

class FormService {
  constructor() {
    this.baseURL = "http://localhost:3000/api";
    this.token = localStorage.getItem("authToken");
  }

  /**
   * Créer un nouveau formulaire
   * @param {Object} formData - Données du formulaire
   * @returns {Promise<Object>} - Formulaire créé
   */
  async createForm(formData) {
    try {
      const response = await fetch(`${this.baseURL}/forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la création du formulaire:", error);
      throw error;
    }
  }

  /**
   * Mettre à jour un formulaire existant
   * @param {string} formId - ID du formulaire
   * @param {Object} formData - Nouvelles données
   * @returns {Promise<Object>} - Formulaire mis à jour
   */
  async updateForm(formId, formData) {
    try {
      const response = await fetch(`${this.baseURL}/forms/${formId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du formulaire:", error);
      throw error;
    }
  }

  /**
   * Obtenir un formulaire par son ID
   * @param {string} formId - ID du formulaire
   * @returns {Promise<Object>} - Données du formulaire
   */
  async getForm(formId) {
    try {
      const response = await fetch(`${this.baseURL}/forms/${formId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la récupération du formulaire:", error);
      throw error;
    }
  }

  /**
   * Obtenir tous les formulaires de l'utilisateur
   * @param {Object} options - Options de pagination et filtres
   * @returns {Promise<Object>} - Liste des formulaires
   */
  async getForms(options = {}) {
    try {
      const queryParams = new URLSearchParams(options).toString();
      const response = await fetch(`${this.baseURL}/forms?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la récupération des formulaires:", error);
      throw error;
    }
  }

  /**
   * Supprimer un formulaire
   * @param {string} formId - ID du formulaire
   * @returns {Promise<void>}
   */
  async deleteForm(formId) {
    try {
      const response = await fetch(`${this.baseURL}/forms/${formId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du formulaire:", error);
      throw error;
    }
  }

  /**
   * Dupliquer un formulaire
   * @param {string} formId - ID du formulaire à dupliquer
   * @returns {Promise<Object>} - Formulaire dupliqué
   */
  async duplicateForm(formId) {
    try {
      const response = await fetch(
        `${this.baseURL}/forms/${formId}/duplicate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la duplication du formulaire:", error);
      throw error;
    }
  }

  /**
   * Obtenir les soumissions d'un formulaire
   * @param {string} formId - ID du formulaire
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} - Liste des soumissions
   */
  async getFormSubmissions(formId, options = {}) {
    try {
      const queryParams = new URLSearchParams(options).toString();
      const response = await fetch(
        `${this.baseURL}/forms/${formId}/submissions?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la récupération des soumissions:", error);
      throw error;
    }
  }

  /**
   * Générer un QR code pour un formulaire
   * @param {string} formId - ID du formulaire
   * @param {Object} options - Options du QR code
   * @returns {Promise<Object>} - QR code généré
   */
  async generateQRCode(formId, options = {}) {
    try {
      const formUrl = `${window.location.origin}/forms/${formId}`;
      const response = await fetch(`${this.baseURL}/qrcodes/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          formId,
          formUrl,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la génération du QR code:", error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques d'un formulaire
   * @param {string} formId - ID du formulaire
   * @returns {Promise<Object>} - Statistiques du formulaire
   */
  async getFormStats(formId) {
    try {
      const response = await fetch(`${this.baseURL}/forms/${formId}/stats`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      throw error;
    }
  }

  /**
   * Publier/dépublier un formulaire
   * @param {string} formId - ID du formulaire
   * @param {boolean} isPublished - État de publication
   * @returns {Promise<Object>} - Résultat de l'opération
   */
  async toggleFormPublication(formId, isPublished) {
    try {
      const response = await fetch(`${this.baseURL}/forms/${formId}/publish`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ is_published: isPublished }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la publication du formulaire:", error);
      throw error;
    }
  }

  /**
   * Exporter les données d'un formulaire
   * @param {string} formId - ID du formulaire
   * @param {string} format - Format d'export (csv, xlsx, json)
   * @returns {Promise<Blob>} - Fichier exporté
   */
  async exportFormData(formId, format = "csv") {
    try {
      const response = await fetch(
        `${this.baseURL}/forms/${formId}/export?format=${format}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error("Erreur lors de l'export des données:", error);
      throw error;
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
window.formService = new FormService();
