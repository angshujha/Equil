const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");

// 🌍 Home Page
router.get("/", (req, res) => {
  res.render("home", {
    title: "EcoTrack | Home",
    pageCSS: ["home"], // ✅ will load /public/css/home.css
    currentUser: req.user
  });
});

// 🧾 Register form
router.get("/register", (req, res) => {
  res.render("users/register", {
    title : "Sign Up | Equil", 
    pageCSS : ["auth"], 
     currentUser: req.user,
   hideNavbar : true,// 👈 hides the navbar for auth pages
  hideFooter : true // 👈 hides the footer for auth pages
  });
});

// 🧾 Register user
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exist = await User.findOne({ email });
    if (exist) {
      req.flash("error", "Email already registered!");
      return res.redirect("/register");
    }

    const user = new User({ name, email, password });
    await user.save();

    req.flash("success", "Registration successful. Please log in!");
    res.redirect("/login");
  } catch (err) {
    console.log(err);
    req.flash("error", "Registration failed");
    res.redirect("/register");
    
  }
});

// 🔐 Login form
router.get("/login", (req, res) => {
  res.render("users/login", {
    title: " Sign In | EcoTrack",
    pageCSS: ["auth"], // ✅ loads auth.css
     hideNavbar: true,   // 👈 hide navbar
    hideFooter: true,   // 👈 hide footer
    currentUser: req.user
  });
});

// 🔐 Login user
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true
  }),
  (req, res) => {
    req.flash("success", "Welcome back!");
    res.redirect("/dashboard"); // Redirect to dashboard after login
  }
);

// 🚪 Logout
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully!");
    res.redirect("/login");
  });
});

module.exports = router;
