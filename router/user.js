const express = require("express");
const router = express.Router();
const users = require("../controller/usercontroller");
const nocache = require("nocache");
const User = require('../model/user')


router.use(nocache());

const checkSessionAndBlocked = async(req, res, next)=>{
    if(req.session.userdetail){
      const userDetails = await User.findOne({email: req.session.userdetail.email})
      if(!userDetails.isBlocked){
        next();
      }else{
        //The user is blocked destroy session and redirect
        req.session.destroy((err)=>{
          if(err){
            console.log("Error destroying session: ",err)
            res.redirect("/signin")
          }else{
            res.redirect('/signin')
          }
        })
      }
    }else{
      res.redirect('/signin')
    }
  }


 


//home route
router.get("/", users.homeroute);

// api for signin
router.get("/signin", users.signinget);
router.post("/signinpost", users.signinpost);



// api  for userpage

router.get("/userpage",checkSessionAndBlocked, users.homepageget);
router.get('/productpage/:id',checkSessionAndBlocked,users.productpage)
router.get("/categorypage/:id",checkSessionAndBlocked,users.categorypage)
router.post('/sorted',users.sortedproduct)


// api for signup
router.get("/signup", users.signupget);
router.post("/signuppost", users.signuppost);
router.get('/resendotp',users.resendotpget)

// forgot password
router.get('/emailforgot',users. emailforgotget)
router.post('/emailforgotpost',users.emailforgotpost)
router.get('/otpforgotget',users.otpforgotget)
router.get('/resendotpforgot',users.resendotpforgotget)
router.post('/resetpassword',users.otpforgotpost)
router.post('/newpassword',users.resetpasswordpost)
router.get('/searchproducts',checkSessionAndBlocked,users.searchproducts)




// api for otp page

router.get("/otppage", users.otpget);
router.post("/otppage", users.otppost);

//api for logout
router.get("/logout", users.logoutuser);

module.exports = router;
