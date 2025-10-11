import { ok, notFound, fail } from '../utils/http.js';
import {
  findAll,
  findByIdConDetalles,
  create,
  actualizarEstado as actualizarEstadoModel,
  remove as removeModel,
  getDetalleProductoEspecifico,
  estadisticasResumen,
  agregarProductos as agregarProductosModel,
  resumenAgrupado,
  eliminarProductoEspecifico as eliminarProductoEspecificoModel
} from '../models/pedidos.model.js';

export async function listar(req, res) {
  try {
    const { estado } = req.query;
    const rows = await findAll({ estado });
    return ok(res, rows);
  } catch (e) { return fail(res, 'Error al listar pedidos', e); }
}

export async function detalle(req, res) {
  try {
    const id = Number(req.params.id);
    const p = await findByIdConDetalles(id);
    if (!p) return notFound(res, `No se encontró el pedido ${id}`);
    return ok(res, p);
  } catch (e) { return fail(res, 'Error al obtener pedido', e); }
}

export async function crear(req, res) {
  try {
    const { metodoPago, estado, items } = req.body || {};
    if (!metodoPago) return fail(res, 'metodoPago es obligatorio');
    const out = await create({ metodoPago, estado, items });
    return ok(res, out, 201);
  } catch (e) { return fail(res, 'Error al crear pedido', e); }
}

export async function actualizarEstado(req, res) {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body || {};
    if (!estado) return fail(res, 'estado requerido');
    const upd = await actualizarEstadoModel(id, estado);
    if (!upd) return notFound(res, `No se encontró el pedido ${id}`);
    return ok(res, upd);
  } catch (e) { return fail(res, 'Error al actualizar estado', e); }
}

export async function eliminar(req, res) {
  try {
    const id = Number(req.params.id);
    const okDel = await removeModel(id);
    if (!okDel) return notFound(res, `No se encontró el pedido ${id}`);
    return ok(res, { eliminado: true });
  } catch (e) { return fail(res, 'Error al eliminar pedido', e); }
}

export async function listarPorEstado(req, res) {
  try {
    const { estado } = req.params;
    const rows = await findAll({ estado });
    return ok(res, rows);
  } catch (e) { return fail(res, 'Error al filtrar por estado', e); }
}

export async function detalleProducto(req, res) {
  try {
    const { idPedido, idPedidoProducto } = req.params;
    const det = await getDetalleProductoEspecifico(Number(idPedido), Number(idPedidoProducto));
    if (!det) return notFound(res, `No se encontró el detalle solicitado`);
    return ok(res, det);
  } catch (e) { return fail(res, 'Error al obtener detalle de producto', e); }
}

export async function estadisticas(_req, res) {
  try {
    const data = await estadisticasResumen();
    return ok(res, data);
  } catch (e) { return fail(res, 'Error al obtener estadísticas', e); }
}

export async function agregarProductos(req, res) {
  try {
    const id = Number(req.params.id);
    const { productos } = req.body || {};
    if (!Array.isArray(productos) || !productos.length) {
      return fail(res, 'productos[] requerido');
    }
    const out = await agregarProductosModel(id, productos);
    return ok(res, out, 201);
  } catch (e) { return fail(res, 'Error al agregar productos', e); }
}

// fechas string: YYYY-MM-DD (se convierten en timestamp en el model)
export async function filtrarPorFechas(req, res) {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) return fail(res, 'desde y hasta son requeridos (YYYY-MM-DD)');
    const rows = await findAll({ desde, hasta });
    return ok(res, rows);
  } catch (e) { return fail(res, 'Error al filtrar por fechas', e); }
}

export async function resumen(req, res) {
  try {
    const id = Number(req.params.id);
    const r = await resumenAgrupado(id);
    if (!r) return notFound(res, `No se encontró el pedido ${id}`);
    return ok(res, r);
  } catch (e) { return fail(res, 'Error al obtener resumen', e); }
}

export async function eliminarProducto(req, res) {
  try {
    const { id, idProducto } = req.params;
    const out = await eliminarProductoEspecificoModel(Number(id), Number(idProducto));
    return ok(res, out);
  } catch (e) { return fail(res, 'Error al eliminar producto del pedido', e); }
}

export async function listarPorMetodoPago(req, res) {
  try {
    const { metodo } = req.params;
    const rows = await findAll({ metodoPago: metodo });
    return ok(res, rows);
  } catch (e) { return fail(res, 'Error al filtrar por método de pago', e); }
}
