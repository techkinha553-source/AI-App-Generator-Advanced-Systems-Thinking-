export function normalizeConfig(config: any) {
  return {
    appName: config.appName || "Generated App",
    auth: config.auth ?? false,
    db: config.db || { tables: [] },
    ui: config.ui || [],
    pages: config.pages || config.ui || [],
    features: config.features || {}
  };
}