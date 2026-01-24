import { Pool } from 'pg';

async function debug() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const result = await pool.query('SELECT id, email FROM "User" LIMIT 10');

    console.log('\n=== Users in Database ===');
    console.log(`Found ${result.rows.length} user(s)\n`);

    result.rows.forEach((u: any) => {
      console.log(`ID: "${u.id}"`);
      console.log(`ID length: ${u.id.length}`);
      console.log(`Email: ${u.email}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await pool.end();
  }
}

debug();
