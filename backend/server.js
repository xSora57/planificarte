import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import mysql from "mysql2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import fs from "fs";

// ===============================================================
// ⚙️ CONFIGURACIÓN GENERAL
// ===============================================================
const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const SECRET_KEY = "planificarte_secret_key";

// ===============================================================
// 🗄️ CONEXIÓN MYSQL
// ===============================================================
const db = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "1234",
  database: "crm_dibujantes",
});

db.connect((err) => {
  if (err) console.error("❌ Error al conectar a MySQL:", err);
  else console.log("✅ Conectado a MySQL");
});

// ===============================================================
// 🖼️ CONFIGURACIÓN DE MULTER
// ===============================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ===============================================================
// 🔐 SESIONES + PASSPORT
// ===============================================================
app.use(
  session({
    secret: "planificarte_session",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ===============================================================
// 🔑 ESTRATEGIA GOOGLE
// ===============================================================
const googleConfig = JSON.parse(
  fs.readFileSync(
    "./client_secret_399007858065-p8kv5inj7ebqcb7aaoks3kp7kpidjpjk.apps.googleusercontent.com.json"
  )
);

const { client_id, client_secret, redirect_uris } = googleConfig.web;

passport.use(
  new GoogleStrategy(
    {
      clientID: client_id,
      clientSecret: client_secret,
      callbackURL: redirect_uris[0], // normalmente: http://localhost:5000/auth/google/callback
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;
      const username = profile.displayName;

      db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, results) => {
          if (err) return done(err);

          if (results.length > 0) {
            return done(null, results[0]);
          } else {
            const hashed = await bcrypt.hash("google_auth", 10);
            db.query(
              "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
              [username, email, hashed],
              (err, res) => {
                if (err) return done(err);
                return done(null, { id: res.insertId, username, email });
              }
            );
          }
        }
      );
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ===============================================================
// 🧑‍💻 LOGIN LOCAL
// ===============================================================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
    if (err) return res.status(500).send("Error interno");
    if (results.length === 0) return res.status(401).send("Usuario no encontrado");

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).send("Contraseña incorrecta");

    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: "2h" }
    );
    res.json({ token });
  });
});

// ===============================================================
// 🔑 LOGIN CON GOOGLE
// ===============================================================
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/login", session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, username: req.user.username },
      SECRET_KEY,
      { expiresIn: "2h" }
    );
    res.redirect(`http://localhost:3000/login?token=${token}`);
  }
);

// ===============================================================
// 👥 CLIENTES
// ===============================================================
app.get("/api/clients", (req, res) => {
  db.query("SELECT * FROM clients", (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data);
  });
});

app.post("/api/clients", (req, res) => {
  const { name, email, phone } = req.body;
  db.query(
    "INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)",
    [name, email, phone],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Cliente agregado");
    }
  );
});

app.delete("/api/clients/:id", (req, res) => {
  db.query("DELETE FROM clients WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send("Cliente eliminado");
  });
});

// ===============================================================
// 🎨 PROYECTOS
// ===============================================================
app.get("/api/projects", (req, res) => {
  const sql = `
    SELECT projects.*, clients.name AS client_name
    FROM projects
    LEFT JOIN clients ON projects.client_id = clients.id
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

app.post("/api/projects", upload.single("image"), (req, res) => {
  const { name, client_id, status } = req.body;
  const image = req.file ? req.file.filename : null;

  db.query(
    "INSERT INTO projects (name, client_id, status, image) VALUES (?, ?, ?, ?)",
    [name, client_id || null, status || "En progreso", image],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Proyecto guardado correctamente");
    }
  );
});

app.delete("/api/projects/:id", (req, res) => {
  db.query("DELETE FROM projects WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send("Proyecto eliminado");
  });
});

// ===============================================================
// 🚀 SERVIDOR
// ===============================================================
app.listen(5000, () =>
  console.log("🎨 PlanificArte backend en http://localhost:5000")
);
