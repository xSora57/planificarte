const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/auth");


// ➤ Obtener TODOS los eventos del usuario
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM events WHERE user_id = ? ORDER BY date ASC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener eventos" });
  }
});


// ➤ Crear evento nuevo
router.post("/", auth, async (req, res) => {
  try {
    const { title, date, description } = req.body;

    await db.query(
      "INSERT INTO events (user_id, title, date, description) VALUES (?, ?, ?, ?)",
      [req.user.id, title, date, description]
    );

    res.json({ message: "Evento creado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear evento" });
  }
});


// ➤ Eliminar evento
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query(
      "DELETE FROM events WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    res.json({ message: "Evento eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar evento" });
  }
});

module.exports = router;
