import { Router } from 'express';
import * as productos from '../controllers/productos.controller.js';

const router = Router();

// CRUD básico
router.post('/', productos.crear);               // create
router.patch('/:id', productos.actualizar);      // update
router.delete('/:id', productos.eliminar);       // delete

// Rutas extra
router.get('/categoria/:categoria', productos.listarPorCategoria);
router.post('/:id/calcular-precio', productos.calcularPrecio);
router.get('/:id/receta', productos.receta);     // receta/base

// Genéricas
router.get('/:id', productos.detalle);
router.get('/', productos.listar);

export default router;
