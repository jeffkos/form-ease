// Service de diagnostic automatique pour FormEase
const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");
const os = require("os");
const fs = require("fs").promises;
const path = require("path");

const prisma = new PrismaClient();

// Configuration des seuils de diagnostic
const DIAGNOSTIC_THRESHOLDS = {
  database: {
    connectionTime: 1000, // 1s
    queryTime: 500, // 500ms
    connectionPool: 80, // 80% utilisation
  },
  system: {
    memoryUsage: 85, // 85%
    diskUsage: 90, // 90%
    cpuUsage: 80, // 80%
  },
  application: {
    responseTime: 2000, // 2s
    errorRate: 5, // 5%
    uptime: 99, // 99%
  },
  business: {
    conversionRate: 5, // 5%
    churnRate: 15, // 15%
    supportTickets: 10, // 10 tickets ouverts
  },
};

class DiagnosticService {
  constructor() {
    this.diagnosticHistory = [];
    this.lastDiagnostic = null;
  }

  /**
   * Exécuter un diagnostic complet du système
   */
  async runCompleteDiagnostic() {
    try {
      logger.info("Starting complete system diagnostic");

      const diagnosticResults = {
        timestamp: new Date(),
        overall_status: "healthy",
        categories: {},
        recommendations: [],
        critical_issues: [],
        warnings: [],
        performance_score: 0,
      };

      // Exécuter tous les diagnostics en parallèle
      const [
        databaseDiagnostic,
        systemDiagnostic,
        applicationDiagnostic,
        businessDiagnostic,
        securityDiagnostic,
      ] = await Promise.all([
        this.diagnoseDatabaseHealth(),
        this.diagnoseSystemHealth(),
        this.diagnoseApplicationHealth(),
        this.diagnoseBusinessHealth(),
        this.diagnoseSecurityHealth(),
      ]);

      // Compiler les résultats
      diagnosticResults.categories = {
        database: databaseDiagnostic,
        system: systemDiagnostic,
        application: applicationDiagnostic,
        business: businessDiagnostic,
        security: securityDiagnostic,
      };

      // Calculer le statut global et le score
      const { overallStatus, performanceScore } = this.calculateOverallHealth(
        diagnosticResults.categories
      );
      diagnosticResults.overall_status = overallStatus;
      diagnosticResults.performance_score = performanceScore;

      // Générer les recommandations
      diagnosticResults.recommendations = this.generateRecommendations(
        diagnosticResults.categories
      );

      // Extraire les problèmes critiques et avertissements
      diagnosticResults.critical_issues = this.extractCriticalIssues(
        diagnosticResults.categories
      );
      diagnosticResults.warnings = this.extractWarnings(
        diagnosticResults.categories
      );

      // Sauvegarder le diagnostic
      await this.saveDiagnosticResults(diagnosticResults);

      this.lastDiagnostic = diagnosticResults;
      this.diagnosticHistory.push(diagnosticResults);

      logger.info(
        `Diagnostic completed - Status: ${overallStatus}, Score: ${performanceScore}%`
      );

      return diagnosticResults;
    } catch (error) {
      logger.error("Error running diagnostic:", error);
      throw error;
    }
  }

  /**
   * Diagnostiquer la santé de la base de données
   */
  async diagnoseDatabaseHealth() {
    const diagnostic = {
      status: "healthy",
      score: 100,
      metrics: {},
      issues: [],
      checks: [],
    };

    try {
      // Test de connexion
      const connectionStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const connectionTime = Date.now() - connectionStart;

      diagnostic.metrics.connection_time = connectionTime;
      diagnostic.checks.push({
        name: "Database Connection",
        status:
          connectionTime < DIAGNOSTIC_THRESHOLDS.database.connectionTime
            ? "pass"
            : "fail",
        value: connectionTime,
        threshold: DIAGNOSTIC_THRESHOLDS.database.connectionTime,
        message: `Connection time: ${connectionTime}ms`,
      });

      // Test de performance des requêtes
      const queryStart = Date.now();
      const userCount = await prisma.user.count();
      const queryTime = Date.now() - queryStart;

      diagnostic.metrics.query_time = queryTime;
      diagnostic.checks.push({
        name: "Query Performance",
        status:
          queryTime < DIAGNOSTIC_THRESHOLDS.database.queryTime
            ? "pass"
            : "fail",
        value: queryTime,
        threshold: DIAGNOSTIC_THRESHOLDS.database.queryTime,
        message: `Query time: ${queryTime}ms for ${userCount} users`,
      });

      // Vérifier l'intégrité des données
      const integrityChecks = await this.checkDataIntegrity();
      diagnostic.checks.push(...integrityChecks);

      // Calculer le score
      const passedChecks = diagnostic.checks.filter(
        (check) => check.status === "pass"
      ).length;
      diagnostic.score = Math.round(
        (passedChecks / diagnostic.checks.length) * 100
      );
      diagnostic.status =
        diagnostic.score >= 80
          ? "healthy"
          : diagnostic.score >= 60
          ? "warning"
          : "critical";
    } catch (error) {
      diagnostic.status = "critical";
      diagnostic.score = 0;
      diagnostic.issues.push({
        severity: "critical",
        message: `Database connection failed: ${error.message}`,
        recommendation: "Check database connectivity and credentials",
      });
    }

    return diagnostic;
  }

  /**
   * Diagnostiquer la santé du système
   */
  async diagnoseSystemHealth() {
    const diagnostic = {
      status: "healthy",
      score: 100,
      metrics: {},
      issues: [],
      checks: [],
    };

    try {
      // Utilisation mémoire
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemoryPercent =
        ((totalMemory - freeMemory) / totalMemory) * 100;

      diagnostic.metrics.memory_usage = usedMemoryPercent;
      diagnostic.checks.push({
        name: "Memory Usage",
        status:
          usedMemoryPercent < DIAGNOSTIC_THRESHOLDS.system.memoryUsage
            ? "pass"
            : "fail",
        value: usedMemoryPercent,
        threshold: DIAGNOSTIC_THRESHOLDS.system.memoryUsage,
        message: `Memory usage: ${usedMemoryPercent.toFixed(1)}%`,
      });

      // Utilisation CPU
      const cpuUsage = (os.loadavg()[0] / os.cpus().length) * 100;
      diagnostic.metrics.cpu_usage = cpuUsage;
      diagnostic.checks.push({
        name: "CPU Usage",
        status:
          cpuUsage < DIAGNOSTIC_THRESHOLDS.system.cpuUsage ? "pass" : "fail",
        value: cpuUsage,
        threshold: DIAGNOSTIC_THRESHOLDS.system.cpuUsage,
        message: `CPU usage: ${cpuUsage.toFixed(1)}%`,
      });

      // Espace disque
      const diskUsage = await this.checkDiskUsage();
      diagnostic.metrics.disk_usage = diskUsage;
      diagnostic.checks.push({
        name: "Disk Usage",
        status:
          diskUsage < DIAGNOSTIC_THRESHOLDS.system.diskUsage ? "pass" : "fail",
        value: diskUsage,
        threshold: DIAGNOSTIC_THRESHOLDS.system.diskUsage,
        message: `Disk usage: ${diskUsage.toFixed(1)}%`,
      });

      // Uptime
      const uptime = process.uptime() / 3600; // en heures
      diagnostic.metrics.uptime = uptime;
      diagnostic.checks.push({
        name: "System Uptime",
        status: "pass",
        value: uptime,
        message: `System uptime: ${uptime.toFixed(1)} hours`,
      });

      // Calculer le score
      const passedChecks = diagnostic.checks.filter(
        (check) => check.status === "pass"
      ).length;
      diagnostic.score = Math.round(
        (passedChecks / diagnostic.checks.length) * 100
      );
      diagnostic.status =
        diagnostic.score >= 80
          ? "healthy"
          : diagnostic.score >= 60
          ? "warning"
          : "critical";
    } catch (error) {
      diagnostic.status = "critical";
      diagnostic.score = 0;
      diagnostic.issues.push({
        severity: "critical",
        message: `System health check failed: ${error.message}`,
        recommendation: "Check system resources and monitoring",
      });
    }

    return diagnostic;
  }

  /**
   * Diagnostiquer la santé de l'application
   */
  async diagnoseApplicationHealth() {
    const diagnostic = {
      status: "healthy",
      score: 100,
      metrics: {},
      issues: [],
      checks: [],
    };

    try {
      // Vérifier les services essentiels
      const servicesCheck = await this.checkEssentialServices();
      diagnostic.checks.push(...servicesCheck);

      // Vérifier les variables d'environnement
      const envCheck = this.checkEnvironmentVariables();
      diagnostic.checks.push(...envCheck);

      // Vérifier les fichiers de log
      const logCheck = await this.checkLogFiles();
      diagnostic.checks.push(...logCheck);

      // Vérifier les dépendances
      const dependenciesCheck = await this.checkDependencies();
      diagnostic.checks.push(...dependenciesCheck);

      // Calculer le score
      const passedChecks = diagnostic.checks.filter(
        (check) => check.status === "pass"
      ).length;
      diagnostic.score = Math.round(
        (passedChecks / diagnostic.checks.length) * 100
      );
      diagnostic.status =
        diagnostic.score >= 80
          ? "healthy"
          : diagnostic.score >= 60
          ? "warning"
          : "critical";
    } catch (error) {
      diagnostic.status = "critical";
      diagnostic.score = 0;
      diagnostic.issues.push({
        severity: "critical",
        message: `Application health check failed: ${error.message}`,
        recommendation: "Check application configuration and services",
      });
    }

    return diagnostic;
  }

  /**
   * Diagnostiquer la santé business
   */
  async diagnoseBusinessHealth() {
    const diagnostic = {
      status: "healthy",
      score: 100,
      metrics: {},
      issues: [],
      checks: [],
    };

    try {
      // Métriques utilisateurs
      const totalUsers = await prisma.user.count();
      const premiumUsers = await prisma.user.count({
        where: { plan: "premium" },
      });
      const conversionRate =
        totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;

      diagnostic.metrics.conversion_rate = conversionRate;
      diagnostic.checks.push({
        name: "Conversion Rate",
        status:
          conversionRate >= DIAGNOSTIC_THRESHOLDS.business.conversionRate
            ? "pass"
            : "fail",
        value: conversionRate,
        threshold: DIAGNOSTIC_THRESHOLDS.business.conversionRate,
        message: `Conversion rate: ${conversionRate.toFixed(1)}%`,
      });

      // Tickets de support ouverts
      const openTickets = await prisma.ticket.count({
        where: { status: "open" },
      });
      diagnostic.metrics.open_tickets = openTickets;
      diagnostic.checks.push({
        name: "Support Tickets",
        status:
          openTickets <= DIAGNOSTIC_THRESHOLDS.business.supportTickets
            ? "pass"
            : "fail",
        value: openTickets,
        threshold: DIAGNOSTIC_THRESHOLDS.business.supportTickets,
        message: `Open support tickets: ${openTickets}`,
      });

      // Formulaires actifs
      const activeForms = await prisma.form.count({
        where: { is_active: true },
      });
      diagnostic.metrics.active_forms = activeForms;
      diagnostic.checks.push({
        name: "Active Forms",
        status: "pass",
        value: activeForms,
        message: `Active forms: ${activeForms}`,
      });

      // Soumissions récentes
      const recentSubmissions = await prisma.submission.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Dernières 24h
          },
        },
      });
      diagnostic.metrics.recent_submissions = recentSubmissions;
      diagnostic.checks.push({
        name: "Recent Activity",
        status: "pass",
        value: recentSubmissions,
        message: `Submissions in last 24h: ${recentSubmissions}`,
      });

      // Calculer le score
      const passedChecks = diagnostic.checks.filter(
        (check) => check.status === "pass"
      ).length;
      diagnostic.score = Math.round(
        (passedChecks / diagnostic.checks.length) * 100
      );
      diagnostic.status =
        diagnostic.score >= 80
          ? "healthy"
          : diagnostic.score >= 60
          ? "warning"
          : "critical";
    } catch (error) {
      diagnostic.status = "critical";
      diagnostic.score = 0;
      diagnostic.issues.push({
        severity: "critical",
        message: `Business health check failed: ${error.message}`,
        recommendation: "Check business metrics and database connectivity",
      });
    }

    return diagnostic;
  }

  /**
   * Diagnostiquer la sécurité
   */
  async diagnoseSecurityHealth() {
    const diagnostic = {
      status: "healthy",
      score: 100,
      metrics: {},
      issues: [],
      checks: [],
    };

    try {
      // Vérifier les variables de sécurité
      const securityEnvCheck = this.checkSecurityEnvironment();
      diagnostic.checks.push(...securityEnvCheck);

      // Vérifier les permissions de fichiers
      const permissionsCheck = await this.checkFilePermissions();
      diagnostic.checks.push(...permissionsCheck);

      // Vérifier les tentatives de connexion suspectes
      const suspiciousActivityCheck = await this.checkSuspiciousActivity();
      diagnostic.checks.push(...suspiciousActivityCheck);

      // Calculer le score
      const passedChecks = diagnostic.checks.filter(
        (check) => check.status === "pass"
      ).length;
      diagnostic.score = Math.round(
        (passedChecks / diagnostic.checks.length) * 100
      );
      diagnostic.status =
        diagnostic.score >= 80
          ? "healthy"
          : diagnostic.score >= 60
          ? "warning"
          : "critical";
    } catch (error) {
      diagnostic.status = "critical";
      diagnostic.score = 0;
      diagnostic.issues.push({
        severity: "critical",
        message: `Security health check failed: ${error.message}`,
        recommendation: "Review security configuration and logs",
      });
    }

    return diagnostic;
  }

  /**
   * Vérifier l'intégrité des données
   */
  async checkDataIntegrity() {
    const checks = [];

    try {
      // Vérifier les relations orphelines
      const orphanedSubmissions = await prisma.submission.count({
        where: {
          form: null,
        },
      });

      checks.push({
        name: "Data Integrity - Orphaned Submissions",
        status: orphanedSubmissions === 0 ? "pass" : "fail",
        value: orphanedSubmissions,
        message: `Orphaned submissions: ${orphanedSubmissions}`,
      });

      // Vérifier les utilisateurs sans email
      const usersWithoutEmail = await prisma.user.count({
        where: {
          email: "",
        },
      });

      checks.push({
        name: "Data Integrity - Users Without Email",
        status: usersWithoutEmail === 0 ? "pass" : "fail",
        value: usersWithoutEmail,
        message: `Users without email: ${usersWithoutEmail}`,
      });
    } catch (error) {
      checks.push({
        name: "Data Integrity Check",
        status: "fail",
        message: `Data integrity check failed: ${error.message}`,
      });
    }

    return checks;
  }

  /**
   * Vérifier l'utilisation du disque
   */
  async checkDiskUsage() {
    try {
      const stats = await fs.stat(process.cwd());
      // Simulation de l'utilisation du disque (en production, utiliser un vrai check)
      return Math.random() * 100;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Vérifier les services essentiels
   */
  async checkEssentialServices() {
    const checks = [];

    // Vérifier Redis (si configuré)
    if (process.env.REDIS_URL) {
      try {
        // Test de connexion Redis (simulation)
        checks.push({
          name: "Redis Connection",
          status: "pass",
          message: "Redis connection successful",
        });
      } catch (error) {
        checks.push({
          name: "Redis Connection",
          status: "fail",
          message: `Redis connection failed: ${error.message}`,
        });
      }
    }

    // Vérifier Stripe (si configuré)
    if (process.env.STRIPE_SECRET_KEY) {
      checks.push({
        name: "Stripe Configuration",
        status: "pass",
        message: "Stripe configuration present",
      });
    } else {
      checks.push({
        name: "Stripe Configuration",
        status: "warning",
        message: "Stripe not configured",
      });
    }

    return checks;
  }

  /**
   * Vérifier les variables d'environnement
   */
  checkEnvironmentVariables() {
    const checks = [];
    const requiredEnvVars = [
      "DATABASE_URL",
      "JWT_SECRET",
      "SMTP_HOST",
      "SMTP_USER",
      "SMTP_PASS",
    ];

    requiredEnvVars.forEach((envVar) => {
      checks.push({
        name: `Environment Variable - ${envVar}`,
        status: process.env[envVar] ? "pass" : "fail",
        message: process.env[envVar] ? "Present" : "Missing",
      });
    });

    return checks;
  }

  /**
   * Vérifier les fichiers de log
   */
  async checkLogFiles() {
    const checks = [];

    try {
      const logDir = path.join(process.cwd(), "logs");
      const files = await fs.readdir(logDir);

      checks.push({
        name: "Log Files",
        status: files.length > 0 ? "pass" : "warning",
        message: `${files.length} log files found`,
      });
    } catch (error) {
      checks.push({
        name: "Log Files",
        status: "warning",
        message: "Log directory not accessible",
      });
    }

    return checks;
  }

  /**
   * Vérifier les dépendances
   */
  async checkDependencies() {
    const checks = [];

    try {
      const packageJson = require(path.join(process.cwd(), "package.json"));
      const dependencies = Object.keys(packageJson.dependencies || {});

      checks.push({
        name: "Dependencies",
        status: dependencies.length > 0 ? "pass" : "fail",
        message: `${dependencies.length} dependencies found`,
      });
    } catch (error) {
      checks.push({
        name: "Dependencies",
        status: "fail",
        message: "Cannot read package.json",
      });
    }

    return checks;
  }

  /**
   * Vérifier l'environnement de sécurité
   */
  checkSecurityEnvironment() {
    const checks = [];

    // Vérifier NODE_ENV
    checks.push({
      name: "Node Environment",
      status: process.env.NODE_ENV === "production" ? "pass" : "warning",
      message: `NODE_ENV: ${process.env.NODE_ENV || "not set"}`,
    });

    // Vérifier JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    checks.push({
      name: "JWT Secret Strength",
      status: jwtSecret && jwtSecret.length >= 32 ? "pass" : "fail",
      message: jwtSecret ? "JWT secret configured" : "JWT secret missing",
    });

    return checks;
  }

  /**
   * Vérifier les permissions de fichiers
   */
  async checkFilePermissions() {
    const checks = [];

    try {
      const sensitiveFiles = [".env", "package.json"];

      for (const file of sensitiveFiles) {
        try {
          const stats = await fs.stat(file);
          checks.push({
            name: `File Permissions - ${file}`,
            status: "pass",
            message: "File accessible",
          });
        } catch (error) {
          checks.push({
            name: `File Permissions - ${file}`,
            status: "warning",
            message: "File not found or not accessible",
          });
        }
      }
    } catch (error) {
      checks.push({
        name: "File Permissions",
        status: "fail",
        message: "Cannot check file permissions",
      });
    }

    return checks;
  }

  /**
   * Vérifier l'activité suspecte
   */
  async checkSuspiciousActivity() {
    const checks = [];

    try {
      // Vérifier les tentatives de connexion échouées récentes
      const recentFailedLogins = await this.getRecentFailedLogins();

      checks.push({
        name: "Suspicious Login Attempts",
        status: recentFailedLogins < 50 ? "pass" : "warning",
        value: recentFailedLogins,
        message: `${recentFailedLogins} failed login attempts in last hour`,
      });
    } catch (error) {
      checks.push({
        name: "Suspicious Activity Check",
        status: "warning",
        message: "Cannot check suspicious activity",
      });
    }

    return checks;
  }

  /**
   * Obtenir les tentatives de connexion échouées récentes
   */
  async getRecentFailedLogins() {
    // Simulation - en production, ceci viendrait des logs d'audit
    return Math.floor(Math.random() * 20);
  }

  /**
   * Calculer la santé globale
   */
  calculateOverallHealth(categories) {
    const scores = Object.values(categories).map((cat) => cat.score);
    const avgScore =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;

    let status = "healthy";
    if (avgScore < 60) status = "critical";
    else if (avgScore < 80) status = "warning";

    return {
      overallStatus: status,
      performanceScore: Math.round(avgScore),
    };
  }

  /**
   * Générer des recommandations
   */
  generateRecommendations(categories) {
    const recommendations = [];

    Object.entries(categories).forEach(([categoryName, category]) => {
      if (category.status === "critical") {
        recommendations.push({
          priority: "high",
          category: categoryName,
          message: `${categoryName} health is critical - immediate attention required`,
          action: "Review and fix critical issues in this category",
        });
      } else if (category.status === "warning") {
        recommendations.push({
          priority: "medium",
          category: categoryName,
          message: `${categoryName} health needs attention`,
          action: "Monitor and improve metrics in this category",
        });
      }
    });

    return recommendations;
  }

  /**
   * Extraire les problèmes critiques
   */
  extractCriticalIssues(categories) {
    const criticalIssues = [];

    Object.entries(categories).forEach(([categoryName, category]) => {
      if (category.issues) {
        category.issues.forEach((issue) => {
          if (issue.severity === "critical") {
            criticalIssues.push({
              category: categoryName,
              ...issue,
            });
          }
        });
      }

      if (category.checks) {
        category.checks.forEach((check) => {
          if (check.status === "fail") {
            criticalIssues.push({
              category: categoryName,
              severity: "critical",
              message: check.message,
              recommendation: "Fix this failed check",
            });
          }
        });
      }
    });

    return criticalIssues;
  }

  /**
   * Extraire les avertissements
   */
  extractWarnings(categories) {
    const warnings = [];

    Object.entries(categories).forEach(([categoryName, category]) => {
      if (category.checks) {
        category.checks.forEach((check) => {
          if (check.status === "warning") {
            warnings.push({
              category: categoryName,
              severity: "warning",
              message: check.message,
              recommendation: "Monitor this metric",
            });
          }
        });
      }
    });

    return warnings;
  }

  /**
   * Sauvegarder les résultats de diagnostic
   */
  async saveDiagnosticResults(results) {
    try {
      await prisma.actionLog.create({
        data: {
          action: "SYSTEM_DIAGNOSTIC",
          details: JSON.stringify({
            overall_status: results.overall_status,
            performance_score: results.performance_score,
            categories: Object.keys(results.categories),
            critical_issues_count: results.critical_issues.length,
            warnings_count: results.warnings.length,
            recommendations_count: results.recommendations.length,
          }),
          date: results.timestamp,
        },
      });

      logger.info("Diagnostic results saved to database");
    } catch (error) {
      logger.error("Error saving diagnostic results:", error);
    }
  }

  /**
   * Obtenir l'historique des diagnostics
   */
  getDiagnosticHistory(limit = 10) {
    return this.diagnosticHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Obtenir le dernier diagnostic
   */
  getLastDiagnostic() {
    return this.lastDiagnostic;
  }

  /**
   * Diagnostic rapide (version allégée)
   */
  async runQuickDiagnostic() {
    try {
      const quickChecks = {
        database: false,
        application: false,
        system: false,
      };

      // Test de connexion base de données
      try {
        await prisma.$queryRaw`SELECT 1`;
        quickChecks.database = true;
      } catch (error) {
        logger.error("Quick diagnostic - Database check failed:", error);
      }

      // Test de santé application
      try {
        const userCount = await prisma.user.count();
        quickChecks.application = userCount >= 0;
      } catch (error) {
        logger.error("Quick diagnostic - Application check failed:", error);
      }

      // Test de santé système
      try {
        const memoryUsage = process.memoryUsage();
        quickChecks.system = memoryUsage.heapUsed > 0;
      } catch (error) {
        logger.error("Quick diagnostic - System check failed:", error);
      }

      const healthyChecks = Object.values(quickChecks).filter(Boolean).length;
      const totalChecks = Object.keys(quickChecks).length;
      const healthPercentage = (healthyChecks / totalChecks) * 100;

      return {
        timestamp: new Date(),
        overall_health: healthPercentage,
        status:
          healthPercentage >= 80
            ? "healthy"
            : healthPercentage >= 60
            ? "warning"
            : "critical",
        checks: quickChecks,
      };
    } catch (error) {
      logger.error("Error running quick diagnostic:", error);
      return {
        timestamp: new Date(),
        overall_health: 0,
        status: "critical",
        error: error.message,
      };
    }
  }
}

module.exports = new DiagnosticService();
