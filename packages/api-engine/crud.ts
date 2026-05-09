import { pool } from "../db-engine/index";

export async function create(
  table: string,
  data: any
) {

  const keys = Object.keys(data);

  const values = Object.values(data);

  const columns = keys.join(",");

  const placeholders = keys
    .map((_, i) => `$${i + 1}`)
    .join(",");

  const query = `
    INSERT INTO ${table}
    (${columns})
    VALUES (${placeholders})
    RETURNING *
  `;

  const result = await pool.query(
    query,
    values
  );

  return result.rows[0];
}