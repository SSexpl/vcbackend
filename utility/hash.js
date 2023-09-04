const crypto = require('crypto');

// Define your constant salt (replace with your own value)
const constantSalt = 'MyConstantSalt';

// Function to hash a string using a constant salt
 function hashFunction(inputString) {
  const hash = crypto.createHash('sha256');
  hash.update(inputString + constantSalt);
  return hash.digest('hex');
}
module.exports={hashFunction};