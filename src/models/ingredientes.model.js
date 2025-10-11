import { sql } from '../config/db.js';

// stock > 0 y ordena por "nombr" (así está en tu tabla)
export async function findDisponiblesConStock() {
  return await sql`
    select *
    from ingredientes
    where stock > 0
    order by nombre;
  `;
}

export async function findById(id) {
  const r = await sql`
    select *
    from ingredientes
    where id_ingrediente = ${id};
  `;
  return r[0] || null;
}
