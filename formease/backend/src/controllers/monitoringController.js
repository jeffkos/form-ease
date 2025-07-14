const monitoringService = require("../services/monitoringService");
const { authenticateToken, requireRole } = require("../middleware/auth");

/**
 * Obtient les métriques de conversion
 */
const getConversionMetrics = async (req, res) => {
  try {
    const { timeframe = 30 } = req.query;
    const metrics = await monitoringService.getConversionMetrics(
      parseInt(timeframe)
    );

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Erreur récupération métriques conversion:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des métriques de conversion",
    });
  }
};

/**
 * Obtient les métriques de churn
 */
const getChurnMetrics = async (req, res) => {
  try {
    const { timeframe = 30 } = req.query;
    const metrics = await monitoringService.getChurnMetrics(
      parseInt(timeframe)
    );

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Erreur récupération métriques churn:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des métriques de churn",
    });
  }
};

/**
 * Obtient les métriques LTV
 */
const getLTVMetrics = async (req, res) => {
  try {
    const metrics = await monitoringService.getLTVMetrics();

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Erreur récupération métriques LTV:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des métriques LTV",
    });
  }
};

/**
 * Obtient les métriques de revenus
 */
const getRevenueMetrics = async (req, res) => {
  try {
    const metrics = await monitoringService.getRevenueMetrics();

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Erreur récupération métriques revenus:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des métriques de revenus",
    });
  }
};

/**
 * Obtient les métriques d'engagement
 */
const getEngagementMetrics = async (req, res) => {
  try {
    const { timeframe = 30 } = req.query;
    const metrics = await monitoringService.getEngagementMetrics(
      parseInt(timeframe)
    );

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Erreur récupération métriques engagement:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des métriques d'engagement",
    });
  }
};

/**
 * Obtient le rapport complet des métriques business
 */
const getBusinessMetricsReport = async (req, res) => {
  try {
    const { timeframe = 30 } = req.query;
    const report = await monitoringService.getBusinessMetricsReport(
      parseInt(timeframe)
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Erreur génération rapport business:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du rapport business",
    });
  }
};

/**
 * Vérifie les alertes business
 */
const checkAlerts = async (req, res) => {
  try {
    const alerts = await monitoringService.checkAlerts();

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        timestamp: new Date(),
      },
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
 * Obtient un dashboard de monitoring complet
 */
const getMonitoringDashboard = async (req, res) => {
  try {
    const { timeframe = 30 } = req.query;

    // Récupération parallèle de toutes les métriques
    const [businessReport, alerts] = await Promise.all([
      monitoringService.getBusinessMetricsReport(parseInt(timeframe)),
      monitoringService.checkAlerts(),
    ]);

    const dashboard = {
      timestamp: new Date(),
      timeframe: parseInt(timeframe),
      business_metrics: businessReport,
      alerts: {
        active: alerts,
        count: alerts.length,
        critical_count: alerts.filter((a) => a.level === "critical").length,
        warning_count: alerts.filter((a) => a.level === "warning").length,
      },
      status: {
        health_score: businessReport.summary.health_score,
        status:
          businessReport.summary.health_score >= 70
            ? "healthy"
            : businessReport.summary.health_score >= 50
            ? "warning"
            : "critical",
      },
    };

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error("Erreur génération dashboard monitoring:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du dashboard de monitoring",
    });
  }
};

/**
 * Obtient les métriques de performance système
 */
const getSystemMetrics = async (req, res) => {
  try {
    const os = require("os");
    const process = require("process");

    // Métriques système
    const systemMetrics = {
      timestamp: new Date(),
      server: {
        uptime: process.uptime(),
        memory: {
          used: process.memoryUsage(),
          total: os.totalmem(),
          free: os.freemem(),
        },
        cpu: {
          usage: process.cpuUsage(),
          load: os.loadavg(),
        },
      },
      nodejs: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    res.json({
      success: true,
      data: systemMetrics,
    });
  } catch (error) {
    console.error("Erreur récupération métriques système:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des métriques système",
    });
  }
};

module.exports = {
  getConversionMetrics,
  getChurnMetrics,
  getLTVMetrics,
  getRevenueMetrics,
  getEngagementMetrics,
  getBusinessMetricsReport,
  checkAlerts,
  getMonitoringDashboard,
  getSystemMetrics,
};
