const express = require("express");
const router = express.Router();
const category = require("../controller/categorycontroller");
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


// category

router.get('/category',checksession,category.catget)
router.get('/addcategory',checksession,category.addcatget)
router.post('/postcategory',checksession,category.postaddcat)
router.get('/updatecategory/:id',checksession,category.updatecatget)
router.post('/updatecategorypost/:id',checksession,category.updatecatpost)
// router.get('/deletecategory/:id',category.deletecatget)
router.get('/listcategory/:id',checksession,category.listcat)
router.get('/softdeletecat/:id',checksession,category.softdeletecat)



module.exports=router;