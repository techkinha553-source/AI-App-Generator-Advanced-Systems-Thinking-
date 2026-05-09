import { pool } from "../db-engine";

export async function update(
  table: string,
  id: string,
  data: any
) {
  const keys = Object.keys(data);

  const values = Object.values(data);

  const setClause = keys
    .map((key, index) => `${key} = $${index + 1}`)
    .join(", ");

  const query = `
    UPDATE ${table}
    SET ${setClause}
    WHERE id = $${keys.length + 1}
    RETURNING *
  `;

  const result = await pool.query(query, [...values, id]);

  return result.rows[0];
}