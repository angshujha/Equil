const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/auth");

router.get("/startcalculator", isLoggedIn, (req, res) => {
  res.render("activities/CO2calculator/startCalculator", {
    title: "CO₂ Calculator | Equil",
    pageCSS: ["startCalculator"],
    currentUser: req.user
  });
});
router.get("/calculator/home", isLoggedIn, (req, res) => {   
    res.render("activities/CO2calculator/calculatorHome", {
        title: "CO₂ Calculator Home | Equil",
        pageCSS: ["calculatorHome"],
        currentUser: req.user
    });
});

router.get("/calculator/travel", isLoggedIn, (req, res) => {
  res.render("activities/CO2calculator/travel&transportation", {
    title: "Travel Emission | Equil",
    pageCSS: ["travel&transportation"],
    currentUser: req.user
  });
});



router.get("/calculator/food", isLoggedIn, (req, res) => {
  res.render("activities/CO2calculator/fooddiet", {
    title: "Food Diet | Equil",
    pageCSS: ["fooddiet"],
    currentUser: req.user
  });
});

router.get("/calculator/recycle", isLoggedIn, (req, res) => {
  res.render("activities/CO2calculator/wasterecycleinput", {
    title: "Waste Recycling | Equil",
    pageCSS: ["wasterecycleinput"],
    currentUser: req.user
  });
});

module.exports = router;
