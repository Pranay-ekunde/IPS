const fs = require('fs');
const path = require('path');
const db = require('./connection');

async function initDb() {
  try {
    const [tables] = await db.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    const requiredTables = ['item_types', 'items', 'purchases', 'purchase_items'];
    const missing = requiredTables.filter(t => !tableNames.includes(t));

    if (missing.length === 0) {
      console.log('Database tables verified successfully.');
      return;
    }

    console.log(`Missing tables detected: ${missing.join(', ')}. Initializing schema...`);
    const schemaPath = path.join(__dirname, '../../schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.warn('schema.sql file not found at:', schemaPath);
      return;
    }

    const rawSql = fs.readFileSync(schemaPath, 'utf8');
    const cleanSql = rawSql
      .split('\n')
      .map(line => line.trim().startsWith('--') ? '' : line)
      .join('\n');

    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await db.query(statement);
      } catch (err) {
        console.warn('Schema statement warning:', err.message);
      }
    }
    console.log('Database schema initialization completed successfully.');
  } catch (err) {
    console.error('Database initialization error:', err.message);
  }
}

module.exports = initDb;
