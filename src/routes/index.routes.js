import { Router } from 'express';
import { testConnection, sql } from '../config/db.js';

import pedidos from './pedidos.routes.js';
import productos from './productos.routes.js';
import ingredientes from './ingredientes.routes.js';
import categorias from './categorias.routes.js';

const router = Router();

// Healthcheck
router.get('/', (req, res) => {
  res.json({
    message: 'API de Autoservicio de Hamburguesas',
    status: 'OK',
    timestamp: new Date(),
  });
});

// DB test (como antes)
router.get('/db-test', async (req, res) => {
  try {
    const ok = await testConnection();
    if (!ok) return res.status(500).json({ status: 'ERROR', message: 'No se pudo conectar a la base' });

    const tables = await sql`
      select table_name from information_schema.tables
      where table_schema = 'public' order by table_name;
    `;
    res.json({ status: 'OK', message: 'Conexión exitosa', tables: tables.map(t => t.table_name) });
  } catch (e) {
    res.status(500).json({ status: 'ERROR', message: 'Error al verificar conexión', error: e.message });
  }
});

// Montaje de módulos
router.use('/api/pedidos', pedidos);
router.use('/api/productos', productos);
router.use('/api/ingredientes', ingredientes);
router.use('/api/categorias', categorias);

export default router;