const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/auth");
const multer = require("multer");

// CONFIGURAR SUBIDA DE IMÁGENES
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });


// ➤ OBTENER STOCK
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM stock ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener stock:", err);
    res.status(500).json({ error: "Error al obtener stock" });
  }
});


// ➤ CREAR PRODUCTO NUEVO
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { name, quantity } = req.body;
    const image = req.file ? req.file.path : null;


    await db.query(
      "INSERT INTO stock (name, quantity, image) VALUES (?, ?, ?)",
      [name, quantity, image]
    );

    res.json({ message: "Producto creado correctamente" });
  } catch (err) {
    console.error("Error al crear producto:", err);
    res.status(500).json({ error: "Error al crear producto" });
  }
});


// ➤ ACTUALIZAR STOCK (SUMAR O RESTAR)
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { change } = req.body;

    await db.query(
      "UPDATE stock SET quantity = quantity + ? WHERE id = ?",
      [change, id]
    );

    res.json({ message: "Stock actualizado" });
  } catch (err) {
    console.error("Error al actualizar stock:", err);
    res.status(500).json({ error: "Error al actualizar stock" });
  }
});


// ➤ ELIMINAR PRODUCTO
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM stock WHERE id = ?", [id]);

    res.json({ message: "Producto eliminado" });
  } catch (err) {
    console.error("Error al eliminar producto:", err);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});


module.exports = router;
