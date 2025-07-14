const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "FormEase Backend Running" });
});

// Utiliser les routes du dashboard avec base de données
const dashboardRoutes = require("./src/routes/dashboard");
app.use("/api/dashboard", dashboardRoutes);

// AI Generator API
app.post("/api/ai/generate-form", (req, res) => {
  const { prompt } = req.body;
  res.json({
    success: true,
    form: {
      title: `Formulaire généré: ${prompt}`,
      fields: [
        { type: "text", label: "Nom", required: true },
        { type: "email", label: "Email", required: true },
        { type: "textarea", label: "Message", required: false },
      ],
    },
  });
});

// Forms API
app.get("/api/forms", (req, res) => {
  res.json({
    forms: [
      { id: "1", title: "Contact", submissions: 25, status: "active" },
      { id: "2", title: "Satisfaction", submissions: 45, status: "active" },
      { id: "3", title: "Newsletter", submissions: 80, status: "active" },
    ],
  });
});

app.post("/api/forms", (req, res) => {
  const { title, fields } = req.body;
  res.json({
    success: true,
    form: { id: Date.now().toString(), title, fields, status: "active" },
  });
});

// Analytics API
app.get("/api/analytics", (req, res) => {
  res.json({
    metrics: {
      totalViews: 1250,
      totalSubmissions: 350,
      conversionRate: 28.0,
      avgCompletionTime: 180,
    },
    chartData: [
      { date: "2024-01-01", views: 120, submissions: 34, conversionRate: 28.3 },
      { date: "2024-01-02", views: 135, submissions: 38, conversionRate: 28.1 },
      { date: "2024-01-03", views: 148, submissions: 42, conversionRate: 28.4 },
      { date: "2024-01-04", views: 162, submissions: 45, conversionRate: 27.8 },
      { date: "2024-01-05", views: 155, submissions: 41, conversionRate: 26.5 },
    ],
  });
});

// Email Tracking API
app.get("/api/email-tracking", (req, res) => {
  res.json({
    stats: {
      totalSent: 1200,
      delivered: 1150,
      opened: 850,
      clicked: 340,
    },
    emails: [
      {
        id: "1",
        recipient: "user@example.com",
        subject: "Nouveau formulaire disponible",
        status: "opened",
        sentAt: "2024-01-15T10:00:00Z",
      },
    ],
  });
});

// QR Codes API
app.get("/api/qr-codes", (req, res) => {
  res.json({
    qrCodes: [
      {
        id: "1",
        formId: "1",
        title: "QR Contact",
        scans: 45,
        createdAt: "2024-01-10T08:00:00Z",
      },
    ],
  });
});

app.post("/api/qr-codes", (req, res) => {
  const { formId, customization } = req.body;
  res.json({
    success: true,
    qrCode: {
      id: Date.now().toString(),
      formId,
      url: `https://formease.com/f/${formId}`,
      qrCodeUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    },
  });
});

// Reports API
app.get("/api/reports", (req, res) => {
  res.json({
    reports: [
      {
        id: "1",
        name: "Rapport Mensuel",
        type: "performance",
        createdAt: "2024-01-15T10:00:00Z",
        status: "ready",
      },
    ],
    insights: [
      {
        id: "1",
        type: "positive",
        title: "Amélioration des conversions",
        description: "Votre taux de conversion a augmenté de 15% ce mois-ci",
        priority: "high",
        timestamp: "2024-01-15T10:00:00Z",
      },
    ],
  });
});

// Profile API
app.get("/api/profile", (req, res) => {
  res.json({
    user: {
      first_name: "Jeff",
      last_name: "KOSI",
      email: "jeff@formease.com",
      phone: "+33 6 12 34 56 78",
      company: "FormEase",
      role: "admin",
      plan: "FREE",
      avatar: null,
    },
    stats: {
      totalForms: 5,
      totalSubmissions: 150,
      joinedAt: "2024-01-01T00:00:00Z",
    },
  });
});

app.put("/api/profile", (req, res) => {
  res.json({ success: true, message: "Profil mis à jour" });
});

app.listen(PORT, () => {
  console.log(`✅ FormEase Backend démarré sur le port ${PORT}`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/stats`);
});
