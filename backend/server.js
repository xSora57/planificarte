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

// CONFIGURACIÓN GENERAL
const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "http://192.168.0.145:3000"],
  credentials: true
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));
const SECRET_KEY = "planificarte_secret_key";
// MIDDLEWARE: VERIFICAR TOKEN
const verifyToken = (req, res, next) => {
  const header = req.headers["authorization"];
  const token = header && header.split(" ")[1];

  if (!token) return res.status(401).send("Token no proporcionado");

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).send("Token inválido");
    req.user = user;
    next();
  });
};
// CONEXIÓN MYSQL
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

// CONFIGURACIÓN DE MULTER
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// SESIONES + PASSPORT
app.use(
  session({
    secret: "planificarte_session",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cors({ origin: ["http://localhost:3000", "http://192.168.0.145:3000"], credentials: true }));

// ESTRATEGIA GOOGLE
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
      callbackURL: redirect_uris[0],
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;
      const username = profile.displayName;

      db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
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
      });
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));




// LOGIN LOCAL
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

//  LOGIN CON GOOGLE
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


//  CLIENTES
app.get("/api/clients", verifyToken, (req, res) => {
  db.query("SELECT * FROM clients WHERE user_id = ?", [req.user.id], (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data);
  });
});

app.post("/api/clients", verifyToken, (req, res) => {
  const { name, email, phone } = req.body;
  db.query(
    "INSERT INTO clients (name, email, phone, user_id) VALUES (?, ?, ?, ?)",
    [name, email, phone, req.user.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Cliente agregado");
    }
  );
});

app.delete("/api/clients/:id", verifyToken, (req, res) => {
  db.query(
    "DELETE FROM clients WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Cliente eliminado");
    }
  );
});

// PROYECTOS
app.get("/api/projects", verifyToken, (req, res) => {
  const sql = `
    SELECT projects.*, clients.name AS client_name
    FROM projects
    LEFT JOIN clients ON projects.client_id = clients.id
    WHERE projects.user_id = ?
  `;
  db.query(sql, [req.user.id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

app.post("/api/projects", verifyToken, upload.single("image"), (req, res) => {
  const { name, client_id, status } = req.body;
  const image = req.file ? req.file.filename : null;

  db.query(
    "INSERT INTO projects (name, client_id, status, image, user_id) VALUES (?, ?, ?, ?, ?)",
    [name, client_id || null, status || "En progreso", image, req.user.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Proyecto guardado correctamente");
    }
  );
});

app.delete("/api/projects/:id", verifyToken, (req, res) => {
  db.query(
    "DELETE FROM projects WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Proyecto eliminado");
    }
  );
});

// EDITAR PROYECTO
app.put("/api/projects/:id", verifyToken, upload.single("image"), (req, res) => {
  const { name, client_id, status } = req.body;
  const image = req.file ? req.file.filename : null;

  let sql = "UPDATE projects SET name = ?, client_id = ?, status = ?";
  const params = [name, client_id || null, status];

  if (image) {
    sql += ", image = ?";
    params.push(image);
  }

  sql += " WHERE id = ? AND user_id = ?";
  params.push(req.params.id, req.user.id);

  db.query(sql, params, (err) => {
    if (err) return res.status(500).send(err);
    res.send("Proyecto actualizado correctamente");
  });
});

// EVENTOS (CALENDARIO)
app.get("/api/events", verifyToken, (req, res) => {
  db.query("SELECT * FROM events WHERE user_id = ?", [req.user.id], (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data);
  });
});

app.post("/api/events", verifyToken, (req, res) => {
  const { title, date, description } = req.body;
  db.query(
    "INSERT INTO events (title, date, description, user_id) VALUES (?, ?, ?, ?)",
    [title, date, description, req.user.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Evento agregado correctamente");
    }
  );
});

app.delete("/api/events/:id", verifyToken, (req, res) => {
  db.query(
    "DELETE FROM events WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Evento eliminado");
    }
  );
});

// STOCK


// Obtener productos del usuario
app.get("/api/stock", verifyToken, (req, res) => {
  db.query(
    "SELECT * FROM stock WHERE user_id = ?",
    [req.user.id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
});

// Añadir producto
app.post("/api/stock", verifyToken, upload.single("image"), (req, res) => {
  const { name, quantity } = req.body;
  const image = req.file ? req.file.filename : null;

  db.query(
    "INSERT INTO stock (name, quantity, image, user_id) VALUES (?, ?, ?, ?)",
    [name, quantity || 0, image, req.user.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Producto agregado correctamente");
    }
  );
});

// Actualizar cantidad (+ o -)
app.put("/api/stock/:id", verifyToken, (req, res) => {
  const { change } = req.body; // +1 o -1

  db.query(
    "UPDATE stock SET quantity = quantity + ? WHERE id = ? AND user_id = ?",
    [change, req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Stock actualizado");
    }
  );
});

// Eliminar producto
app.delete("/api/stock/:id", verifyToken, (req, res) => {
  db.query(
    "DELETE FROM stock WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Producto eliminado");
    }
  );
});


// SERVIDOR

app.listen(5000, '0.0.0.0', () =>
  console.log("🎨 PlanificArte backend en http://0.0.0.0:5000")
);

function addXP(userId, xpReward, callback) {
  db.query(
    "SELECT xp, level FROM user_xp WHERE user_id = ?",
    [userId],
    (err, rows) => {
      if (err) return callback(err);

      let xp = rows[0]?.xp || 0;
      let level = rows[0]?.level || 1;

      xp += xpReward;

      // Subida de nivel (nivel * 100)
      while (xp >= level * 100) {
        xp -= level * 100;
        level++;
      }

      db.query(
        `
        INSERT INTO user_xp (user_id, xp, level)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE xp=?, level=?
        `,
        [userId, xp, level, xp, level],
        (err2) => {
          if (err2) return callback(err2);
          callback(null, { xp, level });
        }
      );
    }
  );
}


app.get("/api/user/xp", verifyToken, (req, res) => {
  db.query("SELECT xp, level FROM user_xp WHERE user_id = ?", [req.user.id], (err, rows) => {
    if (err) return res.status(500).send(err);
    if (rows.length === 0) return res.json({ xp: 0, level: 1 });
    res.json(rows[0]);
  });
});

app.post("/api/user/missions/:missionId/complete", verifyToken, (req, res) => {
  const missionId = req.params.missionId;
  const today = new Date().toISOString().split("T")[0];

  db.query(
    "SELECT xp_reward FROM missions WHERE id = ?",
    [missionId],
    (err, missionRows) => {
      if (err) return res.status(500).send(err);
      if (!missionRows.length) return res.status(404).send("Misión no encontrada");

      const xpReward = missionRows[0].xp_reward;

      // Guardar misión completada
      const sql = `
        INSERT INTO user_missions (user_id, mission_id, completed_date, completed)
        VALUES (?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE completed=TRUE, completed_date=?
      `;
      db.query(sql, [req.user.id, missionId, today, today], (err2) => {
        if (err2) return res.status(500).send(err2);

        // Sumar XP
        addXP(req.user.id, xpReward, (err3, updated) => {
          if (err3) return res.status(500).send(err3);

          res.json({
            message: "Misión completada",
            xpReward,
            xp: updated.xp,
            level: updated.level,
          });
        });
      });
    }
  );
});
app.get("/api/missions", verifyToken, (req, res) => {
  db.query(
    "SELECT * FROM missions WHERE active = 1",
    (err, rows) => {
      if (err) return res.status(500).send(err);
      res.json(rows);
    }
  );
});
app.get("/api/user/missions", verifyToken, (req, res) => {
  const sql = `
    SELECT m.*, um.completed, um.completed_date
    FROM missions m
    LEFT JOIN user_missions um 
      ON m.id = um.mission_id AND um.user_id = ?
    WHERE m.active = 1
  `;
  db.query(sql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});


app.get("/api/achievements", verifyToken, (req, res) => {
  const sql = `
    SELECT a.*, ua.achieved_date
    FROM achievements a
    LEFT JOIN user_achievements ua 
      ON a.id = ua.achievement_id AND ua.user_id = ?
  `;
  db.query(sql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});


app.post("/api/user/achievements/:id", verifyToken, (req, res) => {
  db.query(
    "INSERT INTO user_achievements (user_id, achievement_id, achieved_date) VALUES (?, ?, NOW())",
    [req.user.id, req.params.id],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") return res.send("Ya logrado");
        return res.status(500).send(err);
      }
      res.send("Logro registrado");
    }
  );
});

app.post("/api/user/xp/add", verifyToken, (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount)) {
    return res.status(400).send("Cantidad inválida");
  }

  addXP(req.user.id, Number(amount), (err, result) => {
    if (err) return res.status(500).send(err);

    res.json({
      message: "XP añadido",
      xp: result.xp,
      level: result.level,
    });
  });
});
