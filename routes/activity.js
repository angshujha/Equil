const express = require("express");
const router = express.Router();
const Activity = require("../models/activity");
const { isLoggedIn } = require("../middleware/auth");

// CO₂ emission constants (in kg)
const FACTORS = {
  travel: { car: 0.21, bus: 0.05, train: 0.06, bike: 0.0, walk: 0.0 },
  energy: { electricity: 0.82 },
  diet: { nonveg: 6.9, vegetarian: 2.0, vegan: 1.5 }
};

// 🌿 Add new activity form
router.get("/activities/new", isLoggedIn, (req, res) => {
  res.render("activities/new", {
    title: "Add Activity | EcoTrack",
    pageCSS: ["activity"],   // ✅ load activity.css
    currentUser: req.user
  });
});

// 🌿 Handle form submission
router.post("/activities", isLoggedIn, async (req, res) => {
  const { type } = req.body;
  let co2 = 0;

  try {
    const {
      calculateTravelCO2,
      calculateEnergyCO2,
      calculateDietCO2
    } = require("../utils/calculatecarbon");

    if (type === "travel") {
      const { mode, distance } = req.body;
      co2 = await calculateTravelCO2(distance, mode);
      await Activity.create({ user: req.user._id, type, mode, distance, co2 });
    } else if (type === "energy") {
      const { kwh } = req.body;
      co2 = await calculateEnergyCO2(kwh);
      await Activity.create({ user: req.user._id, type, kwh, co2 });
    } else if (type === "diet") {
      const { dietType } = req.body;
      co2 = await calculateDietCO2(dietType);
      await Activity.create({ user: req.user._id, type, dietType, co2 });
    }

    req.flash("success", `Activity added! CO₂ = ${co2.toFixed(2)} kg`);
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Activity save error:", err.message);
    req.flash("error", "Error saving activity");
    res.redirect("/activities/new");
  }
});

// 🌿 Dashboard
router.get("/dashboard", isLoggedIn, async (req, res) => {
  const activities = await Activity.find({ user: req.user._id }).sort({ date: -1 });

  const totals = { travel: 0, energy: 0, diet: 0, total: 0 };
  activities.forEach(a => {
    totals[a.type] += a.co2 || 0;
    totals.total += a.co2 || 0;
  });

  const apiOnline = req.session.apiOnline ?? true;
  req.session.apiOnline = null;

  // Last 7 days activities
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyActivities = activities.filter(a => a.date >= oneWeekAgo);
  const weeklyCO2 = weeklyActivities.reduce((sum, a) => sum + (a.co2 || 0), 0);

  const topType = Object.keys(totals).reduce((a, b) => totals[a] > totals[b] ? a : b);
  let ecoTip = "Keep tracking your activities!";
  if (topType === "travel") ecoTip = "🚗 Travel emissions are highest — try carpooling or cycling!";
  else if (topType === "energy") ecoTip = "💡 Reduce electricity use — switch to LED bulbs.";
  else if (topType === "diet") ecoTip = "🥗 Try more plant-based meals.";

  res.render("activities/dashboard", {
    title: "Dashboard | EcoTrack",
    pageCSS: ["dashboard"],   // ✅ load dashboard.css
    currentUser: req.user,
    activities,
    totals,
    ecoTip,
    apiOnline,
    topType,
    weeklyCO2
  });
});

module.exports = router;
