const express= require('express')
const app=express()
const adminrouter=require('./router/admin')
const userrouter=require('./router/user')
const productrouter=require('./router/product')
const categoryrouter=require('./router/category')
const cartrouter=require('./router/cart')
const profilerouter=require('./router/profile')
const orderrouter=require('./router/order')
const paymentrouter=require('./router/payment')
const couponrouter= require('./router/coupon')
const wishlistrouter = require('./router/wishlist')
const offerrouter = require('./router/offer')
const nocache=require('nocache')
const session=require('express-session')
const mongoose =require('mongoose')
const morgan=require('morgan')
require("dotenv").config();




const path=require('path')

// creating session

app.use(session({
    secret:"secret",
    saveUninitialized:true,
    resave:false
}))

app.use(nocache())

app.use(morgan('tiny'))

//mongo connection 

mongoose.connect(process.env.mongo) 
.then(()=>{
    console.log('connected to mongo user')
})

.catch((Error)=>{
    console.log('error connecting mongo',Error);
})
 

//setting up the view engine 
app.set('view engine','ejs')
// for setting the admin and user view in seperate folder
app.set('views',['./views/userview','./views/adminview'])

//for viewing the static content like css and images
app.use('/',express.static(path.join(__dirname,'assets')))
app.use('/public',express.static(path.join(__dirname,'public')))

//middleware for data parseing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// route middleware
app.use('/',userrouter)
app.use('/admin',adminrouter)
app.use("/",productrouter)
app.use('/',categoryrouter)
app.use('/',cartrouter)
app.use('/',profilerouter)
app.use('/',orderrouter)
app.use('/',paymentrouter)
app.use('/',couponrouter)
app.use('/',wishlistrouter)
app.use('/',offerrouter)


//server created on port 3000

const port =3000||process.env.port
app.listen(port,()=>console.log(`server running on http://localhost:3000`))