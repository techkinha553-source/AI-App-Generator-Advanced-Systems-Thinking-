import { pool } from "../db-engine/index";

export async function remove(
  table: string,
  id: string
) {
  await pool.query(
    `DELETE FROM ${table} WHERE id = $1`,
    [id]
  );

  return {
    success: true
  };
}