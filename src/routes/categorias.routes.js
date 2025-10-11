import { Router } from 'express';
import { categorias } from '../controllers/productos.controller.js';

const router = Router();

router.get('/', categorias);

// Test API de categorías
router.get('/test', (_req, res) => {
  res.json({ ok: true, service: 'Categorias API' });
});

export default router;
