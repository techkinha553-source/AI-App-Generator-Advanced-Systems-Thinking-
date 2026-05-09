import { pool } from "./index";

const SQL_TYPE_MAP: Record<string, string> = {
  text: "TEXT",
  string: "TEXT",
  email: "TEXT",
  number: "INTEGER",
  float: "REAL",
  boolean: "BOOLEAN",
  date: "TIMESTAMP",
  json: "JSONB"
};

function sanitizeIdentifier(value: string) {
  return value
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();
}

function resolveColumnType(type: any) {
  if (!type) {
    return "TEXT";
  }

  const normalized = String(type).toLowerCase();

  return SQL_TYPE_MAP[normalized] || "TEXT";
}

export async function createTables(tables: any[] = []) {
  if (!Array.isArray(tables)) {
    throw new Error("Tables configuration must be an array");
  }

  for (const table of tables) {
    try {
      if (!table?.name) {
        console.warn("Skipping table with missing name");
        continue;
      }

      const tableName = sanitizeIdentifier(table.name);

      const fields = Array.isArray(table?.fields)
        ? table.fields
        : [];

      const columns = fields
        .map((field: any) => {
          if (!field?.name) {
            return null;
          }

          const columnName = sanitizeIdentifier(field.name);

          const columnType = resolveColumnType(field.type);

          return `${columnName} ${columnType}`;
        })
        .filter(Boolean)
        .join(",\n");

      const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id SERIAL PRIMARY KEY,
          user_id TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ${columns ? "," : ""}
          ${columns}
        )
      `;

      console.log(`Creating table: ${tableName}`);

      await pool.query(query);

      console.log(`Table ready: ${tableName}`);
    } catch (err) {
      console.error("TABLE CREATION ERROR:", err);
    }
  }
}