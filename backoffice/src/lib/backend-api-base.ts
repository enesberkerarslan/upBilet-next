/**
 * Sunucu tarafı (Route Handler, serverFetch) backend tabanı.
 * Önce BACKEND_API_BASE_URL (Docker/canlı), yoksa NEXT_PUBLIC_API_URL (build / local).
 */
export function getBackendApiBase(): string {
  return (
    process.env.BACKEND_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3002/api'
  );
}
