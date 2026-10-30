
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error("POSTGRES_URL environment variable is missing.");
}

export const sql = neon(databaseUrl);
