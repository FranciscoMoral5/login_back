// src/server.js
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app.js';
import { testConnection, sql } from './config/db.js';


const PORT = process.env.PORT || 3000;


// Iniciar el servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
  
  // Verificar la conexión a la base de datos al iniciar
  await testConnection();
  
  // Cerrar el proceso si no se puede conectar a la base de datos
  process.on('SIGINT', async () => {
    console.log('Cerrando conexiones a la base de datos...');
    await sql.end();
    process.exit(0);
  });
});
