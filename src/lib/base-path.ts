/**
 * Normalizes a deployment base path so Vite always receives "/" or "/name/".
 *
 * GitHub Pages project sites live under "/<repository>/", while custom domains
 * and local development use "/". The value comes from VITE_BASE_PATH, which the
 * deploy workflow derives from the repository name, so no username or
 * repository is hardcoded here.
 */
export function normalizeBasePath(raw: string | undefined | null): string {
  const value = (raw ?? "").trim();
  if (value === "" || value === "/" || value === ".") return "/";
  if (/^[a-z]+:\/\//i.test(value)) {
    throw new Error(`VITE_BASE_PATH must be a path such as "/scoutlink-oc/", not a full URL (got "${value}").`);
  }
  const segments = value.split("/").filter(Boolean);
  for (const segment of segments) {
    if (segment === "." || segment === ".." || !/^[A-Za-z0-9._~-]+$/.test(segment)) {
      throw new Error(`VITE_BASE_PATH contains an unsupported segment "${segment}".`);
    }
  }
  return `/${segments.join("/")}/`;
}
