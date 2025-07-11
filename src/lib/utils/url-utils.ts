/**
 * Joins a base URL with a path, ensuring there's exactly one slash between them
 * @param baseUrl - The base URL (e.g., "https://example.com" or "https://example.com/")
 * @param path - The path to append (e.g., "about" or "/about")
 * @returns The properly joined URL
 */
export function joinUrl(baseUrl: string, path: string): string {
  if (!baseUrl || !path) {
    return baseUrl || path || '';
  }

  // Remove trailing slash from base URL
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  
  // Remove leading slash from path
  const cleanPath = path.replace(/^\/+/, '');
  
  // Join with exactly one slash
  return `${cleanBaseUrl}/${cleanPath}`;
}

/**
 * Ensures a URL ends with a slash
 * @param url - The URL to normalize
 * @returns The URL with a trailing slash
 */
export function ensureTrailingSlash(url: string): string {
  if (!url) return '';
  return url.endsWith('/') ? url : `${url}/`;
}

/**
 * Ensures a URL does not end with a slash
 * @param url - The URL to normalize
 * @returns The URL without a trailing slash
 */
export function removeTrailingSlash(url: string): string {
  if (!url) return '';
  return url.replace(/\/+$/, '');
}

/**
 * Normalizes a URL path by removing leading/trailing slashes and double slashes
 * @param path - The path to normalize
 * @returns The normalized path
 */
export function normalizePath(path: string): string {
  if (!path) return '';
  
  return path
    .split('/')
    .filter(segment => segment.length > 0)
    .join('/');
} 