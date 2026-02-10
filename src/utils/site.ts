/**
 * Site-wide utility functions shared across pages/layouts.
 * Add reusable helpers here to avoid duplicating logic in Astro files.
 */

/**
 * Prefix a relative path with Astro's configured base path.
 * This keeps links/assets working when deployed under a subpath (e.g. /MuhWebby/).
 */
export const withBase = (path = ""): string => {
	const base = import.meta.env.BASE_URL || "/";
	const normalizedBase =
		base === "/"
			? "/"
			: `/${base.replace(/^\/+|\/+$/g, "")}/`;
	const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
	const resolvedPath = `${normalizedBase}${normalizedPath}`.replace(/\/{2,}/g, "/");

	// Runs during Astro rendering/build and logs to terminal for URL debugging.
	if (import.meta.env.DEV) {
		console.debug("[withBase]", { base, path, resolvedPath });
	}

	return resolvedPath;
};
