const googleAuthService =
require("../services/googleAuthService");


const Response =
require("../utils/response");

const message =
require("../constants/message");

const googleCallback = async (req, res) => {
  console.log("ddddddd")
  try {

    const googleUser = {

      name: req.user.name,

      email: req.user.email,

      googleId: req.user.googleId,

      profileImage: req.user.profileImage

    };


    const user =
      await googleAuthService.googleLoginUser(
        googleUser
      );


    console.log(
      "Google Login Success:",
      user.email
    );


    res.redirect(
      `${process.env.FRONTEND_URL}/google-success?token=${user.accessToken}`
    );


  } catch (error) {

    console.log(
      "Google Callback Error:",
      error
    );

    res.status(500).json({
      message:error.message
    });

  }
};




module.exports = {
  googleCallback
};