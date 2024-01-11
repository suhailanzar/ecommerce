const express = require("express");
const router = express.Router();
const admin = require("../controller/admincontroller");
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



// admin home  route
router.get('/',admin.loginget)

router.post('/loginpost',admin.loginpost)
router.get('/dashboard',checksession,admin.dashget)
router.get('/generate-pdf',checksession,admin.getGeneratePdf)
router.get('/salesreport',checksession,admin.getExcelReport)

//  admin  usermanagement route
router.get('/usermanagement',checksession,admin.usermgmtget)
router.get('/blockuser/:id',checksession,admin.blockUser)



router.get('/banner',checksession,admin.bannerget)

router.get('/logout',admin.logout)


module.exports=router;