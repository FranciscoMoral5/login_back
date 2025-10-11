import { ok, notFound, fail } from '../utils/http.js';
import {
  findAllDisponibles,
  findById as findProductoById,
  findIngredientesBase,
  findByCategoria as findProductosByCategoria,
  findCategorias,
  calcularPrecioPersonalizado
} from '../models/productos.model.js';

export async function listar(req, res) {
  try {
    const { categoria } = req.query;
    const rows = categoria
      ? await findProductosByCategoria(categoria)
      : await findAllDisponibles();
    return ok(res, rows);
  } catch (e) { return fail(res, 'Error al listar productos', e); }
}

export async function detalle(req, res) {
  try {
    const id = Number(req.params.id);
    const p = await findProductoById(id);
    if (!p) return notFound(res, `No se encontró el producto ${id}`);
    const ingredientes = await findIngredientesBase(id);
    return ok(res, { ...p, ingredientes });
  } catch (e) { return fail(res, 'Error al obtener producto', e); }
}

export async function listarPorCategoria(req, res) {
  try {
    const { categoria } = req.params;
    const rows = await findProductosByCategoria(categoria);
    return ok(res, rows);
  } catch (e) { return fail(res, 'Error al listar por categoría', e); }
}

export async function calcularPrecio(req, res) {
  try {
    const id = Number(req.params.id);
    const { extras } = req.body || {};
    const out = await calcularPrecioPersonalizado(id, extras || []);
    return ok(res, out);
  } catch (e) { return fail(res, 'Error al calcular precio', e); }
}

export async function categorias(_req, res) {
  try {
    const cats = await findCategorias();
    return ok(res, cats);
  } catch (e) { return fail(res, 'Error al obtener categorías', e); }
}


import {
  createProducto,
  updateProducto,
  deleteProducto,
  findReceta
} from '../models/productos.model.js';

// POST /api/productos
export async function crear(req, res) {
  try {
    const { nombre, descripcion, precio_base, categoria, disponible } = req.body || {};
    if (!nombre || !precio_base || !categoria) {
      return fail(res, 'nombre, precio_base y categoria son obligatorios');
    }
    const nuevo = await createProducto({ nombre, descripcion, precio_base, categoria, disponible });
    return ok(res, nuevo, 201);
  } catch (e) { return fail(res, 'Error al crear producto', e); }
}

// PATCH /api/productos/:id
export async function actualizar(req, res) {
  try {
    const id = Number(req.params.id);
    const upd = await updateProducto(id, req.body || {});
    if (!upd) return notFound(res, `No se encontró el producto ${id} o no hubo cambios`);
    return ok(res, upd);
  } catch (e) { return fail(res, 'Error al actualizar producto', e); }
}

// DELETE /api/productos/:id
export async function eliminar(req, res) {
  try {
    const id = Number(req.params.id);
    const del = await deleteProducto(id);
    if (!del) return notFound(res, `No se encontró el producto ${id}`);
    return ok(res, { eliminado: true, producto: del });
  } catch (e) { return fail(res, 'Error al eliminar producto', e); }
}

// GET /api/productos/:id/receta
export async function receta(req, res) {
  try {
    const id = Number(req.params.id);
    const ing = await findReceta(id);
    return ok(res, ing);
  } catch (e) { return fail(res, 'Error al obtener receta', e); }
}
