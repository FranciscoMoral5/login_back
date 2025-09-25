// server.js
import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors()); // permite llamadas desde tu React en localhost:5173

// "Base de datos" en memoria
const users = [
    {nombre: "pancho", password: "123"}
];

// ÚNICO endpoint: POST /login
app.post("/login", (req, res) => {
  const { nombre, password } = req.body || {};

  if (!nombre || !password) {
    return res.status(400).json({ error: "Faltan 'nombre' y/o 'password'." });
  }

  // Buscar si ya existe
  const existing = users.find(u => u.nombre === nombre);

  if (!existing) {
 
    return res.status(401).json({
        message: "Credenciales incorrectas.",
          });
  }

  // Si existe, validamos contraseña
  if (existing.password !== password) {
    return res.status(401).json({ ok: false, error: "Credenciales inválidas." });
  }

  // Login OK
  return res.json({
    ok: true,
    created: false,
    message: "Login exitoso.",
    user: { nombre: existing.nombre },
    total_users: users.length
  });
});

// Puerto
const PORT = process.env.PORT || 3004;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`✅ Backend login escuchando en http://${HOST}:${PORT}`);
});
