// routes/market.js
const express = require("express");
const router = express.Router();
const MarketItem = require("../models/marketItem");
const Redemption = require("../models/redemption");
const User = require("../models/user");
const { isLoggedIn } = require("../middleware/auth");
const { recommendRedeem } = require("../utils/redeemRecommender");
const pdfkit = require("pdfkit");
const fs = require("fs");



// Market front page: list items
router.get("/market", async (req, res) => {
  try {
    const items = await MarketItem.find().sort({ costPoints: 1 });
    res.render("market/index", {
      title: "Marketplace | EcoTrack",
      pageCSS: ["market"],
      currentUser: req.user,
      items
    });
  } catch (err) {
    console.error("Market load error:", err);
    req.flash("error", "Failed to load marketplace");
    res.redirect("/");
  }
});

// Redeem an item
router.post("/market/:id/redeem", isLoggedIn, async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await MarketItem.findById(itemId);
    if (!item) {
      req.flash("error", "Item not found");
      return res.redirect("/market");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/market");
    }

    if ((user.points || 0) < item.costPoints) {
      req.flash("error", "Not enough points to redeem this item");
      return res.redirect("/market");
    }

    // Deduct points and save user (safe save)
    user.points = (user.points || 0) - item.costPoints;

    // Optionally give a small message or incremental action, e.g., award badge
    // user.badges.push({ id: 'supporter', name: 'Eco Supporter', description: 'Redeemed in marketplace', earnedAt: new Date() });

    await user.save({ validateBeforeSave: false });

    // Log the redemption
    await Redemption.create({
      user: user._id,
      item: item._id,
      pointsSpent: item.costPoints,
      message: req.body.message || ""
    });

    req.flash("success", `Redeemed "${item.title}" for ${item.costPoints} points. Thank you!`);
    res.redirect("/market");
  } catch (err) {
    console.error("Redeem error:", err);
    req.flash("error", "Failed to redeem item");
    res.redirect("/market");
  }
});
router.get("/redeem-stats", isLoggedIn, async (req, res) => {
  const user = await User.findById(req.user._id);
  const tx = user.transactions || [];

  const earned = tx.filter(t => t.type === "earn").reduce((s, t) => s + t.points, 0);
  const redeemed = tx.filter(t => t.type === "redeem").reduce((s, t) => s + Math.abs(t.points), 0);

  res.render("market/stats", {
    title: "Redeem Analytics | Equil",
    pageCSS: ["marketStats"],
    currentUser: req.user,
    earned,
    redeemed,
    tx
  });
});
router.get("/certificate/:id", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { id } = req.params;

    const doc = new pdfkit();
    const fileName = `certificate-${id}-${Date.now()}.pdf`;
    const filePath = `./public/certificates/${fileName}`;
    fs.mkdirSync("./public/certificates", { recursive: true });

    doc.pipe(fs.createWriteStream(filePath));
    doc.fontSize(24).text("🌿 Equil Carbon Offset Certificate", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`This certifies that ${user.username} has successfully redeemed:`);
    doc.text(`${id} — reducing carbon impact and supporting sustainability.`);
    doc.moveDown();
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text("Keep up your eco-friendly actions!");
    doc.end();

    req.flash("success", "✅ Certificate generated successfully!");
    res.redirect(`/certificates/${fileName}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to generate certificate");
    res.redirect("/market");
  }
});

module.exports = router;
