const express = require("express");
const { getPostgresPool } = require("../config/database");

const router = express.Router();

async function ensurePostgresTable() {
  const pool = getPostgresPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      price NUMERIC(12, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

router.use(async (req, res, next) => {
  try {
    await ensurePostgresTable();
    next();
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description, quantity = 0, price = 0 } = req.body;
    const pool = getPostgresPool();
    const { rows } = await pool.query(
      `INSERT INTO items (name, description, quantity, price)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, quantity, price]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const pool = getPostgresPool();
    const { rows } = await pool.query("SELECT * FROM items ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const pool = getPostgresPool();
    const { rows } = await pool.query("SELECT * FROM items WHERE id = $1", [req.params.id]);
    if (!rows[0]) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, description, quantity, price } = req.body;
    const pool = getPostgresPool();
    const { rows } = await pool.query(
      `UPDATE items
       SET name = $1,
           description = $2,
           quantity = $3,
           price = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, description, quantity, price, req.params.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const pool = getPostgresPool();
    const { rowCount } = await pool.query("DELETE FROM items WHERE id = $1", [req.params.id]);
    if (!rowCount) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
