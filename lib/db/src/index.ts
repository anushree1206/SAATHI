import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  if (!_db) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    _db = drizzle(pool, { schema });
  }
  return _db;
}

// For backward compatibility, export a lazy-loaded db object
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (_target, prop) => {
    return Reflect.get(getDb(), prop as PropertyKey);
  },
});

export * from "./schema";
