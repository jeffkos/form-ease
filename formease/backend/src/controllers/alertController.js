const alertService = require("../services/alertService");

/**
 * Déclenche une vérification manuelle des alertes
 */
const checkAlerts = async (req, res) => {
  try {
    const result = await alertService.checkAllAlerts();

    res.json({
      success: true,
      data: result,
      message: `Vérification terminée: ${result.count} alerte(s) déclenchée(s)`,
    });
  } catch (error) {
    console.error("Erreur vérification alertes:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification des alertes",
    });
  }
};

/**
 * Obtient l'historique des alertes
 */
const getAlertHistory = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = alertService.getAlertHistory(parseInt(limit));

    res.json({
      success: true,
      data: history,
      total: history.length,
    });
  } catch (error) {
    console.error("Erreur récupération historique alertes:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique",
    });
  }
};

/**
 * Obtient les statistiques des alertes
 */
const getAlertStats = async (req, res) => {
  try {
    const stats = alertService.getAlertStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Erreur récupération stats alertes:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    });
  }
};

/**
 * Résout une alerte
 */
const resolveAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    alertService.resolveAlert(alertId);

    res.json({
      success: true,
      message: "Alerte résolue avec succès",
    });
  } catch (error) {
    console.error("Erreur résolution alerte:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la résolution de l'alerte",
    });
  }
};

/**
 * Obtient les règles d'alerte configurées
 */
const getAlertRules = async (req, res) => {
  try {
    const rules = alertService.alertRules;

    res.json({
      success: true,
      data: rules,
      total: rules.length,
    });
  } catch (error) {
    console.error("Erreur récupération règles alertes:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des règles",
    });
  }
};

/**
 * Met à jour une règle d'alerte
 */
const updateAlertRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    const ruleIndex = alertService.alertRules.findIndex((r) => r.id === ruleId);

    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Règle d'alerte non trouvée",
      });
    }

    // Mettre à jour la règle
    alertService.alertRules[ruleIndex] = {
      ...alertService.alertRules[ruleIndex],
      ...updates,
    };

    res.json({
      success: true,
      data: alertService.alertRules[ruleIndex],
      message: "Règle mise à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur mise à jour règle alerte:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la règle",
    });
  }
};

/**
 * Active/désactive une règle d'alerte
 */
const toggleAlertRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const { enabled } = req.body;

    const ruleIndex = alertService.alertRules.findIndex((r) => r.id === ruleId);

    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Règle d'alerte non trouvée",
      });
    }

    alertService.alertRules[ruleIndex].enabled = enabled;

    res.json({
      success: true,
      data: alertService.alertRules[ruleIndex],
      message: `Règle ${enabled ? "activée" : "désactivée"} avec succès`,
    });
  } catch (error) {
    console.error("Erreur toggle règle alerte:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du changement d'état de la règle",
    });
  }
};

/**
 * Teste l'envoi d'une alerte
 */
const testAlert = async (req, res) => {
  try {
    const { type = "test", severity = "warning" } = req.body;

    const testAlert = {
      id: `test_${Date.now()}`,
      ruleId: "test_rule",
      name: "Test d'alerte",
      type: type,
      severity: severity,
      value: 99,
      threshold: 50,
      comparison: "greater",
      message:
        "Ceci est un test d'alerte pour vérifier le système de notifications",
      context: { test: true },
      timestamp: new Date(),
      resolved: false,
    };

    await alertService.processAlerts([testAlert]);

    res.json({
      success: true,
      data: testAlert,
      message: "Alerte de test envoyée avec succès",
    });
  } catch (error) {
    console.error("Erreur test alerte:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du test d'alerte",
    });
  }
};

/**
 * Obtient la configuration des canaux de notification
 */
const getNotificationChannels = async (req, res) => {
  try {
    const channels = {
      email: {
        enabled: alertService.notificationChannels.email.enabled,
        configured: !!process.env.ALERT_EMAIL_TO,
      },
      webhook: {
        enabled: alertService.notificationChannels.webhook.enabled,
        configured: !!process.env.ALERT_WEBHOOK_URL,
      },
      sms: {
        enabled: alertService.notificationChannels.sms.enabled,
        configured: false,
      },
    };

    res.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    console.error("Erreur récupération canaux notification:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des canaux",
    });
  }
};

module.exports = {
  checkAlerts,
  getAlertHistory,
  getAlertStats,
  resolveAlert,
  getAlertRules,
  updateAlertRule,
  toggleAlertRule,
  testAlert,
  getNotificationChannels,
};
