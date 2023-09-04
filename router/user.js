const express = require('express')
const router = express.Router();
//all inbuilt modules needed
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');  
const sgMail = require('@sendgrid/mail');

const jwt=require('jsonwebtoken');
const JwtKey=process.env.JwtKey;
//the utility functions
const utils=require('../utility/auth');
const utils_hash=require('../utility/hash')
const authenticateToken=utils.authenticateToken;
const checkToken=utils.checkToken;
const hashFunction=utils_hash.hashFunction;
//-----------mailer
const mailer=process.env.MAIL_API;
sgMail.setApiKey(mailer);
//connector to the db
const client = require('../db');
router.get('/', authenticateToken, async(req, res) => { // gives back the  user details as response for incoming header token get request
    // Access the username from the request object
    const email = req.email;
    //console.log("hit protected");
    console.log(email);

    const query='SELECT * FROM students WHERE email = $1';//returns an array of object containing the information where each column is an key:value
   const result= await client.query(query,[email]);

    // Use the username as needed
    if(result.rows.length!=0)//[{1},{2},{3}....]
    {
      const response=result.rows[0];//object out of n rows
    res.json({state:true,response});
    }
    else
    res.json({state:false});
  });

router.post('/check-email', async (req, res) => {
    try {
    console.log(req.body);
      const {email} = await req.body;
      console.log(email);
      const searchEmail=email;
      const query = 'SELECT EXISTS(SELECT 1 FROM students WHERE email = $1)';
      const values = [searchEmail];
  
      const result = await client.query(query, values);
      const isEmailPresent = result.rows[0].exists; //exits is a var in object
  
      res.json({ exists: isEmailPresent });//returns a true false
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ error: 'An error occurred while checking the email.' });
    }
  });
  // to send otp to the users account...
  router.post('/send-otp', async (req, res) => {
      const { email } = req.body;
  
      // Generate OTP
      const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false,lowerCaseAlphabets:false,digits:true });
  
      // Check if this otp is not present in the email..
      const {hashed_otp}=await hashFunction(otp);
      console.log(email+" "+hashed_otp);
      const query1 = 'SELECT EXISTS(SELECT 1 FROM otps WHERE email = $1)';
      const values1 = [email];
  
      const result = await client.query(query1, values1);
      const isEmailPresent = result.rows[0].exists; //check if the email is present or not
      //sample response :
      // {
      //   "rows": [
      //     {
      //       "exists": true
      //     }
      //   ]
      // }
      
      console.log("email");
      console.log(isEmailPresent);
      if(!isEmailPresent)
      {
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 4);
      const query = 'INSERT INTO otps (email, otp,expiry_time) VALUES ($1, $2,$3)';
      const values = [email, hashed_otp,expirationTime];
      await client.query(query, values);
       // Send OTP via email
       const msg = {
        to: email, // Change to your recipient
        from: 'shivansh.sahai03@gmail.com', // Change to your verified sender
        subject: 'Otp verification',
        text: `Dear user your otp is :  ${otp}`,
        html: `<strong>Dear user your otp is :  ${otp}</strong>`,
      }
      sgMail
        .send(msg)
        .then(() => {
          console.log('Email sent');
          res.json({state:"pass"});
        })
        .catch((error) => {
          console.error(error);
          res.json({state:"fail"});
        })
      }
      else
      res.json({state:"check-inbox"});
      
      
  });
  router.post('/delete-otp',async(req,res)=>
  {
    
    try{
      console.log("delete");
    const { email} = req.body;
    console.log(email);
    const values = [email];
    const deleteQuery = 'DELETE FROM otps WHERE email = $1'; //this affects some number of rows {rowCount:p} if no such data p=0;
    await client.query(deleteQuery, values);
    res.json({valid:true});
    }
    catch
    {
      res.json({valid:false});
    }
  });
  // Verify OTP
  router.post('/verify-otp', async (req, res) => {
    try {
      const { email, otp } = req.body;
      const {hashed_otp}=await hashFunction(otp);
      // Check if the OTP ,email pair exists in the database
      console.log(email+" "+otp);
      const query = 'SELECT * FROM otps WHERE email = $1 AND otp = $2';
      //sample response:
      // {
      //   "rowCount": 1, if no match for condition then rowCount=0;
      //   "rows": [
      //     {
      //       "id": 1,
      //       "email": "john@example.com",
      //       "otp": "123456",
      //       "created_at": "2023-08-05T12:34:56.789Z"
      //     }
      //   ]
      // }
      const values = [email, hashed_otp];
      const query2 = 'SELECT * FROM otps WHERE email = $1';
      const result = await client.query(query, values); // to check if the otp is correct or not
      const result2 = await client.query(query2, [email]); // to check that the email is present or not
      console.log(result.rows);
      console.log(result2.rows);
      const isOTPValid = result.rows.length;
      
      console.log(isOTPValid);
      if (isOTPValid) {
         // Delete the OTP from the database 
         console.log(result.rows[0]);
         const time_limit=result.rows[0].expiry_time;
         console.log(isOTPValid);
         const currentTime = new Date();
         console.log(currentTime<=time_limit);
         console.log(currentTime +" "+time_limit);
        if(currentTime<=time_limit)
        {
          const deleteQuery = 'DELETE FROM otps WHERE email = $1 AND otp = $2';
          await client.query(deleteQuery, values);
          const payload = { email:email };
        
          // Create and sign the JWT token
          const token = jwt.sign(payload, JwtKey, { expiresIn: '30d' });
      
          // Send the token as a response
         // res.json({ token });
          res.json({ valid: true ,token:token });
          
        }
        else // match found but the timeslot exceeds
        {
          const deleteQuery = 'DELETE FROM otps WHERE email = $1 AND otp = $2';
          await client.query(deleteQuery, values);
          res.json({ valid: false });
        }
        console.log("yes");
       
      }
      
      else { // the case in which there is no match
        res.json({ valid: false });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ error: 'An error occurred while verifying the OTP.' });
    }
  });
  
  router.get('/protected', authenticateToken, (req, res) => {
    // Access the username from the request object
    const email = req.email;
    console.log("hit protected");
    console.log(email);
    // Use the username as needed
    res.json({email});
  });
  router.get('/', authenticateToken, async(req, res) => { // gives back the  user details as response for incoming header token get request
    // Access the username from the request object
    const email = req.email;
    //console.log("hit protected");
    console.log(email);

    const query='SELECT * FROM students WHERE email = $1';
   const result= await client.query(query,[email]);

    // Use the username as needed
    if(result.rows.length!=0)
    {
      const response=result.rows[0];
    res.json({response});
    }
    else
    res.json({state:false});
  });
  
  router.post('/apply',async(req,res)=>
  {
    console.log("applying");
    console.log(req.body);
     const {room_number,hostel_block,type}=req.body;
     const query_check='SELECT * FROM requests WHERE room_number = $1 AND status = $2';
     const result= await client.query(query_check,[room_number,"ACTIVE"]);
  
      // Use the username as needed
      if(result.rows.length!=0)
      {
        res.json("already-in progress");
      }
    else{
    const date=new Date();
    const verification_code=otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false,lowerCaseAlphabets:false,digits:true });
    const status="ACTIVE";
    console.log(room_number,hostel_block,type,date,verification_code,status);
    const query = `
    INSERT INTO requests (hostel_block, room_number, type, date, status, verification_code)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING req_id
  `;
   try{
    const result=await client.query(query,[hostel_block,room_number,type,date,status,verification_code]); //all the [values] paramter for query.
    console.log(result);
    res.json("success");
   }
   catch{
     res.json("fail");
   }
  }
  });

  router.post('/status',checkToken,async(req,res)=> //current request details...
  {
     const {room_number}=req.body;
     console.log(room_number);
     const query_check='SELECT * FROM requests WHERE room_number = $1 AND status = $2';
     const result= await client.query(query_check,[room_number,"ACTIVE"]);
     console.log("requested status");
      // Use the username as needed
      if(result.rows.length!=0)
      {
        res.json({state:1,details:result.rows[0]}); // 1 for active status 
      }
      else
      {
        res.json({state:0}); // 0 for no request status
      }
  });

  router.post('/get-code',checkToken,async(req,res)=>
  {
    console.log(req.body);
    const {room_number}=req.body;
    console.log(room_number);
     const query='SELECT verification_code FROM requests WHERE room_number = $1 AND status = $2';
     const result= await client.query(query,[room_number,"ACTIVE"]);
     //console.log(result);
     res.json(result.rows[0].verification_code);
  });
 
  router.post('/history' ,async(req,res)=>
  {
    const {room_number}=req.body;
    console.log("history is called");
    console.log(room_number);
    const query = `SELECT * FROM requests WHERE room_number = '${room_number}' AND status = 'COMPLETED' ORDER BY date DESC;`;
    const result=await client.query(query);
    if(result.rows.length!=0)
    {
      const ans=result.rows;
      console.log(ans);
      res.json({status:"pass",ans});
    }
    else
    res.json({status:"empty"});
  })

  module.exports=router;