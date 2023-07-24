const { Client } = require('pg');

const h=process.env.host;
const p=process.env.dbport;
const db=process.env.database;
const us=process.env.user;
const ps=process.env.password;
// Create a new PostgreSQL client
const client = new Client({
  host: h,
  port: p,
  database:db,
  user: us,
  password: ps,
});

// Connect to the database
client.connect()
  .then(() => console.log('Connected to the PostgreSQL database'))
  .catch((err) => console.error('Error connecting to the database', err));

module.exports = client;
