const db = require('../db/connection');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM item_types ORDER BY type_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

exports.create = async (req, res) => {
  const { type_name } = req.body;
  if (!type_name || !type_name.trim())
    return res.status(400).json({ error: 'type_name is required' });
  try {
    const [result] = await db.query('INSERT INTO item_types (type_name) VALUES (?)', [type_name.trim()]);
    res.status(201).json({ id: result.insertId, type_name: type_name.trim() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Item type already exists' });
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { type_name } = req.body;
  if (!type_name || !type_name.trim())
    return res.status(400).json({ error: 'type_name is required' });
  try {
    const [result] = await db.query('UPDATE item_types SET type_name = ? WHERE id = ?', [type_name.trim(), id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item type not found' });
    res.json({ id: parseInt(id), type_name: type_name.trim() });
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  try {
    const [items] = await db.query('SELECT id FROM items WHERE item_type_id = ?', [id]);
    if (items.length > 0)
      return res.status(409).json({ error: 'Cannot delete: items are linked to this type' });
    const [result] = await db.query('DELETE FROM item_types WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item type not found' });
    res.json({ message: 'Item type deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
};
