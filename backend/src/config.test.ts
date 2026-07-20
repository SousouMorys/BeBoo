import { describe, expect, it } from 'vitest';
import { supportsExplicitImageInputFidelity } from './config.js';

describe('supportsExplicitImageInputFidelity', () => {
  it('omits the unsupported parameter for mini and GPT Image 2', () => {
    expect(supportsExplicitImageInputFidelity('gpt-image-1-mini')).toBe(false);
    expect(supportsExplicitImageInputFidelity('gpt-image-2')).toBe(false);
  });

  it('uses the explicit option only for supported image-one models', () => {
    expect(supportsExplicitImageInputFidelity('gpt-image-1')).toBe(true);
    expect(supportsExplicitImageInputFidelity('gpt-image-1.5')).toBe(true);
    expect(supportsExplicitImageInputFidelity('gpt-image-1.5-2025-12-16')).toBe(true);
  });
});
