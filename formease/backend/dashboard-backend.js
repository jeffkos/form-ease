const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "FormEase Backend Running",
    timestamp: new Date().toISOString(),
  });
});

// Utiliser les routes du dashboard avec base de données
try {
  const dashboardRoutes = require("./src/routes/dashboard");
  app.use("/api/dashboard", dashboardRoutes);
  console.log("✅ Routes dashboard chargées avec succès");
} catch (error) {
  console.error(
    "❌ Erreur lors du chargement des routes dashboard:",
    error.message
  );

  // Routes de fallback en cas d'erreur
  app.get("/api/dashboard/stats", (req, res) => {
    res.json({
      success: true,
      data: {
        totalForms: 4,
        totalResponses: 27,
        totalUsers: 3,
        conversionRate: 68,
        formsChange: "+12%",
        responsesChange: "+23%",
        usersChange: "+8%",
        conversionChange: "+15%",
      },
    });
  });

  app.get("/api/dashboard/recent-forms", (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          title: "Formulaire de Contact",
          status: "ACTIVE",
          responses: 8,
          createdAt: new Date(),
          author: "Jeff KOSI",
        },
        {
          id: 2,
          title: "Enquête de Satisfaction",
          status: "ACTIVE",
          responses: 12,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          author: "Admin FormEase",
        },
      ],
    });
  });

  app.get("/api/dashboard/recent-activity", (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          type: "response",
          message: 'Nouvelle réponse pour "Formulaire de Contact"',
          timestamp: new Date(),
          icon: "ri-file-text-line",
        },
        {
          id: 2,
          type: "form",
          message: 'Nouveau formulaire créé: "Enquête produit"',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          icon: "ri-add-line",
        },
      ],
    });
  });

  app.get("/api/dashboard/chart-data", (req, res) => {
    const { type } = req.query;
    const fallbackData =
      type === "responses"
        ? [
            { date: "2025-01-08", value: 2 },
            { date: "2025-01-09", value: 4 },
            { date: "2025-01-10", value: 3 },
            { date: "2025-01-11", value: 6 },
            { date: "2025-01-12", value: 5 },
            { date: "2025-01-13", value: 8 },
            { date: "2025-01-14", value: 7 },
          ]
        : [
            { status: "ACTIVE", count: 3 },
            { status: "DRAFT", count: 1 },
          ];

    res.json({
      success: true,
      data: fallbackData,
    });
  });
}

// Routes API supplémentaires
app.get("/api/forms", (req, res) => {
  res.json({
    forms: [
      {
        id: 1,
        title: "Formulaire de Contact",
        description: "Formulaire pour contacter notre équipe",
        status: "active",
        submissions: 8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Enquête de Satisfaction",
        description: "Enquête pour évaluer la satisfaction client",
        status: "active",
        submissions: 12,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  });
});

app.get("/api/profile", (req, res) => {
  res.json({
    user: {
      first_name: "Jeff",
      last_name: "KOSI",
      email: "jeff@formease.com",
      phone: "+33 6 12 34 56 78",
      company: "FormEase",
      role: "admin",
      plan: "premium",
      avatar:
        "https://ui-avatars.com/api/?name=Jeff+KOSI&background=3b82f6&color=fff",
    },
  });
});

// Route pour les analytics
app.get("/api/analytics", (req, res) => {
  res.json({
    analytics: {
      totalViews: 1250,
      totalSubmissions: 27,
      conversionRate: 68,
      topForms: [
        { name: "Contact", submissions: 8 },
        { name: "Satisfaction", submissions: 12 },
        { name: "Newsletter", submissions: 7 },
      ],
      chartData: [
        { date: "2025-01-08", views: 45, submissions: 2 },
        { date: "2025-01-09", views: 52, submissions: 4 },
        { date: "2025-01-10", views: 38, submissions: 3 },
        { date: "2025-01-11", views: 67, submissions: 6 },
        { date: "2025-01-12", views: 58, submissions: 5 },
        { date: "2025-01-13", views: 73, submissions: 8 },
        { date: "2025-01-14", views: 62, submissions: 7 },
      ],
    },
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error("Erreur:", err.message);
  res.status(500).json({
    success: false,
    error: "Erreur serveur interne",
  });
});

// Route 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route non trouvée",
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`✅ FormEase Backend démarré sur le port ${PORT}`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`📋 Formulaires: http://localhost:${PORT}/api/forms`);
  console.log(`👤 Profil: http://localhost:${PORT}/api/profile`);
  console.log(`📈 Analytics: http://localhost:${PORT}/api/analytics`);
});

module.exports = app;
