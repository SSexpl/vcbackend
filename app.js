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

// function to get info from req. header
function authenticateToken(req, res, next) {
  // Retrieve the token from the Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided
    return res.status(401).json({ response: 'No token provided' });
  }

  // Verify the token
  jwt.verify(token, JwtKey, (err, payload) => {
    if (err) {
      // Token verification failed
      console.log("response fail");
      return res.status(403).json({ response: 'Token verification failed' });
    }

    // Token is valid
    req.email = payload.email; // Add the username to the request object
    next();
  });
}
function checkToken(req, res, next) {
  // Retrieve the token from the Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided
    return res.status(401).json({ error: 'No token provided' });
  }
  jwt.verify(token, JwtKey, (err, payload) => {
    if (err) {
      // Token verification failed
      return res.status(403).json({ error: 'Token verification failed' });
    }

    // Token is valid // Add the username to the request object
    next();
  });
}

function StaffauthenticateToken(req, res, next) {
  // Retrieve the token from the Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided
    return res.json({ error: 'No token provided' });
  }

  // Verify the token
  jwt.verify(token, JwtKey, (err, payload) => {
    if (err) {
      // Token verification failed
      return res.status(403).json({ error: 'Token verification failed' });
    }

    // Token is valid
    req.id = payload.id; // Add the username to the request object
    next();
  });
}
app.get('/',async(req,res)=>{
  res.json({status:"up"});
})
app.post('/user/check-email', async (req, res) => {
    try {
    console.log(req.body);
      const {email} = await req.body;
      console.log(email);
      const searchEmail=email;
      const query = 'SELECT EXISTS(SELECT 1 FROM students WHERE email = $1)';
      const values = [searchEmail];
  
      const result = await client.query(query, values);
      const isEmailPresent = result.rows[0].exists;
  
      res.json({ exists: isEmailPresent });
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ error: 'An error occurred while checking the email.' });
    }
  });
  // to send otp to the users account...
  app.post('/user/send-otp', async (req, res) => {
      const { email } = req.body;
  
      // Generate OTP
      const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
  
      // Save OTP and email to the database
      const query1 = 'SELECT EXISTS(SELECT 1 FROM otps WHERE email = $1)';
      const values1 = [email];
  
      const result = await client.query(query1, values1);
      const isEmailPresent = result.rows[0].exists;
      console.log("email");
      console.log(isEmailPresent);
      if(!isEmailPresent)
      {
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 3);
      const query = 'INSERT INTO otps (email, otp,expiry_time) VALUES ($1, $2,$3)';
      const values = [email, otp,expirationTime];
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
  app.post('/user/delete-otp',async(req,res)=>
  {
    
    try{
      console.log("delete");
    const { email} = req.body;
    console.log(email);
    const values = [email];
    const deleteQuery = 'DELETE FROM otps WHERE email = $1';
    await client.query(deleteQuery, values);
    res.json({valid:true});
    }
    catch
    {
      res.json({valid:false});
    }
  });
  // Verify OTP
  app.post('/user/verify-otp', async (req, res) => {
    try {
      const { email, otp } = req.body;
  
      // Check if the OTP exists in the database
      console.log(email+" "+otp);
      const query = 'SELECT * FROM otps WHERE email = $1 AND otp = $2';
      const values = [email, otp];
      const query2 = 'SELECT * FROM otps WHERE email = $1';
      const result = await client.query(query, values);
      const result2 = await client.query(query2, [email]);
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
        else
        {
          const deleteQuery = 'DELETE FROM otps WHERE email = $1 AND otp = $2';
          await client.query(deleteQuery, values);
          res.json({ valid: false });
        }
        console.log("yes");
       
      }
      
      else {
        res.json({ valid: false });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ error: 'An error occurred while verifying the OTP.' });
    }
  });
  
  app.get('/user/protected', authenticateToken, (req, res) => {
    // Access the username from the request object
    const email = req.email;
    console.log("hit protected");
    console.log(email);
    // Use the username as needed
    res.json({email});
  });
  app.get('/user', authenticateToken, async(req, res) => { // gives back the  user details as response for incoming header token get request
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
  
  app.post('/user/apply',async(req,res)=>
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
    const verification_code=otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false,lowerCaseAlphabets:false });
    const status="ACTIVE";
    console.log(room_number,hostel_block,type,date,verification_code,status);
    const query = `
    INSERT INTO requests (hostel_block, room_number, type, date, status, verification_code)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING req_id
  `;
   try{
    const result=await client.query(query,[hostel_block,room_number,type,date,status,verification_code]);
    console.log(result);
    res.json("success");
   }
   catch{
     res.json("fail");
   }
  }
  });

  app.post('/user/status',checkToken,async(req,res)=>
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

  app.post('/user/get-code',checkToken,async(req,res)=>
  {
    console.log(req.body);
    const {room_number}=req.body;
    console.log(room_number);
     const query='SELECT verification_code FROM requests WHERE room_number = $1 AND status = $2';
     const result= await client.query(query,[room_number,"ACTIVE"]);
     //console.log(result);
     res.json(result.rows[0].verification_code);
  });
 
  app.post('/user/history' ,async(req,res)=>
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
  //================================================================
  // staff section
  //
   
  app.post('/staff/login',async(req,res)=>
  {
       const {id,password}=req.body;
      const query = 'SELECT * FROM staffs WHERE id = $1 AND password = $2';
      const values = [id, password];
      const result = await client.query(query, values);
      const l = result.rows.length;
      if(l==0) // if not valid username and password found
      {
        res.json({valid:false});
      }
      else
      {
        const payload = {id:id};

        // Create and sign the JWT token
        const token = jwt.sign(payload, JwtKey, { expiresIn: '1h' });
    
        // Send the token as a response
       // res.json({ token });
        res.json({ valid: true ,token:token });
      }

  });
  app.get('/staff',StaffauthenticateToken,async(req,res)=>
  {
    console.log("hit");
     const id=req.id;
     const query = `SELECT * FROM staffs WHERE id = '${id}'`;
     const result=await client.query(query);
     const l = result.rows.length;
      if(l==0)
      {
        res.json({valid:false});
      }
      else
      {
        const ans=result.rows[0];
       // console.log(ans);
        res.json({valid:true,ans})
      }
  })

  app.post('/staff/completed-request',async(req,res)=>
  {
    const {hostel_block}=req.body;
    try{
    const query = `SELECT * FROM requests WHERE hostel_block = '${hostel_block}' AND status = 'COMPLETED' ORDER BY date;`;
    const result=await client.query(query);
    //console.log(result);
    res.json({valid:true,result:result.rows});
    }
    catch{
      res.json({valid:false});
    }
  });
  app.post('/staff/active-request',async(req,res)=>
  {const {hostel_block}=req.body;
    try{
    const query = `SELECT * FROM requests WHERE hostel_block = '${hostel_block}'  AND status = 'ACTIVE' ORDER BY date;`;
    const result=await client.query(query);
    //console.log(result);
    res.json({valid:true,result:result.rows});
    }
    catch
    {
      res.json({valid:false});
    }
  });
  
   app.post('/staff/complete',async(req,res)=>
  {
     const {req_id,verification_code}=req.body;
     const check_query='SELECT verification_code FROM requests WHERE req_id = $1 AND status = $2';
     const check_result= await client.query(check_query,[req_id,"ACTIVE"]);
     if(check_result.rows.length!=0)
     {
       if(verification_code==check_result.rows[0].verification_code)
       {
        const query = `UPDATE requests SET status = 'COMPLETED' WHERE req_id = '${req_id}' AND verification_code = '${verification_code}';`;
        const result= await client.query(query);
        console.log("results");
        console.log(result);
        res.json({status:"pass"});
       }
       else{
        res.json({status:"wrongv"});
       }
     }
     else{
      res.json({status:"fail"});
     }
  });
  app.listen(5000);
