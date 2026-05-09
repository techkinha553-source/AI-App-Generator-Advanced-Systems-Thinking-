import { useEffect, useMemo, useState } from "react";

type RowData = Record<string, any>;

type TableProps = {
  table: string;
  title?: string;
  locale?: string;
  children?: React.ReactNode;
};

function formatValue(value: any) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export default function Table({
  table,
  title,
  locale = "en",
  children
}: TableProps) {
  const [data, setData] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `http://localhost:5050/api/${table}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch table data");
        }

        const result = await response.json();

        if (Array.isArray(result)) {
          setData(result);
        } else if (Array.isArray(result?.data)) {
          setData(result.data);
        } else {
          setData([]);
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Failed to load table");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (table) {
      loadData();
    }
  }, [table]);

  const columns = useMemo(() => {
    if (!data.length) {
      return [];
    }

    return Object.keys(data[0]);
  }, [data]);

  if (!table) {
    return (
      <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-4">
        No table configured
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border rounded-xl p-6 bg-white shadow-sm mt-6">
        Loading table data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-300 bg-red-50 rounded-xl p-6 mt-6">
        <h2 className="font-bold text-red-700">Table Runtime Error</h2>

        <p className="text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl p-6 shadow-sm bg-white mt-6 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">
            {title || table}
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Locale: {locale}
          </p>
        </div>

        <div className="text-sm text-gray-500">
          {data.length} records
        </div>
      </div>

      {data.length === 0 ? (
        <div className="border border-dashed rounded-lg p-6 text-gray-500 text-center">
          No data available
        </div>
      ) : (
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="border bg-gray-100 p-3 text-left font-semibold"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-gray-50 transition"
              >
                {columns.map((column) => (
                  <td
                    key={column}
                    className="border p-3 text-sm"
                  >
                    {formatValue(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}