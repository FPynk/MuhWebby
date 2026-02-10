/**
 * Site-wide utility functions shared across pages/layouts.
 * Add reusable helpers here to avoid duplicating logic in Astro files.
 */

/**
 * Prefix a relative path with Astro's configured base path.
 * This keeps links/assets working when deployed under a subpath (e.g. /MuhWebby/).
 */
export const withBase = (path = ""): string => {
	const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
	return `${import.meta.env.BASE_URL}/${normalizedPath}`;
};
