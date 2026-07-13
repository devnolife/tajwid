import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { getDatabasePoolConfig } from "@/lib/db/config";

export const pool = new pg.Pool(getDatabasePoolConfig());

export const db = drizzle(pool, { schema });
