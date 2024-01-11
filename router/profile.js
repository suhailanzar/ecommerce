const express = require("express");
const router = express.Router();
const profile = require("../controller/profilecontroller");
const User=require("../model/user")
const nocache = require("nocache");
const multer = require('multer');
const path=require('path')


router.use(nocache())



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'assets/profileimages')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage:storage}).single('img')


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


  // profile  settings

router.get('/profileget',checkSessionAndBlocked,profile.profileget)
router.get('/editprofileget',checkSessionAndBlocked,profile.editprofileget)
router.post('/editprofilepost/:id',upload,profile.editprofilepost)
router.get('/passwordreset',checkSessionAndBlocked,profile.passwordreset)
router.post('/passwordresetpost',checkSessionAndBlocked,profile.passwordresetpost)




// address settings
router.get('/addressget',checkSessionAndBlocked,profile.addressget)
router.get('/editaddress/:id',checkSessionAndBlocked,profile.editaddress)
router.post('/editaddresspost/:id',checkSessionAndBlocked,profile.editaddresspost)
router.get('/deleteaddress/:id',checkSessionAndBlocked,profile.deleteaddress)
router.get('/addaddressget',checkSessionAndBlocked,profile.addaddressget)
router.post('/addresspost',checkSessionAndBlocked,profile.addresspost)


// user order checking
router.get('/ordersget',checkSessionAndBlocked,profile.ordersget)
router.get('/ordercancel/:productid/:orderid',checkSessionAndBlocked,profile.ordercancel)
router.get('/orderreturn/:productid/:orderid',checkSessionAndBlocked,profile.orderreturn)
router.get('/vieworder/:productid/:orderid',checkSessionAndBlocked,profile.vieworder)
router.get('/getGeneratePdforder/:id',checkSessionAndBlocked,profile.getGeneratePdforder)



// wallet
router.get('/walletget',checkSessionAndBlocked,profile.walletget)


module.exports=router;