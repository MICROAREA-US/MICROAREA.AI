const db = require('./db');

async function checkTables() {
  try {
    const res = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in database:');
    res.rows.forEach(r => console.log(` - ${r.table_name}`));
  } catch (e) {
    console.error('Error querying tables:', e.message);
  } finally {
    process.exit(0);
  }
}

checkTables();
