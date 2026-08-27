const User = require("../models/user");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middleware/authmiddleware");

const activityService = require("./activityService");

const activityServicActions = require("../constants/activityActions");



const googleLoginUser = async (googleData) => {

  const {
    name,
    email,
    googleId,
    profileImage
  } = googleData;


  let user = await User.findOne({
    email
  });


  // Create new google user
  if (!user) {

    user = await User.create({

      name,

      email,

      googleId,

      profileImage,

      isGoogleLogin: true,

      password: null

    });

  } 
  // Existing user (email/password user) login with Google
  else {

    user.googleId = googleId;

    user.profileImage = profileImage;

    user.isGoogleLogin = true;

    // Keep existing password if user already has one
    await user.save();

  }



  const accessToken =
    generateAccessToken(user);



  const refreshToken =
    generateRefreshToken(user);



  user.refreshToken = refreshToken;


  await user.save();



  await activityService.createActivity({

    userId: user._id,

    action: activityServicActions.LOGIN,

    module: "AUTH",

    description:
      `${user.email} logged in with Google`

  });



  return {

    ...user.toObject(),

    accessToken,

    refreshToken

  };

};


module.exports = {
  googleLoginUser
};