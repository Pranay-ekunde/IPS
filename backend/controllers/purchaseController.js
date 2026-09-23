const db = require('../db/connection');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM purchases ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

exports.getOne = async (req, res) => {
  const { id } = req.params;
  try {
    const [purchase] = await db.query('SELECT * FROM purchases WHERE id = ?', [id]);
    if (purchase.length === 0) return res.status(404).json({ error: 'Purchase not found' });

    const [items] = await db.query(`
      SELECT p.order_id, p.purchase_date, p.total_amount,
             i.id AS item_id, i.name AS item_name, i.stock_available,
             it.type_name, pi.id AS purchase_item_id, pi.quantity,
             COALESCE(pi.unit_price, i.unit_price) AS unit_price,
             (pi.quantity * COALESCE(pi.unit_price, i.unit_price)) AS line_total
      FROM purchases p
      JOIN purchase_items pi ON p.id = pi.purchase_id
      JOIN items i ON pi.item_id = i.id
      LEFT JOIN item_types it ON i.item_type_id = it.id
      WHERE p.id = ?
    `, [id]);

    res.json({ ...purchase[0], items });
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

exports.create = async (req, res) => {
  const { order_id, purchase_date, items } = req.body;

  if (!order_id || !order_id.trim()) return res.status(400).json({ error: 'Order ID is required' });
  if (!purchase_date) return res.status(400).json({ error: 'Purchase date is required' });
  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'Purchase must contain at least one item' });

  // Check duplicate item_ids in request
  const itemIds = items.map(i => i.item_id);
  if (new Set(itemIds).size !== itemIds.length)
    return res.status(400).json({ error: 'Duplicate items in order are not allowed' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let totalAmount = 0;
    const validatedLines = [];

    // Validate each item
    for (const line of items) {
      if (!line.item_id) throw { status: 400, error: 'item_id is required for each line' };
      const qty = parseInt(line.quantity);
      if (isNaN(qty) || qty <= 0)
        throw { status: 400, error: 'Quantity must be a positive integer' };

      const [rows] = await conn.query('SELECT * FROM items WHERE id = ?', [line.item_id]);
      if (rows.length === 0) throw { status: 404, error: `Item ID ${line.item_id} not found` };
      if (!rows[0].active) throw { status: 400, error: `Item "${rows[0].name}" is inactive and cannot be purchased` };
      if (rows[0].stock_available < qty)
        throw { status: 409, error: `Insufficient stock for "${rows[0].name}". Available: ${rows[0].stock_available}` };

      const unitPrice = line.unit_price !== undefined ? parseFloat(line.unit_price) : parseFloat(rows[0].unit_price || 0);
      const lineTotal = qty * unitPrice;
      totalAmount += lineTotal;

      validatedLines.push({
        item_id: line.item_id,
        quantity: qty,
        unit_price: unitPrice
      });
    }

    // Check duplicate order_id
    const [existing] = await conn.query('SELECT id FROM purchases WHERE order_id = ?', [order_id.trim()]);
    if (existing.length > 0) throw { status: 409, error: 'Order ID already exists' };

    // Insert purchase header
    const [purchaseResult] = await conn.query(
      'INSERT INTO purchases (order_id, purchase_date, total_amount) VALUES (?, ?, ?)',
      [order_id.trim(), purchase_date, totalAmount]
    );
    const purchaseId = purchaseResult.insertId;

    // Insert line items and deduct stock
    for (const line of validatedLines) {
      await conn.query(
        'INSERT INTO purchase_items (purchase_id, item_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [purchaseId, line.item_id, line.quantity, line.unit_price]
      );
      await conn.query(
        'UPDATE items SET stock_available = stock_available - ? WHERE id = ?',
        [line.quantity, line.item_id]
      );
    }

    await conn.commit();
    res.status(201).json({
      message: 'Purchase created successfully',
      purchase_id: purchaseId,
      order_id: order_id.trim(),
      total_amount: totalAmount
    });
  } catch (err) {
    await conn.rollback();
    if (err.status) return res.status(err.status).json({ error: err.error });
    res.status(500).json({ error: 'Database error', detail: err.message });
  } finally {
    conn.release();
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { purchase_date, items } = req.body;

  if (!purchase_date) return res.status(400).json({ error: 'Purchase date is required' });
  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'Purchase must contain at least one item' });

  const itemIds = items.map(i => i.item_id);
  if (new Set(itemIds).size !== itemIds.length)
    return res.status(400).json({ error: 'Duplicate items in order are not allowed' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [purchase] = await conn.query('SELECT * FROM purchases WHERE id = ?', [id]);
    if (purchase.length === 0) throw { status: 404, error: 'Purchase not found' };

    // Get old purchase items
    const [oldItems] = await conn.query('SELECT * FROM purchase_items WHERE purchase_id = ?', [id]);
    const oldItemIds = oldItems.map(o => o.item_id);

    // Restore old stock
    for (const old of oldItems) {
      await conn.query('UPDATE items SET stock_available = stock_available + ? WHERE id = ?',
        [old.quantity, old.item_id]);
    }

    let totalAmount = 0;
    const validatedLines = [];

    // Validate new items and deduct
    for (const line of items) {
      if (!line.item_id) throw { status: 400, error: 'item_id is required for each line' };
      const qty = parseInt(line.quantity);
      if (isNaN(qty) || qty <= 0)
        throw { status: 400, error: 'Quantity must be a positive integer' };

      const [rows] = await conn.query('SELECT * FROM items WHERE id = ?', [line.item_id]);
      if (rows.length === 0) throw { status: 404, error: `Item ID ${line.item_id} not found` };
      
      const isExistingLine = oldItemIds.includes(line.item_id);
      if (!isExistingLine && !rows[0].active) {
        throw { status: 400, error: `Item "${rows[0].name}" is inactive` };
      }
      if (rows[0].stock_available < qty)
        throw { status: 409, error: `Insufficient stock for "${rows[0].name}". Available: ${rows[0].stock_available}` };

      const unitPrice = line.unit_price !== undefined ? parseFloat(line.unit_price) : parseFloat(rows[0].unit_price || 0);
      totalAmount += qty * unitPrice;

      validatedLines.push({
        item_id: line.item_id,
        quantity: qty,
        unit_price: unitPrice
      });
    }

    // Delete old purchase_items and insert new ones
    await conn.query('DELETE FROM purchase_items WHERE purchase_id = ?', [id]);
    await conn.query('UPDATE purchases SET purchase_date = ?, total_amount = ? WHERE id = ?', [purchase_date, totalAmount, id]);

    for (const line of validatedLines) {
      await conn.query(
        'INSERT INTO purchase_items (purchase_id, item_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [id, line.item_id, line.quantity, line.unit_price]
      );
      await conn.query(
        'UPDATE items SET stock_available = stock_available - ? WHERE id = ?',
        [line.quantity, line.item_id]
      );
    }

    await conn.commit();
    res.json({ message: 'Purchase updated successfully', total_amount: totalAmount });
  } catch (err) {
    await conn.rollback();
    if (err.status) return res.status(err.status).json({ error: err.error });
    res.status(500).json({ error: 'Database error', detail: err.message });
  } finally {
    conn.release();
  }
};
