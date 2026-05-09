import { pool } from "../db-engine";

export async function read(table: string) {
  const result = await pool.query(`SELECT * FROM ${table}`);
  return result.rows;
}