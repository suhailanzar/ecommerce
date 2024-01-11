const express = require("express");
const router = express.Router();
const profile = require("../controller/profilecontroller");
const User=require("../model/user")
const payment=require("../controller/paymentcontroller")
const nocache = require("nocache");
const multer = require('multer');
const path=require('path')


router.use(nocache())

router.post('/razorpaypost',payment.razorpaygetpost)







module.exports=router;