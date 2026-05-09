import { useEffect, useState } from "react";
import { getConfig } from "../services/api";

export function useConfig() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);

        const data = await getConfig();

        setConfig(data?.config || {});
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Failed to load config");
        setConfig({});
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  return {
    config,
    loading,
    error
  };
}