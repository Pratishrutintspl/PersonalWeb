const googleAuthService = require("../services/googleAuthService");

const Response = require("../utils/response");

const message = require("../constants/message");

const googleCallback = async (req, res) => {
  try {
    const googleUser = {
      name: req.user.name,
      email: req.user.email,
      googleId: req.user.googleId,
      profileImage: req.user.profileImage,
    };

    const user = await googleAuthService.googleLoginUser(googleUser);

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
    };

    const encodedUser = Buffer.from(JSON.stringify(userData)).toString(
      "base64",
    );
    console.log("GOOGLE REDIRECT DATA:", {
      token: user.accessToken,
      userData,
      encodedUser,
    });

    res.redirect(
      `${process.env.FRONTEND_URL}/google-success?token=${user.accessToken}&user=${encodedUser}`,
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  googleCallback,
};
