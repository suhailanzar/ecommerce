const express = require("express");
const router = express.Router();
const wishlist = require("../controller/wishlistcontroller");
const User = require("../model/user");

const nocache = require("nocache");

router.use(nocache())

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



router.get('/addwishlist/:id',checkSessionAndBlocked, wishlist.addToWishlist);

// Get wishlist items for a user
router.get('/getwishlist',checkSessionAndBlocked, wishlist.getWishlist);

router.get('/removewishget/:id',checkSessionAndBlocked, wishlist.removewishget);


module.exports=router;