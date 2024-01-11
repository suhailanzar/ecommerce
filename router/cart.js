const express = require("express");
const router = express.Router();
const cart = require("../controller/cartcontroller");
const User = require('../model/user')

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


router.get('/cartget',checkSessionAndBlocked,cart.cartget)
router.get('/addtocart/:id',checkSessionAndBlocked,cart.addtocartget)
router.get('/increment/:id',checkSessionAndBlocked,cart.increment)
router.get('/decrement/:id',checkSessionAndBlocked,cart.decrement)
router.get('/removecartget/:id',checkSessionAndBlocked,cart.removecartget)
router.get('/checkoutget',checkSessionAndBlocked,cart.checkoutget)
router.post('/checkoutpost',checkSessionAndBlocked,cart.orderconfirmed)










module.exports=router;