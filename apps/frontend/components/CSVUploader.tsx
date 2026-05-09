import { useRef, useState } from "react";
import Papa from "papaparse";

type CSVUploaderProps = {
  table: string;
  onImportComplete?: () => void;
};

export default function CSVUploader({ table, onImportComplete }: CSVUploaderProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result: any) => {
        try {
          const rows = Array.isArray(result.data) ? result.data : [];

          if (!rows.length) {
            setError("No data found in CSV");
            setLoading(false);
            return;
          }

          setPreview(rows.slice(0, 5));

          const res = await fetch(
            `http://localhost:5050/api/import/${table}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(rows)
            }
          );

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data?.error || "Import failed");
          }

          setSuccess(`Imported ${data.inserted || rows.length} rows`);

          if (onImportComplete) onImportComplete();
        } catch (err: any) {
          setError(err.message || "Upload failed");
        } finally {
          setLoading(false);
        }
      },
      error: () => {
        setError("CSV parsing failed");
        setLoading(false);
      }
    });
  };

  return (
    <div className="border rounded-xl p-5 mt-6 bg-white">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">CSV Import</h2>
          <p className="text-sm text-gray-500">Table: {table}</p>
        </div>

        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload CSV"}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        hidden
        onChange={handleUpload}
      />

      {error && (
        <div className="mt-3 text-red-600 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-3 text-green-600 bg-green-50 p-3 rounded">
          {success}
        </div>
      )}

      {preview.length > 0 && (
        <div className="mt-5">
          <h3 className="font-semibold mb-2">Preview</h3>
          <table className="w-full border">
            <thead>
              <tr>
                {Object.keys(preview[0]).map((key) => (
                  <th key={key} className="border p-2 bg-gray-100">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  {Object.keys(preview[0]).map((key) => (
                    <td key={key} className="border p-2">
                      {String(row[key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
