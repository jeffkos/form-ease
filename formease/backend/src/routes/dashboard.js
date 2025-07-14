// Routes du tableau de bord FormEase
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// Routes pour le dashboard
router.get("/stats", dashboardController.getDashboardStats);
router.get("/recent-forms", dashboardController.getRecentForms);
router.get("/recent-activity", dashboardController.getRecentActivity);
router.get("/chart-data", dashboardController.getChartData);

module.exports = router;
