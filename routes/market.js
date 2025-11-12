// routes/market.js
const express = require("express");
const router = express.Router();
const MarketItem = require("../models/marketItem");
const Redemption = require("../models/redemption");
const User = require("../models/user");
const { isLoggedIn } = require("../middleware/auth");

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

module.exports = router;
