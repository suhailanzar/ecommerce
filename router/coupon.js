const express = require("express");
const router = express.Router();
const User=require("../model/user")
const payment=require("../controller/paymentcontroller")
const coupon= require("../controller/couponcontroller")
const nocache = require("nocache");
const multer = require('multer');
const path=require('path')


router.use(nocache())

const checksession=async(req,res,next)=>{
    if(req.session.admindet){
        next();
    }
    else{
        res.redirect('/admin')
    }
}



router.get('/coupon',coupon.viewcouponget)


router.get('/addcoupon',checksession,coupon.addcouponget)
router.post('/addcouponpost',checksession,coupon.addcouponpost)
router.get('/updatecoupon/:id',checksession,coupon.updatecouponget)
router.post('/updatecouponpost/:id',checksession,coupon.updatecouponpost)
router.get('/deletecoupon/:id',checksession,coupon.deletecoupon)


router.post('/validateCoupon',coupon.validatecoupon)
router.post('/removeCoupon',coupon.removecoupon)




module.exports=router;
