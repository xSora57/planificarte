import express from "express";
import cors from "cors";
import multer from "multer";
import mysql from "mysql2";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 5000;

// Necesario para __dirname en ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Conexión MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",       // 👈 pon tu usuario
  password: "r2dedos",       // 👈 pon tu contraseña si tienes
  database: "crm_dibujantes"
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error al conectar con MySQL:", err);
  } else {
    console.log("✅ Conectado a MySQL");
  }
});

// Configuración para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// --- RUTAS ---

// Obtener todos los clientes
app.get("/api/clients", (req, res) => {
  db.query("SELECT * FROM clients", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Agregar cliente
app.post("/api/clients", (req, res) => {
  const { name, email, phone } = req.body;
  db.query(
    "INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)",
    [name, email, phone],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, name, email, phone });
    }
  );
});

// Eliminar cliente
app.delete("/api/clients/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM clients WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post("/api/projects", upload.single("image"), (req, res) => {
  // ⚠️ multer no procesa JSON, así que req.body llega como texto plano
  const { name, client_id, status } = req.body;
  const image = req.file ? req.file.filename : null;

  console.log("📩 Datos recibidos:", req.body);
  console.log("📸 Archivo recibido:", req.file);

  if (!name) {
    return res.status(400).send("Falta el nombre del proyecto");
  }

  const sql = "INSERT INTO projects (name, client_id, status, image) VALUES (?, ?, ?, ?)";
  const values = [name, client_id || null, status || "En progreso", image];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("❌ Error al guardar el proyecto:", err);
      return res.status(500).send("Error al guardar el proyecto");
    }
    console.log("✅ Proyecto guardado correctamente");
    res.send("Proyecto guardado correctamente");
  });
});
