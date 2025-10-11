import { sql } from '../config/db.js';

// helpers fecha: fecha_hora (BIGINT ms) ↔ timestamp
const TS_FROM_MS = (col) => sql`to_timestamp(${sql.raw(col)}::numeric/1000.0)`;


export async function findAll({ estado, desde, hasta, metodoPago } = {}) {
  return await sql`
    select *
    from pedidos
    where 1=1
      ${estado     ? sql` and lower(estado) = lower(${estado})` : sql``}
      ${metodoPago ? sql` and lower(metodo_pago) = lower(${metodoPago})` : sql``}
      ${desde      ? sql` and to_timestamp(fecha_hora::numeric/1000.0) >= ${desde}::timestamp` : sql``}
      ${hasta      ? sql` and to_timestamp(fecha_hora::numeric/1000.0) <  ${hasta}::timestamp + interval '1 day'` : sql``}
    order by id_pedido desc;
  `;
}

export async function findByIdConDetalles(id) {
  const ped = await sql`
    select *
    from pedidos
    where id_pedido = ${id};
  `;
  if (!ped[0]) return null;

  // items
  const items = await sql`
    select
      pp.id_pedido_producto as id,
      pp.id_producto        as producto_id,
      p.nombre              as producto_nombre,
      p.categoria,
      pp.subtotal,
      pp.notas
    from pedidos_productos pp
    join productos p on p.id_producto = pp.id_producto
    where pp.id_pedido = ${id}
    order by pp.id_pedido_producto;
  `;

  // ingredientes por item (incluye extras y no extras)
  const ingPorItem = await sql`
    select
      ppi.id_pedido_producto,
      ppi.id_ingrediente,
      i.nombre as nombre,
      i.unidad_medida,
      i.precio,
      ppi.cantidad,
      ppi.es_extra
    from pedidos_productos_ingredientes ppi
    join ingredientes i on i.id_ingrediente = ppi.id_ingrediente
    where ppi.id_pedido_producto = any(${items.map(x => x.id)});
  `;

  // adjuntar ingredientes al item
  const map = new Map(items.map(it => [it.id, { ...it, ingredientes: [] }]));
  for (const r of ingPorItem) {
    map.get(r.id_pedido_producto)?.ingredientes.push({
      id_ingrediente: r.id_ingrediente,
      nombre: r.nombre,
      unidad_medida: r.unidad_medida,
      precio: r.precio,
      cantidad: r.cantidad,
      es_extra: r.es_extra
    });
  }

  return { ...ped[0], items: Array.from(map.values()) };
}

// Crea pedido y sus items.
// items: [{ productoId, cantidad=1, notas?, extras?: [{ ingredienteId, cantidad, es_extra=true }] }]
export async function create({ clienteNombre, metodoPago, estado = 'pendiente', items = [] }) {
  // fecha_hora en ms (epoch)
  const nowMs = Date.now();

  // insertar pedido (total=0 de inicio)
  const ped = await sql`
    insert into pedidos (fecha_hora, estado, total, metodo_pago)
    values (${nowMs}, ${estado}, 0, ${metodoPago})
    returning *;
  `;
  const pedido = ped[0];

  // insertar items y calcular total
  let total = 0;

  for (const it of (items || [])) {
    const cant = it.cantidad || 1;

    const prod = await sql`
      select precio_base
      from productos
      where id_producto = ${it.productoId};
    `;
    const base = Number(prod[0]?.precio_base || 0);

    // costo extras del item
    let extrasCost = 0;
    if (Array.isArray(it.extras) && it.extras.length) {
      const ids = it.extras.map(e => e.ingredienteId);
      const precios = await sql`
        select id_ingrediente, precio
        from ingredientes
        where id_ingrediente = any(${ids});
      `;
      const map = new Map(precios.map(x => [x.id_ingrediente, Number(x.precio || 0)]));
      for (const e of it.extras) {
        extrasCost += (map.get(e.ingredienteId) ?? 0) * (e.cantidad || 1);
      }
    }

    const subtotal = (base * cant) + extrasCost;

    // insertar item
    const insItem = await sql`
      insert into pedidos_productos (id_pedido, id_producto, subtotal, notas)
      values (${pedido.id_pedido}, ${it.productoId}, ${subtotal}, ${it.notas || null})
      returning id_pedido_producto;
    `;
    const itemId = insItem[0].id_pedido_producto;

    // insertar ingredientes del item (base + extras)
    // Base: desde productos_ingredientes_base * cant
    const baseIngs = await sql`
      select id_ingrediente, cantidad
      from productos_ingredientes_base
      where id_producto = ${it.productoId};
    `;
    for (const b of baseIngs) {
      await sql`
        insert into pedidos_productos_ingredientes (id_pedido_producto, id_ingrediente, cantidad, es_extra)
        values (${itemId}, ${b.id_ingrediente}, ${Number(b.cantidad) * cant}, false);
      `;
    }
    // Extras declarados por el cliente
    if (Array.isArray(it.extras)) {
      for (const e of it.extras) {
        await sql`
          insert into pedidos_productos_ingredientes (id_pedido_producto, id_ingrediente, cantidad, es_extra)
          values (${itemId}, ${e.ingredienteId}, ${e.cantidad || 1}, true);
        `;
      }
    }

    total += subtotal;
  }

  // actualizar total del pedido
  await sql`
    update pedidos
    set total = ${total}
    where id_pedido = ${pedido.id_pedido};
  `;

  return { ...pedido, total };
}

// Agregar productos a un pedido existente (mismo formato de items del create)
export async function agregarProductos(pedidoId, productos = []) {
  let totalDelta = 0;

  for (const it of (productos || [])) {
    const cant = it.cantidad || 1;

    const prod = await sql`
      select precio_base
      from productos
      where id_producto = ${it.productoId};
    `;
    const base = Number(prod[0]?.precio_base || 0);

    let extrasCost = 0;
    if (Array.isArray(it.extras) && it.extras.length) {
      const ids = it.extras.map(e => e.ingredienteId);
      const precios = await sql`
        select id_ingrediente, precio
        from ingredientes
        where id_ingrediente = any(${ids});
      `;
      const map = new Map(precios.map(x => [x.id_ingrediente, Number(x.precio || 0)]));
      for (const e of it.extras) {
        extrasCost += (map.get(e.ingredienteId) ?? 0) * (e.cantidad || 1);
      }
    }

    const subtotal = (base * cant) + extrasCost;

    const insItem = await sql`
      insert into pedidos_productos (id_pedido, id_producto, subtotal, notas)
      values (${pedidoId}, ${it.productoId}, ${subtotal}, ${it.notas || null})
      returning id_pedido_producto;
    `;
    const itemId = insItem[0].id_pedido_producto;

    // base del producto
    const baseIngs = await sql`
      select id_ingrediente, cantidad
      from productos_ingredientes_base
      where id_producto = ${it.productoId};
    `;
    for (const b of baseIngs) {
      await sql`
        insert into pedidos_productos_ingredientes (id_pedido_producto, id_ingrediente, cantidad, es_extra)
        values (${itemId}, ${b.id_ingrediente}, ${Number(b.cantidad) * cant}, false);
      `;
    }
    // extras del request
    if (Array.isArray(it.extras)) {
      for (const e of it.extras) {
        await sql`
          insert into pedidos_productos_ingredientes (id_pedido_producto, id_ingrediente, cantidad, es_extra)
          values (${itemId}, ${e.ingredienteId}, ${e.cantidad || 1}, true);
        `;
      }
    }

    totalDelta += subtotal;
  }

  await sql`
    update pedidos
    set total = coalesce(total, 0) + ${totalDelta}
    where id_pedido = ${pedidoId};
  `;

  return { agregado: productos.length, totalDelta };
}

// Eliminar TODOS los items de un producto en ese pedido (y sus ingredientes)
export async function eliminarProductoEspecifico(pedidoId, idProducto) {
  const items = await sql`
    select id_pedido_producto, subtotal
    from pedidos_productos
    where id_pedido = ${pedidoId} and id_producto = ${idProducto};
  `;
  const ids = items.map(x => x.id_pedido_producto);
  const resta = items.reduce((a, x) => a + Number(x.subtotal || 0), 0);

  if (ids.length) {
    await sql`delete from pedidos_productos_ingredientes where id_pedido_producto = any(${ids});`;
    await sql`delete from pedidos_productos where id_pedido_producto = any(${ids});`;
    await sql`
      update pedidos
      set total = greatest(coalesce(total,0) - ${resta}, 0)
      where id_pedido = ${pedidoId};
    `;
  }

  return { eliminado: true, subtotal: resta };
}

// Cambiar estado
export async function actualizarEstado(id, estado) {
  const r = await sql`
    update pedidos
    set estado = ${estado}
    where id_pedido = ${id}
    returning *;
  `;
  return r[0] || null;
}

// Borrar pedido entero (primero hijos)
export async function remove(id) {
  const hijos = await sql`
    select id_pedido_producto
    from pedidos_productos
    where id_pedido = ${id};
  `;
  const ids = hijos.map(x => x.id_pedido_producto);
  if (ids.length) {
    await sql`delete from pedidos_productos_ingredientes where id_pedido_producto = any(${ids});`;
    await sql`delete from pedidos_productos where id_pedido_producto = any(${ids});`;
  }
  const r = await sql`delete from pedidos where id_pedido = ${id};`;
  return r.count > 0;
}

export async function getDetalleProductoEspecifico(idPedido, idPedidoProducto) {
  const r = await sql`
    select
      pp.id_pedido_producto as id,
      pp.id_producto        as producto_id,
      p.nombre              as producto_nombre,
      p.categoria,
      pp.subtotal,
      pp.notas
    from pedidos_productos pp
    join productos p on p.id_producto = pp.id_producto
    where pp.id_pedido = ${idPedido}
      and pp.id_pedido_producto = ${idPedidoProducto};
  `;
  if (!r[0]) return null;

  const ing = await sql`
    select
      ppi.id_ingrediente,
      i.nombre as nombre,
      i.unidad_medida,
      i.precio,
      ppi.cantidad,
      ppi.es_extra
    from pedidos_productos_ingredientes ppi
    join ingredientes i on i.id_ingrediente = ppi.id_ingrediente
    where ppi.id_pedido_producto = ${idPedidoProducto};
  `;
  return { ...r[0], ingredientes: ing };
}

// Estadísticas
export async function estadisticasResumen() {
  const tot = await sql`
    select count(*)::int as total_pedidos,
           coalesce(sum(total),0)::numeric as total_ingresos
    from pedidos;
  `;
  const porEstado = await sql`
    select lower(estado) as estado, count(*)::int as cantidad
    from pedidos
    group by lower(estado)
    order by cantidad desc;
  `;
  // no hay "cantidad" en pedidos_productos; usamos count(*)
  const topProductos = await sql`
    select p.id_producto, p.nombre, count(*)::int as vendidos
    from pedidos_productos pp
    join productos p on p.id_producto = pp.id_producto
    group by p.id_producto, p.nombre
    order by vendidos desc
    limit 5;
  `;
  return { ...tot[0], porEstado, topProductos };
}

export async function resumenAgrupado(id) {
  const ped = await findByIdConDetalles(id);
  if (!ped) return null;
  const totalItems = (ped.items || []).length; // sin "cantidad" en tabla; cada fila = 1 item
  return {
    id_pedido: ped.id_pedido,
    fecha_hora: ped.fecha_hora,
    estado: ped.estado,
    total: ped.total,
    metodo_pago: ped.metodo_pago,
    items: ped.items,
    resumen: { totalItems, cantProductos: totalItems }
  };
}
