const router = require("express").Router();

const passport = require("passport");

const googleAuthController = require("../controller/googleAuthController");

// Start Google Login

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);
// Google Callback

router.get(
 "/google/callback",
 (req,res,next)=>{

 passport.authenticate(
 "google",
 {
   session:false
 },
 (err,user,info)=>{

   if(err){
     console.log("Passport error:",err);
     return res.status(500).json(err);
   }

   if(!user){
     console.log("No user:",info);
     return res.status(401).json(info);
   }

   req.user=user;
   next();

 }
 )(req,res,next);

 },
 googleAuthController.googleCallback
);

module.exports = router;
