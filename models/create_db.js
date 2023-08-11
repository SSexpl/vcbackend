const client= require('../db');

// const createTableQuery = `
// CREATE TABLE IF NOT EXISTS students (
//     ID SERIAL,
//     name VARCHAR(255) NOT NULL,
//     email VARCHAR(255) PRIMARY KEY,
//     registration_number VARCHAR(20) NOT NULL,
//     hostel_block VARCHAR(50),
//     room_number VARCHAR(10)
//   );
  
// `;



// const createTableQuery=`CREATE TABLE IF NOT EXISTS otps (
//   email VARCHAR(255) REFERENCES students(email),
//   otp VARCHAR(6) NOT NULL,
//   expiry_time TIMESTAMPTZ NOT NULL
// );`

const createTableQuery=`CREATE TABLE IF NOT EXISTS requests (
  
  req_id SERIAL PRIMARY KEY,
  hostel_block VARCHAR(255) NOT NULL,
  room_number VARCHAR(20) NOT NULL,
  type VARCHAR(50) ,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  verification_code CHAR(6) NOT NULL,
  completed_date DATE
);`
// Execute the SQL query to create the table
client.query(createTableQuery)
  .then(() => console.log('Created the "requests new " table'))
  .catch((err) => console.error('Error creating the table', err))
  .finally(() => client.end()); // Close the database connection after executing the query