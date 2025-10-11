// db.js
import dotenv from 'dotenv';
dotenv.config();

import postgres from 'postgres';

// ✅ Validar env
if (!process.env.DATABASE_URL) {
  console.error('❌ Falta la variable de entorno DATABASE_URL en .env');
  process.exit(1);
}

// Log “seguro” (sin contraseña)
const safeUrl = process.env.DATABASE_URL.replace(/(:)[^@]+(@)/, '$1****$2');
console.log('🔌 Conectando a Supabase...');
console.log(`🔗 URL: ${safeUrl}`);

// ✅ Config recomendada para Supabase + PgBouncer (pooler)
export const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',   // Supabase requiere SSL
  prepare: false,   // Importante si usás el host *.pooler.supabase.com
  max: 10,          // pool del cliente
  idle_timeout: 30, // segundos
  connect_timeout: 30,
  // Opcional: nombre de la app en la conexión
  connection: { application_name: 'autoservicio-burgers-api' },
  // Silenciar NOTICE de PG
  onnotice: () => {},
  // Activá esto solo si querés ver queries por consola en dev
  debug: process.env.NODE_ENV === 'development',
});

// ✅ Test de conexión simple
export async function testConnection() {
  try {
    const result = await sql`select now() as time`;
    console.log('✅ Conexión a la base OK');
    console.log(`📅 Hora del servidor: ${result[0].time}`);

    // Mostrar tablas del esquema public
    try {
      const tables = await sql`
        select table_name
        from information_schema.tables
        where table_schema = 'public'
        order by table_name;
      `;
      if (tables.length === 0) {
        console.log('📋 No se encontraron tablas en el esquema "public".');
      } else {
        console.log('📋 Tablas (public):');
        tables.forEach((t, i) => console.log(`  ${i + 1}. ${t.table_name}`));
      }
    } catch (e) {
      console.error('⚠️ No se pudieron listar tablas:', e.message);
    }

    return true;
  } catch (err) {
    console.error('❌ Error al conectar con la base:', err.message);
    if (err.code) console.error(`📋 Código PG: ${err.code}`);
    return false;
  }
}
