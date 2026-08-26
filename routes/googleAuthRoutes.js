const router = require("express").Router();

const passport = require("passport");

const googleAuthController = require("../controller/googleAuthController");

// Start Google Login

router.get(
  "/google",

  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

// Google Callback

router.get(
  "/google/callback",

  passport.authenticate("google", {
    session: false,
  }),

  googleAuthController.googleCallback,
);

module.exports = router;
