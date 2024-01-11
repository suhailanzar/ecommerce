const express = require("express");
const router = express.Router();
const product = require("../controller/productcontroller");
const nocache = require("nocache");
const multer = require('multer');

router.use(nocache())

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'assets/uploads'); 
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); 
    }
});

const upload = multer({ storage: storage }).array('img',4)



const checksession=async(req,res,next)=>{
    if(req.session.admindet){
        next();
    }
    else{
        res.redirect('/admin')
    }
}


// product

router.get('/product',checksession,product.productget)
router.get('/productpost',checksession,product.productpost)
router.get('/addproduct',checksession,product.addprodget)
router.post('/addproductpost',checksession,upload,product.addprodpost)
router.get('/updateproduct/:id',checksession,product.updateprodget)
router.post('/removeproduct',checksession,product.removeproductpost)
router.post('/updateproductpost/:id',checksession,upload,product.updateprodpost)
router.get('/deleteproduct/:id',checksession,product.deleteproductget)
router.get('/listproduct/:id',checksession,product.listproduct)
router.get('/softdeleteproduct/:id',checksession,product.softdeleteproduct)



module.exports=router;