const googleAuthService =
require("../services/googleAuthService");


const Response =
require("../utils/response");

const message =
require("../constants/message");





const googleCallback = async(req,res)=>{

  try {


    const googleUser = {

      name:req.user.name,

      email:req.user.email,

      googleId:req.user.googleId,

      profileImage:req.user.profileImage

    };



    const user =
      await googleAuthService.googleLoginUser(
        googleUser
      );



    res.redirect(
      `${process.env.FRONTEND_URL}/google-success?token=${user.accessToken}`
    );



  } catch(error){


    console.log(
      "Google Callback Error",
      error
    );


    return Response.errorResponse(
      res,
      500,
      error.message,
      null
    );

  }

};




module.exports = {
  googleCallback
};