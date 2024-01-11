const express = require("express");
const router = express.Router();
const order = require("../controller/ordercontroller");
const User = require('../model/user')

const nocache = require("nocache");

router.use(nocache())

const checksession=async(req,res,next)=>{
    if(req.session.admindet){
        next();
    }
    else{
        res.redirect('/admin')
    }
}




router.get('/orders',order.orderget)
router.get('/ordercanceladmin/:productid/:orderid',checksession,order.ordercancel)
router.post('/orderupdateadmin/:productid/:orderid',checksession,order.orderupdate)



module.exports=router;