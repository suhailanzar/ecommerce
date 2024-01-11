const express = require("express");
const router = express.Router();
const offer = require("../controller/offercontroller");

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




router.get('/getoffer',checksession,offer.getoffer)
router.get('/addoffer',checksession,offer.addoffer)
router.post('/addofferpost',checksession,offer.addofferpost)
router.get('/addoffercategory',checksession,offer.addoffercategory)
router.get('/updateoffer/:id',checksession,offer.updateofferget)
router.get('/deleteoffer/:id',checksession,offer.deleteoffer)


module.exports=router;