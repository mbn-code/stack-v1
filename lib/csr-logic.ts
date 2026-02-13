import path from 'path';

/**
 * Determines if a file path should be excluded from CSR analysis.
 * Excludes documentation, config files, lockfiles, and hidden files.
 */
export function isNoise(file: string): boolean {
  const noiseExtensions = ['.md', '.txt', '.json', '.yaml', '.yml', '.lock', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.pdf'];
  const noiseFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'composer.lock', 'Gemfile.lock'];
  const basename = path.basename(file);
  
  return (
    noiseExtensions.some(ext => file.toLowerCase().endsWith(ext)) ||
    noiseFiles.includes(basename) ||
    basename.startsWith('.') ||
    file.includes('/docs/') ||
    file.includes('/test/') ||
    file.includes('/tests/')
  );
}

/**
 * Calculates the CSR percentage based on surviving and original line counts.
 * Returns 0 if no original lines were found.
 */
export function calculateCsr(surviving: number, original: number): number {
  if (original <= 0) return 0;
  return (surviving / original) * 100;
}
