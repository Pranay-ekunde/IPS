const db = require('../db/connection');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT i.id, i.name, i.purchase_date, i.unit_price, i.stock_available, i.active,
             i.created_at, i.updated_at,
             it.id AS item_type_id, it.type_name
      FROM items i
      LEFT JOIN item_types it ON i.item_type_id = it.id
      ORDER BY i.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT i.id, i.name, i.purchase_date, i.unit_price, i.stock_available, i.active,
             i.created_at, i.updated_at,
             it.id AS item_type_id, it.type_name
      FROM items i
      LEFT JOIN item_types it ON i.item_type_id = it.id
      WHERE i.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

exports.create = async (req, res) => {
  const { name, item_type_id, purchase_date, unit_price, stock_available, active } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'Item name is required' });
  if (!item_type_id) return res.status(400).json({ error: 'Item type is required' });
  if (!purchase_date) return res.status(400).json({ error: 'Purchase date is required' });
  
  const priceVal = parseFloat(unit_price);
  if (unit_price === undefined || unit_price === null || unit_price === '' || isNaN(priceVal) || priceVal < 0) {
    return res.status(400).json({ error: 'Valid price (non-negative) is required' });
  }

  const stockVal = parseInt(stock_available);
  if (stock_available === undefined || stock_available === null || stock_available === '' || isNaN(stockVal)) {
    return res.status(400).json({ error: 'Valid stock number is required' });
  }
  if (stockVal < 0) return res.status(400).json({ error: 'Stock cannot be negative' });
  if (active === undefined || active === null) return res.status(400).json({ error: 'Status (active) is required' });

  try {
    const [types] = await db.query('SELECT id FROM item_types WHERE id = ?', [item_type_id]);
    if (types.length === 0) return res.status(400).json({ error: 'Invalid item type' });

    const [result] = await db.query(
      'INSERT INTO items (name, item_type_id, purchase_date, unit_price, stock_available, active) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), item_type_id, purchase_date, priceVal, stockVal, active ? 1 : 0]
    );
    const [newItem] = await db.query(`
      SELECT i.*, it.type_name FROM items i
      LEFT JOIN item_types it ON i.item_type_id = it.id WHERE i.id = ?
    `, [result.insertId]);
    res.status(201).json(newItem[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, item_type_id, purchase_date, unit_price, stock_available, active } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'Item name is required' });
  if (!item_type_id) return res.status(400).json({ error: 'Item type is required' });
  if (!purchase_date) return res.status(400).json({ error: 'Purchase date is required' });

  const priceVal = parseFloat(unit_price);
  if (unit_price === undefined || unit_price === null || unit_price === '' || isNaN(priceVal) || priceVal < 0) {
    return res.status(400).json({ error: 'Valid price (non-negative) is required' });
  }

  const stockVal = parseInt(stock_available);
  if (stock_available === undefined || stock_available === null || stock_available === '' || isNaN(stockVal)) {
    return res.status(400).json({ error: 'Valid stock number is required' });
  }
  if (stockVal < 0) return res.status(400).json({ error: 'Stock cannot be negative' });

  try {
    const [types] = await db.query('SELECT id FROM item_types WHERE id = ?', [item_type_id]);
    if (types.length === 0) return res.status(400).json({ error: 'Invalid item type' });

    const [result] = await db.query(
      'UPDATE items SET name=?, item_type_id=?, purchase_date=?, unit_price=?, stock_available=?, active=? WHERE id=?',
      [name.trim(), item_type_id, purchase_date, priceVal, stockVal, active ? 1 : 0, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });

    const [updated] = await db.query(`
      SELECT i.*, it.type_name FROM items i
      LEFT JOIN item_types it ON i.item_type_id = it.id WHERE i.id = ?
    `, [id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  try {
    const [used] = await db.query('SELECT id FROM purchase_items WHERE item_id = ?', [id]);
    if (used.length > 0)
      return res.status(409).json({ error: 'Item has purchase history. Deactivate it instead of deleting.' });

    const [result] = await db.query('DELETE FROM items WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

exports.toggleActive = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT active FROM items WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    const newStatus = rows[0].active ? 0 : 1;
    await db.query('UPDATE items SET active = ? WHERE id = ?', [newStatus, id]);
    res.json({ id: parseInt(id), active: !!newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
};
