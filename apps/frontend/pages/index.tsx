import { useEffect, useMemo, useState } from "react";
import CSVUploader from "../components/CSVUploader";

type Field = {
  name?: string;
  label?: string;
  type?: string;
};

type PageComponent = {
  type?: string;
  table?: string;
  title?: string;
  fields?: Field[];
};

type AppConfig = {
  id?: string;
  createdAt?: string;
  appName?: string;
  pages?: PageComponent[];
  db?: {
    tables?: {
      name?: string;
      fields?: Field[];
    }[];
  };
};

type RuntimeApp = {
  id?: string;
  appName?: string;
  pages?: number;
  tables?: number;
  createdAt?: string;
};

function UnsupportedComponent({ type }: { type?: string }) {
  return (
    <div className="border border-red-400 bg-red-50 p-4 rounded-lg mt-4">
      <h3 className="font-semibold text-red-700">Unsupported Component</h3>
      <p className="text-sm text-red-600">
        Component type: {type || "unknown"}
      </p>
    </div>
  );
}

function DynamicForm({ component, config }: any) {
  const table = config?.db?.tables?.find(
    (t: any) => t.name === component.table
  );

  const fields = component.fields || table?.fields || [];

  return (
    <div className="border rounded-xl p-6 shadow-sm bg-white mt-6">
      <h2 className="text-xl font-bold mb-4">
        {component.title || component.table || "Dynamic Form"}
      </h2>

      <form className="grid gap-4">
        {fields.length === 0 && (
          <div className="text-gray-500">No fields configured</div>
        )}

        {fields.map((field: Field, index: number) => {
          const fieldType = field?.type || "text";

          return (
            <div key={index} className="flex flex-col gap-1">
              <label className="font-medium">
                {field?.label || field?.name || "Unnamed Field"}
              </label>

              <input
                type={fieldType}
                placeholder={field?.name || "Enter value"}
                className="border rounded-lg px-3 py-2"
              />
            </div>
          );
        })}

        <button
          type="submit"
          className="bg-black text-white rounded-lg py-2 px-4 mt-2"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

function DynamicTable({ component }: any) {
  return (
    <div className="border rounded-xl p-6 shadow-sm bg-white mt-6 overflow-auto">
      <h2 className="text-xl font-bold mb-4">
        {component.title || component.table || "Dynamic Table"}
      </h2>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">Demo Column</th>
            <th className="border p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2">Dynamic Rendering Active</td>
            <td className="border p-2">Success</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function DynamicRenderer({ config }: { config: AppConfig }) {
  const pages = config?.pages || [];

  const registry: Record<string, any> = {
    form: DynamicForm,
    table: DynamicTable
  };

  if (pages.length === 0) {
    return (
      <div className="border rounded-xl p-6 bg-yellow-50 border-yellow-300 mt-6">
        <h2 className="font-bold text-yellow-800">No Pages Configured</h2>
        <p className="text-yellow-700 text-sm mt-2">
          Your config does not contain any pages.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pages.map((component, index) => {
        const Renderer = registry[component?.type || ""];

        if (!Renderer) {
          return (
            <UnsupportedComponent key={index} type={component?.type} />
          );
        }

        return (
          <Renderer
            key={index}
            component={component}
            config={config}
          />
        );
      })}
    </div>
  );
}

export default function Home() {
  const [config, setConfig] = useState<AppConfig>({});
  const [apps, setApps] = useState<RuntimeApp[]>([]);
  const [activeAppId, setActiveAppId] = useState<string>("default");
  const [mode, setMode] = useState<string>("builder");
  const [creatingApp, setCreatingApp] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `http://localhost:5050/config?appId=${activeAppId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch config");
        }

        const data = await response.json();
        setConfig(data?.config ?? {});
      } catch (err: any) {
        setError(err?.message || "Unknown error");
        setConfig({});
      } finally {
        setLoading(false);
      }
    };

    const loadApps = async () => {
      try {
        const response = await fetch("http://localhost:5050/apps");

        const data = await response.json();

        setApps(data?.apps || []);
      } catch (err) {
        console.error("Failed to load apps", err);
      }
    };

    loadConfig();
    loadApps();
  }, [activeAppId]);

  const switchApp = async (appId: string) => {
    try {
      await fetch(`http://localhost:5050/switch-app/${appId}`, {
        method: "POST"
      });

      setActiveAppId(appId);
    } catch (err) {
      console.error("Failed to switch app", err);
    }
  };

  const createApp = async () => {
    if (!newAppName.trim()) {
      alert("Please enter app name");
      return;
    }

    try {
      const appId = newAppName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const payload = {
        id: appId,
        appName: newAppName,
        pages: [
          {
            type: "table",
            title: "Sample Table",
            table: "items"
          },
          {
            type: "form",
            title: "Create Item",
            table: "items"
          }
        ],
        db: {
          tables: [
            {
              name: "items",
              fields: [
                {
                  name: "title",
                  type: "text"
                },
                {
                  name: "status",
                  type: "text"
                }
              ]
            }
          ]
        }
      };

      const response = await fetch("http://localhost:5050/load-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to create app");
      }

      setCreatingApp(false);
      setNewAppName("");

      await switchApp(appId);

      const appsResponse = await fetch("http://localhost:5050/apps");
      const appsData = await appsResponse.json();

      setApps(appsData?.apps || []);
    } catch (err) {
      console.error(err);
      alert("Failed to create app");
    }
  };

  const appName = useMemo(() => {
    return config?.appName || "AI App Generator";
  }, [config]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Application...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f172a] text-white flex">

      {/* SIDEBAR */}
      <div className="w-72 bg-[#111827] border-r border-gray-800 text-white p-5 flex flex-col">

        <div className="mb-8">
          <h1 className="text-2xl font-bold">AI App Builder</h1>
          <p className="text-sm text-gray-400 mt-1">
            Multi-App Runtime Platform
          </p>
        </div>

        <button
          onClick={() => setCreatingApp(true)}
          className="mb-5 w-full bg-white text-black font-semibold py-3 rounded-xl hover:opacity-90 transition-all"
        >
          + Create App
        </button>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider text-gray-400">
            Applications
          </h2>

          <span className="bg-green-600 px-2 py-1 rounded-full text-xs">
            {apps.length}
          </span>
        </div>

        <div className="space-y-2 mb-8 overflow-auto">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => switchApp(app.id || "default")}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                activeAppId === app.id
                  ? "bg-white text-black border-white"
                  : "bg-[#1f2937] border-gray-700 hover:border-gray-500"
              }`}
            >
              <div className="font-semibold">
                {app.appName || "Untitled App"}
              </div>

              <div className="text-xs mt-2 opacity-70">
                {app.pages || 0} pages • {app.tables || 0} tables
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-2 mt-auto">
          <button
            onClick={() => setMode("builder")}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              mode === "builder"
                ? "bg-white text-black"
                : "bg-[#1f2937]"
            }`}
          >
            Builder
          </button>

          <button
            onClick={() => setMode("preview")}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              mode === "preview"
                ? "bg-white text-black"
                : "bg-[#1f2937]"
            }`}
          >
            Preview
          </button>

          <button
            onClick={() => setMode("runtime")}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              mode === "runtime"
                ? "bg-white text-black"
                : "bg-[#1f2937]"
            }`}
          >
            Runtime
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6 overflow-auto">

        {creatingApp && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">

              <h2 className="text-2xl font-bold mb-2">
                Create New App
              </h2>

              <p className="text-sm text-gray-400 mb-5">
                Generate a new runtime application instantly.
              </p>

              <input
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                placeholder="Enter app name"
                className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-3 text-white outline-none"
              />

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setCreatingApp(false)}
                  className="flex-1 bg-[#1f2937] py-3 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  onClick={createApp}
                  className="flex-1 bg-white text-black font-semibold py-3 rounded-xl"
                >
                  Generate App
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {config?.appName || "Dashboard"}
            </h1>

            <p className="text-sm text-gray-400 mt-1">
              Active Runtime: {activeAppId}
            </p>
          </div>
          <div className="text-sm px-4 py-2 rounded-full bg-green-600 text-white shadow-lg">
            ● Live Runtime
          </div>
        </div>

        {mode === "builder" && (
          <div className="mb-6">

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#111827] border border-gray-800 p-5 rounded-2xl shadow-lg">
                <h2 className="text-xs uppercase tracking-wide text-gray-400">
                  Active App
                </h2>

                <div className="mt-3 text-2xl font-bold text-white">
                  {config?.appName || "No App"}
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  Runtime ID: {activeAppId}
                </div>
              </div>

              <div className="bg-[#111827] border border-gray-800 p-5 rounded-2xl shadow-lg text-white">
                <h2 className="font-bold">Config</h2>
                <p className="text-sm">Tables: {config?.db?.tables?.length || 0}</p>
              </div>

              <div className="bg-[#111827] border border-gray-800 p-5 rounded-2xl shadow-lg text-white">
                <h2 className="font-bold">Pages</h2>
                <p className="text-sm">{config?.pages?.length || 0}</p>
              </div>

              <div className="bg-[#111827] border border-gray-800 p-5 rounded-2xl shadow-lg text-white">
                <button onClick={() => window.location.reload()} className="bg-black text-white px-3 py-2 rounded">
                  Refresh
                </button>
              </div>
            </div>

            <div className="mb-6">
              <CSVUploader
                table="items"
                onImportComplete={() => {
                  fetch("http://localhost:5050/config")
                    .then(res => res.json())
                    .then(data => setConfig(data.config || {}));
                }}
              />
            </div>

          </div>
        )}

        {mode === "builder" && <DynamicRenderer config={config || {}} />}

        {mode === "preview" && (
          <div className="bg-white p-4 rounded-xl border">
            <DynamicRenderer config={config || {}} />
          </div>
        )}

        {mode === "runtime" && (
          <div className="bg-black text-white p-4 rounded-xl">
            <DynamicRenderer config={config || {}} />
          </div>
        )}

      </div>
    </main>
  );
}