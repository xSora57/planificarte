import mysql from "mysql2";
import bcrypt from "bcrypt";

const db = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "1234",
  database: "crm_dibujantes",
});

db.connect((err) => {
  if (err) console.error("Error conectando a MySQL:", err);
  else console.log("Conectado a MySQL");
});

const createAdmin = async () => {
  const username = "admin";
  const email = "admin@example.com";
  const plainPassword = "admin";  // Cambia esto por la contraseña que quieras
  const hashedPassword = await bcrypt.hash(plainPassword, 10);  // Hashea la contraseña

  const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
  db.query(sql, [username, email, hashedPassword], (err, result) => {
    if (err) {
      console.error("Error insertando usuario:", err);
    } else {
      console.log("Usuario admin creado exitosamente:", result);
    }
    db.end();
  });
};

createAdmin();