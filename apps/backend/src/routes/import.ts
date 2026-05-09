import { Router } from "express";
import { pool } from "../../../../packages/db-engine";

const router = Router();

function sanitizeIdentifier(value: string) {
  return value
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();
}

router.post("/:table", async (req, res) => {
  try {
    const table = sanitizeIdentifier(req.params.table);

    const rows = req.body;

    if (!table) {
      return res.status(400).json({
        success: false,
        error: "Invalid table name"
      });
    }

    if (!Array.isArray(rows)) {
      return res.status(400).json({
        success: false,
        error: "CSV payload must be an array"
      });
    }

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No CSV rows provided"
      });
    }

    let inserted = 0;

    for (const row of rows) {
      if (!row || typeof row !== "object") {
        continue;
      }

      const columns = Object.keys(row)
        .map((column) => sanitizeIdentifier(column))
        .filter(Boolean);

      if (!columns.length) {
        continue;
      }

      const values = columns.map((column) => row[column]);

      const placeholders = values
        .map((_, index) => `$${index + 1}`)
        .join(", ");

      const query = `
        INSERT INTO ${table}
        (${columns.join(", ")})
        VALUES (${placeholders})
      `;

      await pool.query(query, values);

      inserted++;
    }

    return res.json({
      success: true,
      inserted,
      table
    });
  } catch (err) {
    console.error("CSV IMPORT ERROR:", err);

    return res.status(500).json({
      success: false,
      error: "CSV import failed"
    });
  }
});

export default router;
