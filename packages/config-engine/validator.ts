export function validateConfig(config: any) {
  if (!config.db?.tables) {
    throw new Error("Missing DB tables");
  }

  return true;
}