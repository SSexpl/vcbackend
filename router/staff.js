const express = require('express')
const router = express.Router();
const utils=require('../utility/auth');

const jwt=require('jsonwebtoken');
const JwtKey=process.env.JwtKey;
const StaffauthenticateToken=utils.StaffauthenticateToken;
const checkToken=utils.checkToken;
const client = require('../db');
router.get('/staff',StaffauthenticateToken,async(req,res)=>
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

router.post('/login',async(req,res)=>
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
 

  router.post('/completed-request',async(req,res)=>
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
  router.post('/active-request',async(req,res)=>
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
  
router.post('/complete',async(req,res)=>
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
  module.exports=router;
