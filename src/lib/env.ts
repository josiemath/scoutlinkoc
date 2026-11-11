import { parseConfig, type AppConfig } from "./config-schema";

export { isPrivilegedSupabaseKey, parseConfig, UnsafeConfigurationError, type AppConfig } from "./config-schema";

/** Browser configuration for this build. */
export const config: AppConfig = parseConfig(import.meta.env);
