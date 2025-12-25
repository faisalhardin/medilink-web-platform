/**
 * Utility functions for version parsing and validation
 */

/**
 * Parses version string to numeric value
 * @param version - Version string (e.g., "2.0", "1.5", "1.0")
 * @returns Numeric version for comparison (e.g., 2.0, 1.5, 1.0)
 * @default 1.0 if version is undefined or invalid
 */
export function parseVersion(version: string | undefined): number {
  if (!version) {
    return 1.0;
  }

  const parsed = parseFloat(version);
  if (isNaN(parsed)) {
    return 1.0;
  }

  return parsed;
}

/**
 * Checks if version is editable (>= 2.0)
 * @param version - Version string
 * @returns true if version >= 2.0, false otherwise
 */
export function isVersionEditable(version: string | undefined): boolean {
  return parseVersion(version) >= 2.0;
}

/**
 * Extracts version from EditorJS block data
 * @param block - EditorJS block object
 * @returns Version string or undefined
 */
export function getVersionFromBlock(block: any): string | undefined {
  // Check block.version (block-level, per planning doc specification)
  if (block && typeof block.version === 'string') {
    return block.version;
  }

  return undefined;
}


