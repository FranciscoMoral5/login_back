import { Router } from 'express';
import * as pedidos from '../controllers/pedidos.controller.js';

const router = Router();

router.get('/estadisticas/resumen', pedidos.estadisticas);
router.get('/filtro/fecha', pedidos.filtrarPorFechas);
router.get('/estado/:estado', pedidos.listarPorEstado);
router.get('/metodo-pago/:metodo', pedidos.listarPorMetodoPago);

router.post('/', pedidos.crear);
router.patch('/:id/estado', pedidos.actualizarEstado);
router.post('/:id/productos', pedidos.agregarProductos);
router.delete('/:id/productos/:idProducto', pedidos.eliminarProducto);

router.get('/:id/resumen', pedidos.resumen);
router.get('/:idPedido/productos/:idPedidoProducto', pedidos.detalleProducto);

router.get('/:id', pedidos.detalle);
router.delete('/:id', pedidos.eliminar);
router.get('/', pedidos.listar);

export default router;
