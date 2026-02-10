/**
 * Site-wide utility functions shared across pages/layouts.
 * Add reusable helpers here to avoid duplicating logic in Astro files.
 */

/**
 * Prefix a relative path with Astro's configured base path.
 * This keeps links/assets working when deployed under a subpath (e.g. /MuhWebby/).
 */
export const withBase = (path = ""): string => {
	// Astro exposes BASE_URL as "/" in root deploys, or "/<repo>/" for GitHub Pages.
	const base = import.meta.env.BASE_URL || "/";

	// Normalize base into one stable format:
	// - root deploy stays "/"
	// - subpath deploy becomes "/MuhWebby/" (single leading/trailing slash)
	const normalizedBase =
		base === "/"
			? "/"
			: `/${base.replace(/^\/+|\/+$/g, "")}/`;

	// Accept both "resume/" and "/resume/" callers.
	const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

	// Join base + path and collapse accidental double slashes in the middle.
	const resolvedPath = `${normalizedBase}${normalizedPath}`.replace(/\/{2,}/g, "/");

	return resolvedPath;
};
