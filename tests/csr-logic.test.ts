import { isNoise, calculateCsr } from '@/lib/csr-logic';

describe('CSR Logic', () => {
  describe('isNoise', () => {
    it('identifies documentation as noise', () => {
      expect(isNoise('README.md')).toBe(true);
      expect(isNoise('docs/index.md')).toBe(true);
    });

    it('identifies lockfiles as noise', () => {
      expect(isNoise('package-lock.json')).toBe(true);
      expect(isNoise('yarn.lock')).toBe(true);
    });

    it('identifies hidden files as noise', () => {
      expect(isNoise('.gitignore')).toBe(true);
      expect(isNoise('.env')).toBe(true);
    });

    it('allows source code files', () => {
      expect(isNoise('src/index.ts')).toBe(false);
      expect(isNoise('lib/utils.js')).toBe(false);
      expect(isNoise('app/page.tsx')).toBe(false);
    });
  });

  describe('calculateCsr', () => {
    it('calculates percentage correctly', () => {
      expect(calculateCsr(50, 100)).toBe(50);
      expect(calculateCsr(75, 100)).toBe(75);
      expect(calculateCsr(10, 10)).toBe(100);
    });

    it('handles zero original lines', () => {
      expect(calculateCsr(0, 0)).toBe(0);
      expect(calculateCsr(5, 0)).toBe(0);
    });
  });
});
