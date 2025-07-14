const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware basique
app.use(cors());
app.use(express.json());

// Route de test
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backend is running" });
});

// Route de test pour le dashboard
app.get("/api/dashboard/stats", (req, res) => {
  res.json({
    totalForms: 5,
    totalSubmissions: 150,
    activeForms: 3,
    conversionRate: 65.5,
    recentActivity: [],
    recentForms: [],
    chartData: [],
    plan: "FREE",
    planLimits: {
      forms: { used: 5, limit: 10 },
      submissions: { used: 150, limit: 1000 },
    },
  });
});

app.listen(PORT, () => {
  console.log(`✅ Backend de test démarré sur le port ${PORT}`);
  console.log(`🔗 Test: http://localhost:${PORT}/api/health`);
});
