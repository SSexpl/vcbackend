const express=require('express');
require('dotenv').config();
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');  
const sgMail = require('@sendgrid/mail');
const mailer=process.env.MAIL_API;
sgMail.setApiKey(mailer);
//console.log(mailer);
const jwt=require('jsonwebtoken');
const JwtKey=process.env.JwtKey;
console.log(JwtKey);
const cors=require('cors');
const bodyParser=require('body-parser');
var app=express();
// middleware..
app.use(express.json());
app.use(cors());// without this req res cant be made over local host.
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
const client = require('./db');// the database is connected now we can use the inside otps
// for checking the email is valid or not
const utils=require('./utility/auth');
const authenticateToken=utils.authenticateToken;
const checkToken=utils.checkToken;
const StaffauthenticateToken=utils.StaffauthenticateToken;
const port=3000||process.env.PORT;
const staff=require('./router/staff');
const user=require('./router/user');
app.use('/user',user);
app.use('/staff',staff);

app.get('/',async(req,res)=>{
  res.json({status:"up"});
})


  app.listen(port,"0.0.0.0");
