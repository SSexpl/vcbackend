
const jwt=require('jsonwebtoken');
const JwtKey=process.env.JwtKey;

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

  module.exports={authenticateToken,StaffauthenticateToken,checkToken};


