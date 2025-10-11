import { ok, notFound, fail } from '../utils/http.js';
import { findDisponiblesConStock, findById } from '../models/ingredientes.model.js';

export async function listar(_req, res) {
  try {
    const rows = await findDisponiblesConStock();
    return ok(res, rows);
  } catch (e) { return fail(res, 'Error al obtener ingredientes', e); }
}

export async function detalle(req, res) {
  try {
    const { id } = req.params;
    const i = await findById(id);
    if (!i) return notFound(res, `No se encontró el ingrediente ${id}`);
    return ok(res, i);
  } catch (e) { return fail(res, 'Error al obtener ingrediente', e); }
}
