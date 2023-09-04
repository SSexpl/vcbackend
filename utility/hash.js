//this will return the hash of the given text
const bcrypt = require('bcrypt');
async function hashFunction(text) {
    try {
      // Generate a salt
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
  
      // Hash the OTP and email using the generated salt
      const hashedtxt = await bcrypt.hash(text, salt);
     console.log(hashedtxt);
      return { hashedtxt}; // Return both hashed OTP and hashed email as "hashedPassword"
    } catch (error) {
      throw error;
    }
}

module.exports={hashFunction};