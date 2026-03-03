/**
 * Sanitize a string for use in a filename.
 * Removes non-alphanumeric characters (except ._- and space),
 * trims whitespace, and replaces internal spaces with hyphens.
 */
export const sanitizeFilePart = (value: string): string => {
  return value
    .replace(/[^a-zA-Z0-9._\- ]+/g, '')
    .trim()
    .replace(/\s+/g, '-');
};
