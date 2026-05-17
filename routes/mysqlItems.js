const express = require("express");
const { getMySQLConnection } = require("../config/database");

const router = express.Router();

async function ensureMySQLTable() {
  const connection = getMySQLConnection();
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS items (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      quantity INT NOT NULL DEFAULT 0,
      price DECIMAL(12,2) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);
}

router.use(async (req, res, next) => {
  try {
    await ensureMySQLTable();
    next();
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description, quantity = 0, price = 0 } = req.body;
    const connection = getMySQLConnection();
    const [result] = await connection.execute(
      "INSERT INTO items (name, description, quantity, price) VALUES (?, ?, ?, ?)",
      [name, description, quantity, price]
    );
    const [rows] = await connection.execute("SELECT * FROM items WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const connection = getMySQLConnection();
    const [rows] = await connection.execute("SELECT * FROM items ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const connection = getMySQLConnection();
    const [rows] = await connection.execute("SELECT * FROM items WHERE id = ?", [req.params.id]);
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
    const connection = getMySQLConnection();
    const [result] = await connection.execute(
      `UPDATE items SET name = ?, description = ?, quantity = ?, price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, description, quantity, price, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Item not found" });
    }
    const [rows] = await connection.execute("SELECT * FROM items WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const connection = getMySQLConnection();
    const [result] = await connection.execute("DELETE FROM items WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
