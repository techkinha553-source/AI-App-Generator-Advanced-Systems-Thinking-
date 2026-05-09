import { generateToken } from "./auth/auth";
import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { validateConfig } from "../../../packages/config-engine/validator";
import { normalizeConfig } from "../../../packages/config-engine";
import { createTables } from "../../../packages/db-engine/schema";
import { create } from "../../../packages/api-engine/crud";
import { read } from "../../../packages/api-engine/read";
import { update } from "../../../packages/api-engine/update";
import { remove } from "../../../packages/api-engine/delete";
import authRoutes from "./auth/routes";
import importRoutes from "./routes/import";

type AppConfig = {
  id?: string;
  appName?: string;
  pages?: any[];
  db?: { tables?: any[] };
  features?: any;
  auth?: boolean;
  createdAt?: string;
};

// Multi-app registry
const appRegistry: Record<string, AppConfig> = {};

// Active runtime app
let globalConfig: AppConfig = {
  id: "default",
  appName: "AI App Generator",
  pages: [],
  db: { tables: [] },
  features: {},
  auth: false,
  createdAt: new Date().toISOString()
};

appRegistry["default"] = globalConfig;

const app = express();

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/api/import", importRoutes);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

dotenv.config();

const sendError = (
  res: Response,
  status: number,
  message: string,
  details?: unknown
) => {
  return res.status(status).json({
    success: false,
    error: message,
    details: process.env.NODE_ENV === "development"
      ? details
      : undefined
  });
};

const ensureConfigLoaded = (res: Response) => {
  if (!globalConfig || !globalConfig?.db?.tables) {
    sendError(res, 400, "No config loaded");
    return false;
  }

  return true;
};

const getAppConfig = (appId?: string): AppConfig => {
  if (!appId) return globalConfig;

  return appRegistry[appId] || globalConfig;
};

const tableExists = (table: string, appId?: string) => {
  const config = getAppConfig(appId);

  const tables = config?.db?.tables || [];

  return tables.some((t: any) => t.name === table);
};

app.get("/config", (req: Request, res: Response) => {
  const appId = (req.query.appId as string) || "default";

  const config = appRegistry[appId];

  if (!config) {
    return sendError(res, 404, `App '${appId}' not found`);
  }

  res.json({
    success: true,
    config,
    loaded: Boolean(config?.db?.tables?.length || config?.pages?.length)
  });
});

// Active runtime metadata
app.get("/active-app", (req: Request, res: Response) => {
  res.json({
    success: true,
    activeApp: {
      id: globalConfig.id,
      appName: globalConfig.appName,
      pages: globalConfig.pages?.length || 0,
      tables: globalConfig.db?.tables?.length || 0,
      createdAt: globalConfig.createdAt
    }
  });
});

// List all apps
app.get("/apps", (req: Request, res: Response) => {
  const apps = Object.values(appRegistry).map((app) => ({
    id: app.id,
    appName: app.appName,
    pages: app.pages?.length || 0,
    tables: app.db?.tables?.length || 0,
    createdAt: app.createdAt
  }));

  res.json({
    success: true,
    total: apps.length,
    apps
  });
});

// Switch active app runtime
app.post<{ id: string }>("/switch-app/:id", (req: Request<{ id: string }>, res: Response) => {
  const appId = req.params.id;

  const appConfig = appRegistry[appId];

  if (!appConfig) {
    return sendError(res, 404, `App '${appId}' not found`);
  }

  globalConfig = appConfig;

  res.json({
    success: true,
    activeApp: appId,
    appName: appConfig.appName
  });
});

app.get("/api/tables", (req: Request, res: Response) => {
  try {
    const tables = globalConfig?.db?.tables || [];

    res.json({ tables });
  } catch (err) {
    sendError(res, 500, "Failed to fetch tables", err);
  }
});

app.post("/load-config", async (req: Request, res: Response) => {
  try {
    validateConfig(req.body);

    const normalized = normalizeConfig(req.body);

    const appId = req.body.id || `app_${Date.now()}`;

    const newConfig: AppConfig = {
      id: appId,
      appName: normalized.appName || req.body.appName || "Untitled App",
      pages: normalized.pages || req.body.pages || req.body.ui || [],
      db: {
        tables: normalized.db?.tables || req.body.db?.tables || []
      },
      features: normalized.features || {},
      auth: normalized.auth || false,
      createdAt: new Date().toISOString()
    };

    // Store app in registry
    appRegistry[appId] = newConfig;

    // Set active runtime app
    globalConfig = newConfig;

    // Auto-create DB schema
    if (newConfig.db?.tables?.length) {
      await createTables(newConfig.db.tables);
    }

    res.json({
      success: true,
      message: "App config loaded successfully",
      appId,
      pages: newConfig.pages?.length || 0,
      tables: newConfig.db?.tables?.length || 0
    });
  } catch (err) {
    sendError(res, 500, "Config failed", err);
  }
});

app.post("/api/:table", async (req: Request, res: Response) => {
  try {
    const table = req.params.table as string;

    const appId = req.query.appId as string | undefined;

    const config = getAppConfig(appId);

    if (!ensureConfigLoaded(res)) {
      return;
    }

    if (!tableExists(table, appId)) {
      return sendError(res, 404, `Table '${table}' not found in config`);
    }

    const result = await create(table, req.body);

    res.json(result);
  } catch (err) {
    sendError(res, 400, "Insert failed", err);
  }
});

app.get("/api/:table", async (req: Request, res: Response) => {
  try {
    const table = req.params.table as string;

    const appId = req.query.appId as string | undefined;

    const config = getAppConfig(appId);

    if (!ensureConfigLoaded(res)) {
      return;
    }

    if (!tableExists(table, appId)) {
      return sendError(res, 404, `Table '${table}' not found in config`);
    }

    const data = await read(table);

    res.json(data);
  } catch (err) {
    sendError(res, 400, "Fetch failed", err);
  }
});

app.put("/api/:table/:id", async (req: Request, res: Response) => {
  try {
    const table = req.params.table as string;

    const appId = req.query.appId as string | undefined;

    const config = getAppConfig(appId);

    if (!ensureConfigLoaded(res)) {
      return;
    }

    if (!tableExists(table, appId)) {
      return sendError(res, 404, `Table '${table}' not found in config`);
    }

    const id = req.params.id as string;

    const result = await update(table, id, req.body);

    res.json(result);
  } catch (err) {
    sendError(res, 400, "Update failed", err);
  }
});

app.delete("/api/:table/:id", async (req: Request, res: Response) => {
  try {
    const table = req.params.table as string;

    const appId = req.query.appId as string | undefined;

    const config = getAppConfig(appId);

    if (!ensureConfigLoaded(res)) {
      return;
    }

    if (!tableExists(table, appId)) {
      return sendError(res, 404, `Table '${table}' not found in config`);
    }

    const id = req.params.id as string;

    const result = await remove(table, id);

    res.json(result);
  } catch (err) {
    sendError(res, 400, "Delete failed", err);
  }
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error("UNHANDLED ERROR:", err);

  sendError(res, 500, "Internal server error", err);
});

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Backend running on ${PORT}`);
});

app.get("/", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "AI App Generator Backend",
    configLoaded: Object.keys(globalConfig).length > 0
  });
});