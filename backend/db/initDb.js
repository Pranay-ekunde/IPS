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
      await runMigrations();
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
    await runMigrations();
  } catch (err) {
    console.error('Database initialization error:', err.message);
  }
}

async function runMigrations() {
  try {
    const [itemCols] = await db.query("SHOW COLUMNS FROM items LIKE 'unit_price'");
    if (itemCols.length === 0) {
      console.log('Adding unit_price column to items table...');
      await db.query('ALTER TABLE items ADD COLUMN unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00');
      await db.query("UPDATE items SET unit_price = 999.99 WHERE name = 'Laptop'");
      await db.query("UPDATE items SET unit_price = 25.00 WHERE name = 'Mouse'");
      await db.query("UPDATE items SET unit_price = 45.00 WHERE name = 'Keyboard'");
      await db.query("UPDATE items SET unit_price = 120.00 WHERE name = 'Chair'");
      await db.query("UPDATE items SET unit_price = 250.00 WHERE name = 'Desk'");
    }

    const [purchCols] = await db.query("SHOW COLUMNS FROM purchases LIKE 'total_amount'");
    if (purchCols.length === 0) {
      console.log('Adding total_amount column to purchases table...');
      await db.query('ALTER TABLE purchases ADD COLUMN total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00');
    }

    const [purchItemCols] = await db.query("SHOW COLUMNS FROM purchase_items LIKE 'unit_price'");
    if (purchItemCols.length === 0) {
      console.log('Adding unit_price column to purchase_items table...');
      await db.query('ALTER TABLE purchase_items ADD COLUMN unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00');
    }
  } catch (err) {
    console.warn('Migration warning:', err.message);
  }
}

module.exports = initDb;
