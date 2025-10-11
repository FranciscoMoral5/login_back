import { sql } from '../config/db.js';

// 1) Todos los disponibles (disponible = true)
export async function findAllDisponibles() {
  return await sql`
    select *
    from productos
    where coalesce(disponible, true) = true
    order by id_producto;
  `;
}

// 2) Producto por ID
export async function findById(id) {
  const r = await sql`
    select *
    from productos
    where id_producto = ${id};
  `;
  return r[0] || null;
}

// 3) Ingredientes base (desde productos_ingredientes_base) + datos del ingrediente
export async function findIngredientesBase(idProducto) {
  return await sql`
    select
      pib.id_ingrediente as id,
      i.nombre           as nombre,
      i.precio,
      i.unidad_medida,
      pib.cantidad
    from productos_ingredientes_base pib
    join ingredientes i on i.id_ingrediente = pib.id_ingrediente
    where pib.id_producto = ${idProducto}
    order by i.nombre;
  `;
}

// 4) Por categoría (y disponibles)
export async function findByCategoria(categoria) {
  return await sql`
    select *
    from productos
    where lower(categoria) = lower(${categoria})
      and coalesce(disponible, true) = true
    order by id_producto;
  `;
}

// 5) Categorías distintas
export async function findCategorias() {
  const r = await sql`
    select distinct categoria
    from productos
    where categoria is not null
    order by categoria;
  `;
  return r.map(x => x.categoria);
}

// 6) Precio personalizado = precio_base + extras (ingredientes) * cantidad
// extras: [{ ingredienteId, cantidad }]
export async function calcularPrecioPersonalizado(productoId, extras = []) {
  const p = await sql`
    select id_producto, precio_base
    from productos
    where id_producto = ${productoId};
  `;
  if (!p[0]) throw new Error('Producto no encontrado');

  let total = Number(p[0].precio_base || 0);

  if (Array.isArray(extras) && extras.length) {
    const ids = extras.map(e => e.ingredienteId);
    const precios = await sql`
      select id_ingrediente, precio
      from ingredientes
      where id_ingrediente = any(${ids});
    `;
    const map = new Map(precios.map(r => [r.id_ingrediente, Number(r.precio || 0)]));
    for (const e of extras) {
      total += (map.get(e.ingredienteId) ?? 0) * (e.cantidad || 1);
    }
  }

  return { productoId, precio: total };
}


// Crear producto
export async function createProducto({ nombre, descripcion, precio_base, categoria, disponible = true }) {
  const r = await sql`
    insert into productos (nombre, descripcion, precio_base, categoria, disponible)
    values (${nombre}, ${descripcion}, ${precio_base}, ${categoria}, ${disponible})
    returning *;
  `;
  return r[0];
}

// Actualizar producto (PATCH)
export async function updateProducto(id, data) {
  const fields = [];
  const values = [];

  if (data.nombre !== undefined) {
    fields.push(sql`nombre = ${data.nombre}`);
  }
  if (data.descripcion !== undefined) {
    fields.push(sql`descripcion = ${data.descripcion}`);
  }
  if (data.precio_base !== undefined) {
    fields.push(sql`precio_base = ${data.precio_base}`);
  }
  if (data.categoria !== undefined) {
    fields.push(sql`categoria = ${data.categoria}`);
  }
  if (data.disponible !== undefined) {
    fields.push(sql`disponible = ${data.disponible}`);
  }

  if (fields.length === 0) return null;

  // Usamos array .reduce para concatenar las partes
  const setClause = fields.reduce((acc, f, i) => {
    if (i === 0) return f;
    return sql`${acc}, ${f}`;
  });

  const r = await sql`
    update productos
    set ${setClause}
    where id_producto = ${id}
    returning *;
  `;
  return r[0] || null;
}


// Eliminar producto
export async function deleteProducto(id) {
  const r = await sql`
    delete from productos
    where id_producto = ${id}
    returning *;
  `;
  return r[0] || null;
}

// Receta (ingredientes base de un producto)
export async function findReceta(idProducto) {
  return await sql`
    select
      pib.id_ingrediente,
      i.nombre as nombre,
      i.unidad_medida,
      pib.cantidad
    from productos_ingredientes_base pib
    join ingredientes i on i.id_ingrediente = pib.id_ingrediente
    where pib.id_producto = ${idProducto}
    order by i.nombre;
  `;
}
