const { Client } = require('pg');

const connectionString = 'postgresql://adbuth_db_user:HZTlEnkr45ByX8etqB5yWJfNj3IrbWkT@dpg-d7qte377f7vs73chdueg-a.oregon-postgres.render.com/adbuth_db?ssl=true';

const client = new Client({
  connectionString: connectionString,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

async function test() {
  try {
    console.log('Attempting to connect to live database...');
    await client.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Database time:', res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error('Connection failed!', err.message);
    console.error('Full error:', err);
  }
}

test();
